import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import productsRouter from './routes/products';
import { logEvent } from './logging';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/products', productsRouter);

app.get('/health', (_req, res) => {
  logEvent('Health check called', 'INFO');
  res.json({ status: 'ok' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logEvent(err.message, 'ERROR');
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  logEvent('Server started', 'INFO', { port: String(PORT) });
});
