import {
  GOOGLE_API_DISABLED_CODE,
  googleApiDisabledFromPayload,
} from "@/lib/google-api-errors";
import {
  addContact,
  getContactByEmail,
  getContactByGoogleId,
  logActivity,
  updateFileImportMeta,
  updateGoogleLastSynced,
} from "@/lib/firestore";
import type {
  ActivityType,
  GoogleImportContact,
  LinkedInImportContact,
  VcfImportContact,
} from "@/lib/types";

export type ImportProgress = (message: string) => void;

export type ImportResult = {
  imported: number;
  skipped: number;
  syncedAt: string;
};

type ImportContact =
  | GoogleImportContact
  | LinkedInImportContact
  | VcfImportContact;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function contactPayload(
  contact: ImportContact,
  userId: string,
): Omit<import("@/lib/types").Contact, "id" | "createdAt" | "updatedAt"> {
  const base = {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    email: normalizeEmail(contact.email || ""),
    phone: "phone" in contact ? contact.phone || "" : "",
    role: "role" in contact ? contact.role || "" : "",
    companyName: contact.companyName || "",
    city: "city" in contact ? contact.city || "" : "",
    country: "country" in contact ? contact.country || "" : "",
    notes: "notes" in contact ? contact.notes || "" : "",
    linkedInUrl:
      "linkedInUrl" in contact ? contact.linkedInUrl || "" : "",
    lastInteractionDate:
      "lastInteractionDate" in contact ? contact.lastInteractionDate || "" : "",
    source: contact.source,
    userId,
  };

  if (contact.source === "google") {
    return {
      ...base,
      googleId: contact.googleId || "",
    };
  }

  return base;
}

async function shouldSkipContact(
  userId: string,
  contact: ImportContact,
): Promise<boolean> {
  if (contact.source === "google" && contact.googleId) {
    const byGoogleId = await getContactByGoogleId(userId, contact.googleId);
    if (byGoogleId) return true;
  }

  const email = normalizeEmail(contact.email || "");
  if (!email) return false;

  const existing = await getContactByEmail(userId, email);
  return Boolean(existing);
}

export async function saveImportedContacts(
  userId: string,
  contacts: ImportContact[],
  activityType: ActivityType,
  activityLabel: string,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;

  onProgress?.(`Importing contacts... 0 of ${contacts.length}`);

  for (const contact of contacts) {
    if (await shouldSkipContact(userId, contact)) {
      skipped += 1;
      continue;
    }

    const hasIdentity =
      contact.firstName ||
      contact.lastName ||
      contact.email ||
      ("googleId" in contact && contact.googleId);

    if (!hasIdentity) {
      skipped += 1;
      continue;
    }

    await addContact(contactPayload(contact, userId), { skipActivity: true });
    imported += 1;
    onProgress?.(`Importing contacts... ${imported} of ${contacts.length}`);
  }

  const syncedAt = new Date().toISOString();

  if (imported > 0) {
    await logActivity(
      userId,
      activityType,
      `${activityLabel}: imported ${imported} contact${imported === 1 ? "" : "s"}`,
    );
  }

  onProgress?.(
    `Import complete — ${imported} imported${skipped > 0 ? `, ${skipped} skipped` : ""}`,
  );

  return { imported, skipped, syncedAt };
}

export async function syncGoogleContacts(
  userId: string,
  accessToken: string,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  onProgress?.("Connecting to Google Contacts...");

  const response = await fetch("/api/google-contacts/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: accessToken.trim() }),
  });

  const data = (await response.json()) as {
    contacts?: GoogleImportContact[];
    total?: number;
    error?: string;
    code?: string;
    activationUrl?: string;
    serviceTitle?: string;
  };

  if (!response.ok) {
    if (data.code === GOOGLE_API_DISABLED_CODE) {
      throw googleApiDisabledFromPayload("contacts", data);
    }

    throw new Error(data.error ?? "Google Contacts import failed.");
  }

  const contacts = data.contacts ?? [];
  const result = await saveImportedContacts(
    userId,
    contacts,
    "google_import",
    "Google Contacts",
    onProgress,
  );

  await updateGoogleLastSynced(userId, result.imported);
  return result;
}

export async function syncLinkedInContacts(
  userId: string,
  csv: string,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  onProgress?.("Parsing LinkedIn CSV...");

  const response = await fetch("/api/linkedin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv }),
  });

  const data = (await response.json()) as {
    contacts?: LinkedInImportContact[];
    total?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "LinkedIn import failed.");
  }

  const contacts = data.contacts ?? [];
  const result = await saveImportedContacts(
    userId,
    contacts,
    "linkedin_import",
    "LinkedIn",
    onProgress,
  );

  await updateFileImportMeta(userId, "linkedin", result.imported);
  return result;
}

export async function syncVcfContacts(
  userId: string,
  vcf: string,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  onProgress?.("Parsing VCF file...");

  const response = await fetch("/api/vcf/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vcf }),
  });

  const data = (await response.json()) as {
    contacts?: VcfImportContact[];
    total?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "VCF import failed.");
  }

  const contacts = data.contacts ?? [];
  const result = await saveImportedContacts(
    userId,
    contacts,
    "vcf_import",
    "Phone contacts",
    onProgress,
  );

  await updateFileImportMeta(userId, "vcf", result.imported);
  return result;
}
