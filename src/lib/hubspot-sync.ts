import {
  addCompany,
  addContact,
  getCompanyByHubspotId,
  getContactByHubspotId,
  updateHubSpotLastSynced,
} from "@/lib/firestore";
import type {
  HubSpotImportCompany,
  HubSpotImportContact,
} from "@/lib/types";

export type HubSpotSyncProgress = (message: string) => void;

export type HubSpotSyncResult = {
  contactsImported: number;
  companiesImported: number;
  syncedAt: string;
};

function contactToFirestore(
  contact: HubSpotImportContact,
  userId: string,
) {
  return {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    email: contact.email || "",
    phone: contact.phone || "",
    mobilePhone: contact.mobilePhone || "",
    role: contact.role || "",
    companyName: contact.companyName || "",
    industry: contact.industry || "",
    domain: contact.domain || "",
    country: contact.country || "",
    city: contact.city || "",
    state: contact.state || "",
    zip: contact.zip || "",
    address: contact.address || "",
    linkedInUrl: contact.linkedInUrl || "",
    twitterHandle: contact.twitterHandle || "",
    lifecycleStage: contact.lifecycleStage || "",
    leadStatus: contact.leadStatus || "",
    annualRevenue: contact.annualRevenue || "",
    numberOfEmployees: contact.numberOfEmployees || "",
    lastInteractionDate: contact.lastInteractionDate || "",
    source: contact.source,
    hubspotId: contact.hubspotId || "",
    userId,
  };
}

function companyToFirestore(
  company: HubSpotImportCompany,
  userId: string,
) {
  return {
    name: company.name || "",
    logoUrl: company.logoUrl || "",
    domain: company.domain || "",
    website: company.website || "",
    industry: company.industry || "",
    description: company.description || "",
    aboutUs: company.aboutUs || "",
    country: company.country || "",
    city: company.city || "",
    state: company.state || "",
    zip: company.zip || "",
    address: company.address || "",
    phone: company.phone || "",
    numberOfEmployees: company.numberOfEmployees || "",
    annualRevenue: company.annualRevenue || "",
    foundedYear: company.foundedYear || "",
    linkedinUrl: company.linkedinUrl || "",
    twitterHandle: company.twitterHandle || "",
    facebookUrl: company.facebookUrl || "",
    timezone: company.timezone || "",
    type: company.type || "",
    hubspotId: company.hubspotId || "",
    userId,
  };
}

export async function syncHubSpotData(
  userId: string,
  token: string,
  onProgress?: HubSpotSyncProgress,
): Promise<HubSpotSyncResult> {
  onProgress?.("Connecting to HubSpot...");

  const response = await fetch("/api/hubspot/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token.trim() }),
  });

  const data = (await response.json()) as {
    contacts?: HubSpotImportContact[];
    companies?: HubSpotImportCompany[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Import failed.");
  }

  const contacts = data.contacts ?? [];
  const companies = data.companies ?? [];
  let contactsImported = 0;

  onProgress?.("Syncing contacts... 0 imported");

  for (const contact of contacts) {
    const existing = await getContactByHubspotId(userId, contact.hubspotId);
    if (existing) continue;

    await addContact(contactToFirestore(contact, userId));

    contactsImported += 1;
    onProgress?.(`Syncing contacts... ${contactsImported} imported`);
  }

  let companiesImported = 0;
  onProgress?.("Syncing companies... 0 imported");

  for (const company of companies) {
    const existing = await getCompanyByHubspotId(userId, company.hubspotId);
    if (existing) continue;

    await addCompany(companyToFirestore(company, userId));

    companiesImported += 1;
    onProgress?.(`Syncing companies... ${companiesImported} imported`);
  }

  await updateHubSpotLastSynced(userId);
  const syncedAt = new Date().toISOString();

  onProgress?.(
    `Sync complete — ${contactsImported} contacts, ${companiesImported} companies imported`,
  );

  return { contactsImported, companiesImported, syncedAt };
}
