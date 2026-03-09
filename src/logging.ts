import { Logging } from '@google-cloud/logging';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Feature 2: Google Cloud Logging
 * Sends structured logs to GCP Cloud Logging.
 * Falls back to console.log if GCP is not configured.
 */

let gcpLogger: any = null;

if (process.env.GCP_PROJECT_ID) {
  try {
    const loggingOptions: any = { projectId: process.env.GCP_PROJECT_ID };

    if (process.env.GCP_KEY_JSON) {
      loggingOptions.credentials = JSON.parse(process.env.GCP_KEY_JSON);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      loggingOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    const logging = new Logging(loggingOptions);
    gcpLogger = logging.log('product-catalogue-app');
    console.log('✅ GCP Cloud Logging connected');
  } catch (e) {
    console.log('ℹ️  GCP Cloud Logging setup failed, using console fallback');
  }
} else {
  console.log('ℹ️  GCP_PROJECT_ID not set — using console logging only');
}

export async function logEvent(
  message: string,
  severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO',
  data?: Record<string, unknown>
) {
  const payload = data ? `${message} ${JSON.stringify(data)}` : message;

  // Always log to console as well
  console.log(`[${severity}] ${payload}`);

  // Send to GCP Cloud Logging if configured
  if (gcpLogger) {
    try {
      const entry = gcpLogger.entry({ severity }, { message, ...data });
      await gcpLogger.write(entry);
    } catch {
      // Logging should never crash the app
    }
  }
}
