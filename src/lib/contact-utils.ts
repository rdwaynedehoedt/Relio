import { format, isToday, isYesterday, differenceInDays, parseISO } from "date-fns";
import { getCountryFlag } from "@/lib/country-utils";
import type { Contact } from "@/lib/types";

const avatarColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

export type CustomFilterField =
  | "role"
  | "city"
  | "state"
  | "source"
  | "industry"
  | "lifecycleStage"
  | "leadStatus"
  | "annualRevenue";

export interface CustomFilter {
  id: string;
  field: CustomFilterField;
  value: string;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function getAvatarColor(name: string) {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return avatarColors[hash % avatarColors.length];
}

export function getCountryDisplay(country?: string, countryCode?: string) {
  if (!country) return null;
  const flag = getCountryFlag(country, countryCode);
  return `${flag} ${country}`;
}

export function getContactSearchText(contact: Contact) {
  return [
    contact.firstName,
    contact.lastName,
    contact.companyName,
    contact.role,
    contact.email,
    contact.city,
    contact.country,
    contact.linkedInUrl,
    contact.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getUniqueValues(contacts: Contact[], key: keyof Contact) {
  const values = new Set<string>();

  contacts.forEach((contact) => {
    const value = contact[key];
    if (typeof value === "string" && value.trim()) {
      values.add(value.trim());
    }
  });

  return Array.from(values).sort();
}

export function getUniqueTags(contacts: Contact[]) {
  const tags = new Set<string>();

  contacts.forEach((contact) => {
    contact.tags?.forEach((tag) => {
      if (tag.trim()) tags.add(tag.trim());
    });
  });

  return Array.from(tags).sort();
}

export const CONTACT_SOURCE_OPTIONS = [
  { value: "google", label: "Google Contacts" },
  { value: "hubspot", label: "HubSpot" },
  { value: "manual", label: "Manual" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "vcf", label: "Phone / VCF" },
] as const;

export type ContactSourceValue =
  | (typeof CONTACT_SOURCE_OPTIONS)[number]["value"]
  | "unspecified";

export function getContactSourceLabel(source?: string): string {
  if (!source) return "Unspecified";
  const match = CONTACT_SOURCE_OPTIONS.find((option) => option.value === source);
  return match?.label ?? source;
}

export function countContactsBySource(contacts: Contact[]): Record<string, number> {
  const counts: Record<string, number> = { all: contacts.length };

  contacts.forEach((contact) => {
    const key = contact.source || "unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return counts;
}

export const STALE_CONTACT_DAYS = 30;

export function isStaleContact(
  contact: Contact,
  days = STALE_CONTACT_DAYS,
): boolean {
  const dateStr =
    contact.lastInteractionDate ?? contact.updatedAt ?? contact.createdAt;
  if (!dateStr) return true;

  const daysSince = differenceInDays(new Date(), parseISO(dateStr));
  return daysSince > days;
}

export function countStaleContacts(
  contacts: Contact[],
  days = STALE_CONTACT_DAYS,
): number {
  return contacts.filter((contact) => isStaleContact(contact, days)).length;
}

export function matchesFilters(
  contact: Contact,
  {
    search,
    tagFilter,
    countryFilter,
    industryFilter,
    lifecycleStageFilter,
    leadStatusFilter,
    sourceFilter,
    companyFilter,
    customFilters,
  }: {
    search: string;
    tagFilter: string;
    countryFilter: string;
    industryFilter: string;
    lifecycleStageFilter: string;
    leadStatusFilter: string;
    sourceFilter: string;
    companyFilter: string;
    customFilters: CustomFilter[];
  },
) {
  const query = search.trim().toLowerCase();

  if (query && !getContactSearchText(contact).includes(query)) {
    return false;
  }

  if (tagFilter && !contact.tags?.includes(tagFilter)) {
    return false;
  }

  if (countryFilter && contact.country !== countryFilter) {
    return false;
  }

  if (industryFilter && contact.industry !== industryFilter) {
    return false;
  }

  if (lifecycleStageFilter && contact.lifecycleStage !== lifecycleStageFilter) {
    return false;
  }

  if (leadStatusFilter && contact.leadStatus !== leadStatusFilter) {
    return false;
  }

  if (sourceFilter) {
    if (sourceFilter === "unspecified") {
      if (contact.source) return false;
    } else if (contact.source !== sourceFilter) {
      return false;
    }
  }

  if (
    companyFilter &&
    contact.companyName?.trim().toLowerCase() !==
      companyFilter.trim().toLowerCase()
  ) {
    return false;
  }

  return customFilters.every((filter) => {
    if (filter.field === "source") {
      return contact.source === filter.value;
    }

    const value = contact[filter.field];
    return typeof value === "string" && value === filter.value;
  });
}

export type ContactSortOption =
  | "name_asc"
  | "name_desc"
  | "activity_desc"
  | "activity_asc"
  | "company_asc";

export function sortContacts(
  contacts: Contact[],
  sortBy: ContactSortOption,
): Contact[] {
  const sorted = [...contacts];
  const getName = (contact: Contact) =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase();
  const getActivity = (contact: Contact) =>
    new Date(contact.lastInteractionDate ?? contact.updatedAt ?? 0).getTime();

  switch (sortBy) {
    case "name_asc":
      return sorted.sort((a, b) => getName(a).localeCompare(getName(b)));
    case "name_desc":
      return sorted.sort((a, b) => getName(b).localeCompare(getName(a)));
    case "activity_desc":
      return sorted.sort((a, b) => getActivity(b) - getActivity(a));
    case "activity_asc":
      return sorted.sort((a, b) => getActivity(a) - getActivity(b));
    case "company_asc":
      return sorted.sort((a, b) =>
        (a.companyName ?? "").localeCompare(b.companyName ?? ""),
      );
    default:
      return sorted;
  }
}

export function formatInteractionDate(date?: string) {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLastActivity(date?: string) {
  if (!date) return "--";

  const value = new Date(date);

  if (isToday(value)) {
    return `Today at ${format(value, "h:mm a")}`;
  }

  if (isYesterday(value)) {
    return `Yesterday at ${format(value, "h:mm a")}`;
  }

  return format(value, "MMM d, yyyy");
}

export function formatSocialUrl(
  platform: "linkedin" | "twitter",
  value?: string,
): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (platform === "linkedin") {
    return trimmed.includes("linkedin.com")
      ? `https://${trimmed.replace(/^\/+/, "")}`
      : `https://linkedin.com/in/${trimmed.replace(/^@/, "")}`;
  }
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

export function formatCreateDate(date?: string) {
  if (!date) return "--";
  return format(new Date(date), "MMM d, yyyy");
}

export function parseTagsInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export const emptyContactForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  companyName: "",
  country: "",
  city: "",
  linkedInUrl: "",
  twitterUrl: "",
  tags: "",
  notes: "",
  lastInteractionDate: "",
};

export type ContactFormValues = typeof emptyContactForm;

export function contactToFormValues(contact: Contact): ContactFormValues {
  return {
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    role: contact.role ?? "",
    companyName: contact.companyName ?? "",
    country: contact.country ?? "",
    city: contact.city ?? "",
    linkedInUrl: contact.linkedInUrl ?? "",
    twitterUrl: contact.twitterUrl ?? "",
    tags: contact.tags?.join(", ") ?? "",
    notes: contact.notes ?? "",
    lastInteractionDate: contact.lastInteractionDate?.slice(0, 10) ?? "",
  };
}

export function formValuesToContact(
  values: ContactFormValues,
  userId: string,
  source: Contact["source"] = "manual",
): Omit<Contact, "id" | "createdAt" | "updatedAt"> {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    role: values.role.trim() || undefined,
    companyName: values.companyName.trim() || undefined,
    country: values.country.trim() || undefined,
    city: values.city.trim() || undefined,
    linkedInUrl: values.linkedInUrl.trim() || undefined,
    twitterUrl: values.twitterUrl.trim() || undefined,
    tags: parseTagsInput(values.tags),
    notes: values.notes.trim() || undefined,
    lastInteractionDate: values.lastInteractionDate || undefined,
    source,
    userId,
  };
}
