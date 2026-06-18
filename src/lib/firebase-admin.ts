import { readFileSync } from "node:fs";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccountJson(raw: string): ServiceAccount {
  return JSON.parse(raw) as ServiceAccount;
}

function loadServiceAccount(): ServiceAccount {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (base64) {
    return parseServiceAccountJson(
      Buffer.from(base64, "base64").toString("utf8"),
    );
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    return parseServiceAccountJson(json);
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    return parseServiceAccountJson(readFileSync(credPath, "utf8"));
  }

  throw new Error(
    [
      "Firebase Admin is not configured.",
      "Vercel: set FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 in Project → Environment Variables.",
      "Local: same env var in .env.local, or GOOGLE_APPLICATION_CREDENTIALS to a key file.",
      "Generate values: node scripts/encode-firebase-admin-env.mjs",
    ].join(" "),
  );
}

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.FIREBASE_PROJECT_ID;

  const serviceAccount = loadServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId ?? projectId,
  });
}

export function getAdminAuth() {
  return getAuth(initAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(initAdminApp());
}
