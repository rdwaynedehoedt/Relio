import type { Company, Contact } from "@/lib/types";

export type CompanyFormValues = {
  name: string;
  industry: string;
  website: string;
  country: string;
  city: string;
  notes: string;
};

export const emptyCompanyForm: CompanyFormValues = {
  name: "",
  industry: "",
  website: "",
  country: "",
  city: "",
  notes: "",
};

export function companyToFormValues(company: Company): CompanyFormValues {
  return {
    name: company.name ?? "",
    industry: company.industry ?? "",
    website: company.website ?? "",
    country: company.country ?? "",
    city: company.city ?? "",
    notes: company.notes ?? "",
  };
}

export function formValuesToCompany(
  values: CompanyFormValues,
  userId: string,
): Omit<Company, "id" | "createdAt" | "updatedAt"> {
  return {
    name: values.name.trim(),
    industry: values.industry.trim() || undefined,
    website: values.website.trim() || undefined,
    country: values.country.trim() || undefined,
    city: values.city.trim() || undefined,
    notes: values.notes.trim() || undefined,
    userId,
  };
}

export function matchesCompanySearch(company: Company, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [company.name, company.industry, company.country]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(query));
}

export function getContactCountForCompany(
  contacts: Contact[],
  companyName: string,
): number {
  const normalized = companyName.trim().toLowerCase();
  return contacts.filter(
    (contact) =>
      contact.companyName?.trim().toLowerCase() === normalized,
  ).length;
}

export function getUniqueIndustries(companies: Company[]): string[] {
  return Array.from(
    new Set(
      companies
        .map((company) => company.industry?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();
}

export function getUniqueCompanyCountries(companies: Company[]): string[] {
  return Array.from(
    new Set(
      companies
        .map((company) => company.country?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();
}

export function formatWebsiteUrl(website?: string): string | undefined {
  if (!website?.trim()) return undefined;
  const value = website.trim();
  return value.startsWith("http") ? value : `https://${value}`;
}
