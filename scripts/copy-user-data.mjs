/**
 * Copy all Firestore data from one Firebase Auth user to another.
 *
 * Requires Firebase Admin credentials (bypasses client security rules):
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *
 * Usage:
 *   npm run copy-user-data -- --from dwayne@zined.io --to dwaynedehoedt@gmail.com
 *   npm run copy-user-data -- --from dwayne@zined.io --to dwaynedehoedt@gmail.com --dry-run
 *   npm run copy-user-data -- --from dwayne@zined.io --to dwaynedehoedt@gmail.com --overwrite
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const USER_COLLECTIONS = [
  "contacts",
  "companies",
  "wallets",
  "transactions",
  "fixedDeposits",
  "activities",
  "notes",
  "goals",
  "lifeEvents",
];

const USER_SUBCOLLECTIONS = ["integrations", "preferences", "onboarding"];

function parseArgs(argv) {
  const args = {
    from: "dwayne@zined.io",
    to: "dwaynedehoedt@gmail.com",
    dryRun: false,
    overwrite: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--from") args.from = argv[++i];
    else if (arg === "--to") args.to = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--overwrite") args.overwrite = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }

  return args;
}

function initAdmin() {
  if (getApps().length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "relio-18820";

  if (json) {
    initializeApp({
      credential: cert(JSON.parse(json)),
      projectId,
    });
    return;
  }

  if (credPath) {
    const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id ?? projectId,
    });
    return;
  }

  throw new Error(
    [
      "Firebase Admin credentials required.",
      "Download a service account key from Firebase Console:",
      "  Project Settings → Service accounts → Generate new private key",
      "Then run:",
      '  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"',
      "  npm run copy-user-data",
    ].join("\n"),
  );
}

async function getUserByEmail(auth, email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new Error(
        `No Firebase user found for ${email}. Sign in to Relio once with that account first.`,
      );
    }
    throw error;
  }
}

async function queryByUserId(db, collectionName, userId) {
  const snapshot = await db
    .collection(collectionName)
    .where("userId", "==", userId)
    .get();
  return snapshot.docs;
}

async function deleteUserData(db, userId, { dryRun }) {
  console.log(`\nClearing existing data for user ${userId}...`);

  for (const collectionName of USER_COLLECTIONS) {
    const docs = await queryByUserId(db, collectionName, userId);
    if (docs.length === 0) continue;

    console.log(`  delete ${collectionName}: ${docs.length}`);
    if (dryRun) continue;

    await batchDelete(db, docs.map((docSnap) => docSnap.ref));
  }

  for (const sub of USER_SUBCOLLECTIONS) {
    const snapshot = await db.collection("users").doc(userId).collection(sub).get();
    if (snapshot.empty) continue;

    console.log(`  delete users/${userId}/${sub}: ${snapshot.size}`);
    if (dryRun) continue;

    await batchDelete(db, snapshot.docs.map((docSnap) => docSnap.ref));
  }
}

async function batchDelete(db, refs) {
  const chunkSize = 500;
  for (let i = 0; i < refs.length; i += chunkSize) {
    const batch = db.batch();
    refs.slice(i, i + chunkSize).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function batchSet(db, entries, { dryRun }) {
  if (entries.length === 0) return;

  if (dryRun) {
    console.log(`  would write ${entries.length} documents`);
    return;
  }

  const chunkSize = 500;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const batch = db.batch();
    entries.slice(i, i + chunkSize).forEach(({ ref, data }) => {
      batch.set(ref, data);
    });
    await batch.commit();
  }
}

function remapIds(ids, map) {
  if (!Array.isArray(ids)) return ids;
  return ids.map((id) => map.get(id) ?? id);
}

async function copyCollection(
  db,
  collectionName,
  sourceUserId,
  targetUserId,
  transform,
  { dryRun },
) {
  const docs = await queryByUserId(db, collectionName, sourceUserId);
  const idMap = new Map();
  const entries = [];

  for (const docSnap of docs) {
    const data = docSnap.data();
    const transformed = transform
      ? transform(data, docSnap.id, idMap)
      : { ...data, userId: targetUserId };

    const newRef = db.collection(collectionName).doc();
    idMap.set(docSnap.id, newRef.id);
    entries.push({ ref: newRef, data: transformed });
  }

  console.log(`  ${collectionName}: ${docs.length}`);
  await batchSet(db, entries, { dryRun });

  return idMap;
}

async function copyUserSubcollections(db, sourceUserId, targetUserId, { dryRun }) {
  for (const sub of USER_SUBCOLLECTIONS) {
    const snapshot = await db
      .collection("users")
      .doc(sourceUserId)
      .collection(sub)
      .get();

    if (snapshot.empty) {
      console.log(`  users/*/${sub}: 0`);
      continue;
    }

    console.log(`  users/*/${sub}: ${snapshot.size}`);

    const entries = snapshot.docs.map((docSnap) => ({
      ref: db
        .collection("users")
        .doc(targetUserId)
        .collection(sub)
        .doc(docSnap.id),
      data: docSnap.data(),
    }));

    await batchSet(db, entries, { dryRun });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Copy all Relio Firestore data between two Firebase Auth users.

Options:
  --from <email>     Source account (default: dwayne@zined.io)
  --to <email>       Target account (default: dwaynedehoedt@gmail.com)
  --dry-run          Show counts only, do not write
  --overwrite        Delete target user's existing data first
  --help             Show this help

Setup:
  1. Firebase Console → Project Settings → Service accounts → Generate new private key
  2. export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
  3. Both accounts must have signed in to Relio at least once
`);
    return;
  }

  initAdmin();

  const auth = getAuth();
  const db = getFirestore();

  console.log("Looking up Firebase users...");
  const sourceUser = await getUserByEmail(auth, args.from);
  const targetUser = await getUserByEmail(auth, args.to);

  console.log(`  from: ${args.from} → ${sourceUser.uid}`);
  console.log(`  to:   ${args.to} → ${targetUser.uid}`);

  if (sourceUser.uid === targetUser.uid) {
    throw new Error("Source and target are the same user.");
  }

  if (args.overwrite) {
    await deleteUserData(db, targetUser.uid, args);
  }

  console.log(`\nCopying data${args.dryRun ? " (dry run)" : ""}...`);

  const companyIdMap = await copyCollection(
    db,
    "companies",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({ ...data, userId: targetUser.uid }),
    { dryRun: args.dryRun },
  );

  const contactIdMap = await copyCollection(
    db,
    "contacts",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({
      ...data,
      userId: targetUser.uid,
      ...(data.companyId && companyIdMap.has(data.companyId)
        ? { companyId: companyIdMap.get(data.companyId) }
        : {}),
    }),
    { dryRun: args.dryRun },
  );

  const walletIdMap = await copyCollection(
    db,
    "wallets",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({ ...data, userId: targetUser.uid }),
    { dryRun: args.dryRun },
  );

  await copyCollection(
    db,
    "transactions",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({
      ...data,
      userId: targetUser.uid,
      ...(data.walletId && walletIdMap.has(data.walletId)
        ? { walletId: walletIdMap.get(data.walletId) }
        : {}),
    }),
    { dryRun: args.dryRun },
  );

  await copyCollection(
    db,
    "fixedDeposits",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({ ...data, userId: targetUser.uid }),
    { dryRun: args.dryRun },
  );

  const noteIdMap = await copyCollection(
    db,
    "notes",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({
      ...data,
      userId: targetUser.uid,
      ...(data.linkedContactIds
        ? { linkedContactIds: remapIds(data.linkedContactIds, contactIdMap) }
        : {}),
      ...(data.linkedCompanyIds
        ? { linkedCompanyIds: remapIds(data.linkedCompanyIds, companyIdMap) }
        : {}),
    }),
    { dryRun: args.dryRun },
  );

  await copyCollection(
    db,
    "goals",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({
      ...data,
      userId: targetUser.uid,
      ...(data.linkedContactIds
        ? { linkedContactIds: remapIds(data.linkedContactIds, contactIdMap) }
        : {}),
      ...(data.linkedNoteIds
        ? { linkedNoteIds: remapIds(data.linkedNoteIds, noteIdMap) }
        : {}),
    }),
    { dryRun: args.dryRun },
  );

  await copyCollection(
    db,
    "lifeEvents",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({ ...data, userId: targetUser.uid }),
    { dryRun: args.dryRun },
  );

  await copyCollection(
    db,
    "activities",
    sourceUser.uid,
    targetUser.uid,
    (data) => ({ ...data, userId: targetUser.uid }),
    { dryRun: args.dryRun },
  );

  await copyUserSubcollections(db, sourceUser.uid, targetUser.uid, {
    dryRun: args.dryRun,
  });

  console.log(
    args.dryRun
      ? "\nDry run complete no data was written."
      : "\nDone! Sign in as the target user to verify your data.",
  );
}

main().catch((error) => {
  console.error("\nError:", error.message ?? error);
  process.exit(1);
});
