import { Router, Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../db';
import { uploadImage } from '../gcp';
import { logEvent } from '../logging';

const router = Router();

// Store file in memory buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

// ── Validation ────────────────────────────────────────────────────────────────
function validate(body: Record<string, unknown>): string | null {
  const { name, price, category } = body;
  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return 'Product name must be at least 2 characters.';
  if (name.toString().trim().length > 100)
    return 'Product name must be under 100 characters.';
  if (price === undefined || price === '')
    return 'Price is required.';
  const priceNum = Number(price);
  if (isNaN(priceNum) || priceNum < 0)
    return 'Price must be a valid non-negative number.';
  if (priceNum > 1_000_000)
    return 'Price is too high.';
  if (!category || typeof category !== 'string' || category.trim().length < 1)
    return 'Category is required.';
  return null;
}

// ── GET /api/products ─────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    logEvent('Products fetched', 'INFO', { count: rows.length });
    return res.json(rows);
  } catch (e) {
    logEvent('Failed to fetch products', 'ERROR');
    console.error('DB fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  const err = validate(req.body);
  if (err) {
    logEvent('Validation failed', 'WARNING', { error: err });
    return res.status(400).json({ error: err });
  }

  const { name, price, category, description } = req.body as {
    name: string; price: string; category: string; description?: string;
  };

  // Upload image to GCP Cloud Storage if provided
  const DEFAULT_IMAGE = 'https://placehold.co/400x300?text=No+Image';
  let imageUrl: string = DEFAULT_IMAGE;
  if (req.file && process.env.GCP_BUCKET_NAME) {
    try {
      imageUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
      logEvent('Image uploaded to GCS', 'INFO', { imageUrl });
    } catch (e) {
      logEvent('GCS upload failed', 'ERROR');
      console.error('GCS upload error:', e);
      return res.status(500).json({ error: 'Failed to upload image.' });
    }
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, price, category, description, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), Number(price), category.trim(), description?.trim() || null, imageUrl]
    );
    logEvent('Product added', 'INFO', { name, price, category });
    return res.status(201).json(rows[0]);
  } catch (e) {
    logEvent('Failed to insert product', 'ERROR');
    console.error('DB insert error:', e);
    return res.status(500).json({ error: 'Failed to save product.' });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    logEvent('Product deleted', 'INFO', { id });
    return res.json({ message: 'Product deleted.' });
  } catch (e) {
    logEvent('Failed to delete product', 'ERROR');
    console.error('DB delete error:', e);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

export default router;
