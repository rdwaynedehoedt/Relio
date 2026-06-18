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
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Activity,
  ActivityType,
  Company,
  Contact,
  FixedDeposit,
  HubSpotIntegration,
  Transaction,
  TransactionFilters,
  UserPreferences,
  Wallet,
} from "@/lib/types";
import { filterTransactions } from "@/lib/finance-utils";

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
  options?: { skipActivity?: boolean },
): Promise<Company> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "companies"), {
    ...company,
    createdAt: now,
    updatedAt: now,
  });

  const saved: Company = {
    id: docRef.id,
    ...company,
    createdAt: now,
    updatedAt: now,
  };

  if (!options?.skipActivity) {
    await logActivity(
      company.userId,
      "company_added",
      `Added company ${company.name}`,
    );
  }

  return saved;
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
  options?: { skipActivity?: boolean },
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

  if (!options?.skipActivity) {
    await logActivity(
      contact.userId,
      "contact_added",
      `Added contact ${contact.firstName} ${contact.lastName}`.trim(),
    );
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

export async function getWallets(userId: string): Promise<Wallet[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "wallets"), where("userId", "==", userId)),
  );

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Wallet)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

export async function addWallet(
  wallet: Omit<Wallet, "id" | "createdAt">,
): Promise<Wallet> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "wallets"), {
    ...wallet,
    createdAt: now,
  });

  const saved: Wallet = {
    id: docRef.id,
    ...wallet,
    createdAt: now,
  };

  await logActivity(
    wallet.userId,
    "wallet_added",
    `Added wallet ${wallet.name}`,
  );

  return saved;
}

export async function updateWallet(
  id: string,
  data: Partial<Wallet>,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  const { id: _id, createdAt, ...updates } = data;

  await updateDoc(doc(db, "wallets", id), updates);
}

export async function deleteWallet(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await deleteDoc(doc(db, "wallets", id));
}

export async function getTransactions(
  userId: string,
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "transactions"), where("userId", "==", userId)),
  );

  const transactions = snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Transaction)
    .sort((a, b) => b.date.localeCompare(a.date));

  return filters ? filterTransactions(transactions, filters) : transactions;
}

export async function addTransaction(
  transaction: Omit<Transaction, "id" | "createdAt">,
): Promise<Transaction> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "transactions"), {
    ...transaction,
    createdAt: now,
  });

  return {
    id: docRef.id,
    ...transaction,
    createdAt: now,
  };
}

export async function addTransactionsBatch(
  transactions: Omit<Transaction, "id" | "createdAt">[],
): Promise<Transaction[]> {
  if (!db) throw new Error("Firestore is not configured.");
  if (transactions.length === 0) return [];

  const firestore = db;
  const batch = writeBatch(firestore);
  const now = new Date().toISOString();
  const created: Transaction[] = [];

  transactions.forEach((transaction) => {
    const docRef = doc(collection(firestore, "transactions"));
    batch.set(docRef, { ...transaction, createdAt: now });
    created.push({
      id: docRef.id,
      ...transaction,
      createdAt: now,
    });
  });

  await batch.commit();
  return created;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await deleteDoc(doc(db, "transactions", id));
}

export async function getFixedDeposits(userId: string): Promise<FixedDeposit[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "fixedDeposits"), where("userId", "==", userId)),
  );

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as FixedDeposit)
    .sort((a, b) => (a.maturityDate ?? "").localeCompare(b.maturityDate ?? ""));
}

export async function addFixedDeposit(
  fd: Omit<FixedDeposit, "id" | "createdAt">,
): Promise<FixedDeposit> {
  if (!db) throw new Error("Firestore is not configured.");

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, "fixedDeposits"), {
    ...fd,
    createdAt: now,
  });

  const saved: FixedDeposit = {
    id: docRef.id,
    ...fd,
    createdAt: now,
  };

  const amountLabel = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: fd.currency === "LKR" ? "LKR" : fd.currency,
    maximumFractionDigits: 0,
  }).format(fd.principalAmount);

  await logActivity(
    fd.userId,
    "fd_added",
    `Added FD — ${fd.bankName} ${amountLabel}`,
  );

  return saved;
}

export async function updateFixedDeposit(
  id: string,
  data: Partial<FixedDeposit>,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  const { id: _id, createdAt, ...updates } = data;

  await updateDoc(doc(db, "fixedDeposits", id), updates);
}

export async function deleteFixedDeposit(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");

  await deleteDoc(doc(db, "fixedDeposits", id));
}

export async function logActivity(
  userId: string,
  type: ActivityType,
  description: string,
): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, "activities"), {
      userId,
      type,
      description,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getActivities(
  userId: string,
  limit = 10,
): Promise<Activity[]> {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "activities"), where("userId", "==", userId)),
  );

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Activity)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);
}
