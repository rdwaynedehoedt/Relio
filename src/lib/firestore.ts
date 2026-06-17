import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Company,
  Contact,
  HubSpotIntegration,
  UserPreferences,
} from "@/lib/types";

function parseContact(docSnap: { id: string; data: () => Record<string, unknown> }): Contact {
  const { leadStatus: _removed, ...data } = docSnap.data();
  return { id: docSnap.id, ...data } as Contact;
}

async function stripLegacyLeadStatus(
  docs: { id: string; data: () => Record<string, unknown> }[],
) {
  const legacyDocs = docs.filter((docSnap) => "leadStatus" in docSnap.data());
  if (!db || legacyDocs.length === 0) return;

  const firestore = db;

  await Promise.all(
    legacyDocs.map((docSnap) =>
      updateDoc(doc(firestore, "contacts", docSnap.id), {
        leadStatus: deleteField(),
      }),
    ),
  );
}

export async function getContacts(userId: string): Promise<Contact[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "contacts"), where("userId", "==", userId)),
  );

  await stripLegacyLeadStatus(snapshot.docs);

  return snapshot.docs
    .map(parseContact)
    .sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
}

export async function getCompanies(userId: string): Promise<Company[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "companies"), where("userId", "==", userId)),
  );

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Company)
    .sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
}

export async function getCompanyByName(
  userId: string,
  name: string,
): Promise<Company | null> {
  if (!db) return null;

  const snapshot = await getDocs(
    query(
      collection(db, "companies"),
      where("userId", "==", userId),
      where("name", "==", name),
    ),
  );

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Company;
}

export async function getContactsByCompany(
  userId: string,
  companyName: string,
): Promise<Contact[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(
      collection(db, "contacts"),
      where("userId", "==", userId),
      where("companyName", "==", companyName),
    ),
  );

  return snapshot.docs
    .map(parseContact)
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
}

async function ensureCompanyExists(
  userId: string,
  data: { name: string; country?: string; city?: string },
): Promise<void> {
  const existing = await getCompanyByName(userId, data.name);
  if (existing) return;

  await addCompany({
    name: data.name,
    country: data.country,
    city: data.city,
    userId,
  });
}

export async function addCompany(
  company: Omit<Company, "id" | "createdAt" | "updatedAt">,
): Promise<Company> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "companies"), {
    ...company,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    ...company,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCompany(
  id: string,
  data: Partial<Company>,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  const { id: _id, createdAt, ...updates } = data;

  await updateDoc(doc(db, "companies", id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCompany(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await deleteDoc(doc(db, "companies", id));
}

export async function addContact(
  contact: Omit<Contact, "id" | "createdAt" | "updatedAt">,
): Promise<Contact> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "contacts"), {
    ...contact,
    createdAt: now,
    updatedAt: now,
  });

  const saved: Contact = {
    id: docRef.id,
    ...contact,
    createdAt: now,
    updatedAt: now,
  };

  if (contact.companyName?.trim()) {
    await ensureCompanyExists(contact.userId, {
      name: contact.companyName.trim(),
      country: contact.country,
      city: contact.city,
    });
  }

  return saved;
}

export async function updateContact(
  id: string,
  data: Partial<Contact>,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  const { id: _id, createdAt, ...updates } = data;

  await updateDoc(doc(db, "contacts", id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteContact(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await deleteDoc(doc(db, "contacts", id));
}

export async function syncCompaniesFromContacts(
  userId: string,
  contacts: Contact[],
  companies: Company[],
): Promise<Company[]> {
  const existingNames = new Set(
    companies.map((company) => company.name.trim().toLowerCase()),
  );
  const created: Company[] = [];

  for (const contact of contacts) {
    const name = contact.companyName?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (existingNames.has(key)) continue;

    existingNames.add(key);
    const company = await addCompany({
      name,
      country: contact.country,
      city: contact.city,
      userId,
    });
    created.push(company);
  }

  return [...created, ...companies];
}

export async function saveHubSpotToken(
  userId: string,
  token: string,
): Promise<HubSpotIntegration> {
  if (!db) throw new Error("Firestore is not configured.");

  const integration: HubSpotIntegration = {
    token,
    connectedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", userId, "integrations", "hubspot"), integration);

  return integration;
}

export async function getHubSpotToken(
  userId: string,
): Promise<HubSpotIntegration | null> {
  if (!db) return null;

  const snapshot = await getDoc(
    doc(db, "users", userId, "integrations", "hubspot"),
  );

  if (!snapshot.exists()) return null;

  return snapshot.data() as HubSpotIntegration;
}

export async function updateHubSpotLastSynced(userId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await setDoc(
    doc(db, "users", userId, "integrations", "hubspot"),
    { lastSyncedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function saveUserPreferences(
  userId: string,
  prefs: UserPreferences,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await setDoc(doc(db, "users", userId, "preferences", "settings"), prefs, {
    merge: true,
  });
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  if (!db) return null;

  const snapshot = await getDoc(
    doc(db, "users", userId, "preferences", "settings"),
  );

  if (!snapshot.exists()) return null;

  return snapshot.data() as UserPreferences;
}

export async function getCompanyByHubspotId(
  userId: string,
  hubspotId: string,
): Promise<Company | null> {
  if (!db) return null;

  const snapshot = await getDocs(
    query(
      collection(db, "companies"),
      where("userId", "==", userId),
      where("hubspotId", "==", hubspotId),
    ),
  );

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Company;
}

export async function getContactByHubspotId(
  userId: string,
  hubspotId: string,
): Promise<Contact | null> {
  if (!db) return null;

  const snapshot = await getDocs(
    query(
      collection(db, "contacts"),
      where("userId", "==", userId),
      where("hubspotId", "==", hubspotId),
    ),
  );

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Contact;
}
