import { Storage } from '@google-cloud/storage';
import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Support both local (keyFilename) and Vercel (GCP_KEY_JSON env var)
const storageOptions: any = {
  projectId: process.env.GCP_PROJECT_ID,
};

if (process.env.GCP_KEY_JSON) {
  // Vercel deployment — credentials passed as JSON string in env var
  storageOptions.credentials = JSON.parse(process.env.GCP_KEY_JSON);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Local dev — path to gcp-key.json file
  storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const storage = new Storage(storageOptions);
const bucketName = process.env.GCP_BUCKET_NAME!;

/**
 * Feature 1: Google Cloud Storage
 * Uploads an image buffer to GCS and returns the public URL.
 */
export async function uploadImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const ext = path.extname(originalName) || '.jpg';
  const filename = `products/${randomUUID()}${ext}`;
  const file = bucket.file(filename);

  // await file.save(buffer, {
  //   metadata: { contentType: mimeType },
  // });

  // // Make the file publicly readable
  // await file.makePublic();

  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });
  
  return `https://storage.googleapis.com/${bucketName}/${filename}`;

  
}
