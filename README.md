# Product Catalogue — Cloud Computing Assignment 2

**Stack:** Node.js + TypeScript · Neon DB (PostgreSQL) · GCP Cloud Storage · GCP Cloud Logging

---

## Cloud Features

| # | Feature | GCP Service | What it does |
|---|---|---|---|
| 1 | Image Storage | Google Cloud Storage | Stores product images with public URLs |
| 2 | Logging & Monitoring | Google Cloud Logging | Tracks all requests, errors, and events |

---

## Architecture

```
Browser
  │
  ▼
Vercel (Node.js + Express)
  ├──► Neon DB (PostgreSQL)        — stores product data
  ├──► GCP Cloud Storage           — stores product images
  └──► GCP Cloud Logging           — logs all events & errors
```

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Neon DB setup
1. Go to https://neon.tech → create free project
2. SQL Editor → run `supabase-schema.sql`
3. Copy your connection string

### 3. GCP Setup

#### Create a project
1. Go to https://console.cloud.google.com
2. Create new project → name it `product-catalogue`
3. Enable APIs: **Cloud Storage API** + **Cloud Logging API**

#### Create Storage Bucket
1. Cloud Storage → Create Bucket
2. Name: `product-catalogue-images-yourname` (must be globally unique)
3. After creation → Permissions → Grant Access:
   - Principal: `allUsers`
   - Role: `Storage Object Viewer`

#### Create Service Account (for local dev)
1. IAM & Admin → Service Accounts → Create
2. Name: `product-catalogue-sa`
3. Role: `Storage Object Admin` + `Logs Writer`
4. Keys → Add Key → JSON → download as `gcp-key.json`
5. Place `gcp-key.json` in project root (it's in .gitignore — never commit!)

### 4. Create .env
```bash
cp .env.example .env
```

Fill in:
```
DATABASE_URL=postgresql://...your neon string...
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=product-catalogue-images-yourname
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
PORT=3000
```

### 5. Add image_url column to Neon DB
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 6. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel

### 1. Build and push to GitHub
```bash
npm run build
git add .
git commit -m "add GCP features"
git push
```

### 2. Add Environment Variables in Vercel
In Vercel → your project → Settings → Environment Variables, add:

```
DATABASE_URL        = your neon connection string
GCP_PROJECT_ID      = your-gcp-project-id
GCP_BUCKET_NAME     = your-bucket-name
GCP_KEY_JSON        = (paste entire contents of gcp-key.json here)
```

> Note: On Vercel use GCP_KEY_JSON (the full JSON) instead of GOOGLE_APPLICATION_CREDENTIALS

### 3. Redeploy
Vercel auto-deploys on every git push.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Add product (multipart/form-data) |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/health` | Health check |
