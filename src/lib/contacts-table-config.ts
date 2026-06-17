import type { Contact } from "@/lib/types";
import { formatLastActivity } from "@/lib/contact-utils";

export type ContactColumnId =
  | "name"
  | "email"
  | "phone"
  | "mobilePhone"
  | "company"
  | "role"
  | "city"
  | "state"
  | "country"
  | "industry"
  | "lifecycleStage"
  | "leadStatus"
  | "lastActivity"
  | "source"
  | "annualRevenue"
  | "tags";

export type ContactColumnDef = {
  id: ContactColumnId;
  label: string;
  defaultVisible: boolean;
  locked?: boolean;
  minWidth?: string;
};

export const CONTACT_COLUMNS: ContactColumnDef[] = [
  { id: "name", label: "Name", defaultVisible: true, locked: true, minWidth: "180px" },
  { id: "email", label: "Email", defaultVisible: true, locked: true, minWidth: "220px" },
  { id: "phone", label: "Phone", defaultVisible: true, minWidth: "140px" },
  { id: "mobilePhone", label: "Mobile", defaultVisible: false, minWidth: "140px" },
  { id: "company", label: "Company", defaultVisible: true, minWidth: "180px" },
  { id: "role", label: "Role", defaultVisible: false, minWidth: "160px" },
  { id: "city", label: "City", defaultVisible: false, minWidth: "140px" },
  { id: "state", label: "State", defaultVisible: false, minWidth: "120px" },
  { id: "country", label: "Country", defaultVisible: false, minWidth: "140px" },
  { id: "industry", label: "Industry", defaultVisible: false, minWidth: "160px" },
  { id: "lifecycleStage", label: "Lifecycle", defaultVisible: false, minWidth: "140px" },
  { id: "leadStatus", label: "Lead status", defaultVisible: false, minWidth: "140px" },
  { id: "lastActivity", label: "Last activity", defaultVisible: true, minWidth: "160px" },
  { id: "source", label: "Source", defaultVisible: false, minWidth: "110px" },
  { id: "annualRevenue", label: "Revenue", defaultVisible: false, minWidth: "130px" },
  { id: "tags", label: "Tags", defaultVisible: false, minWidth: "180px" },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_VISIBLE_COLUMNS: ContactColumnId[] = CONTACT_COLUMNS.filter(
  (column) => column.defaultVisible,
).map((column) => column.id);

export const COLUMNS_STORAGE_KEY = "relio-contacts-columns";
export const PAGE_SIZE_STORAGE_KEY = "relio-contacts-page-size";

export function loadVisibleColumns(): ContactColumnId[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_COLUMNS;

  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_COLUMNS;

    const parsed = JSON.parse(raw) as ContactColumnId[];
    const valid = new Set(CONTACT_COLUMNS.map((column) => column.id));
    const next = parsed.filter((id) => valid.has(id));

    if (!next.includes("name")) next.unshift("name");
    if (!next.includes("email")) next.splice(1, 0, "email");

    return next.length > 0 ? next : DEFAULT_VISIBLE_COLUMNS;
  } catch {
    return DEFAULT_VISIBLE_COLUMNS;
  }
}

export function loadPageSize(): PageSizeOption {
  if (typeof window === "undefined") return 25;

  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    const value = Number(raw);
    return PAGE_SIZE_OPTIONS.includes(value as PageSizeOption)
      ? (value as PageSizeOption)
      : 25;
  } catch {
    return 25;
  }
}

export function getContactColumnValue(
  contact: Contact,
  columnId: ContactColumnId,
): string {
  switch (columnId) {
    case "name":
      return `${contact.firstName} ${contact.lastName}`.trim();
    case "email":
      return contact.email || "";
    case "phone":
      return contact.phone || "";
    case "mobilePhone":
      return contact.mobilePhone || "";
    case "company":
      return contact.companyName || "";
    case "role":
      return contact.role || "";
    case "city":
      return contact.city || "";
    case "state":
      return contact.state || "";
    case "country":
      return contact.country || "";
    case "industry":
      return contact.industry || "";
    case "lifecycleStage":
      return contact.lifecycleStage || "";
    case "leadStatus":
      return contact.leadStatus || "";
    case "lastActivity":
      return formatLastActivity(
        contact.lastInteractionDate ?? contact.updatedAt,
      );
    case "source":
      return contact.source || "";
    case "annualRevenue":
      return contact.annualRevenue || "";
    case "tags":
      return contact.tags?.join(", ") || "";
    default:
      return "";
  }
}

/** Fields available via the + filter menu (not already top-level pills). */
export const ADD_FILTER_FIELDS = [
  "role",
  "city",
  "state",
  "source",
  "annualRevenue",
] as const;

export type AddFilterField = (typeof ADD_FILTER_FIELDS)[number];

export function isDuplicateFilter(
  filters: { field: string; value: string }[],
  field: string,
  value: string,
): boolean {
  return filters.some(
    (filter) => filter.field === field && filter.value === value,
  );
}
