/**
 * Print Firebase Admin env vars for Vercel / .env.local.
 *
 * Usage:
 *   node scripts/encode-firebase-admin-env.mjs /path/to/serviceAccountKey.json
 */

import { readFileSync } from "node:fs";

const filePath =
  process.argv[2] ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  "/Users/dwaynedehoedt/Downloads/relio-18820-firebase-adminsdk-fbsvc-055e5e7edd.json";

const serviceAccount = readFileSync(filePath, "utf8");
const minified = JSON.stringify(JSON.parse(serviceAccount));
const base64 = Buffer.from(minified, "utf8").toString("base64");

console.log(`
Add ONE of these to Vercel → Project → Settings → Environment Variables
(Production, Preview, and Development):

Option A — recommended (base64, no escaping issues):
  Name:  FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
  Value: ${base64}

Option B — raw JSON (single line):
  Name:  FIREBASE_SERVICE_ACCOUNT_JSON
  Value: ${minified}

Also keep locally in .env.local (same as Option A):
  FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=${base64}

Remove GOOGLE_APPLICATION_CREDENTIALS from Vercel — file paths do not work there.
`);
