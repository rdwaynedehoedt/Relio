export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  role?: string;
  companyId?: string;
  companyName?: string;
  industry?: string;
  domain?: string;
  country?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  linkedInUrl?: string;
  twitterHandle?: string;
  twitterUrl?: string;
  lifecycleStage?: string;
  leadStatus?: string;
  annualRevenue?: string;
  numberOfEmployees?: string;
  lastInteractionDate?: string;
  source?: "manual" | "hubspot" | "google" | "linkedin" | "vcf";
  hubspotId?: string;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}

export interface Company {
  id?: string;
  name: string;
  logoUrl?: string;
  domain?: string;
  industry?: string;
  website?: string;
  description?: string;
  aboutUs?: string;
  country?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string;
  phone?: string;
  numberOfEmployees?: string;
  annualRevenue?: string;
  foundedYear?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  facebookUrl?: string;
  timezone?: string;
  type?: string;
  tags?: string[];
  notes?: string;
  hubspotId?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ThemeMode = "system" | "light" | "dark";

export type WalletCurrency = "USD" | "GBP" | "AED" | "AUD" | "LKR";

export interface Wallet {
  id?: string;
  name: string;
  currency: WalletCurrency;
  balance: number;
  color: string;
  userId: string;
  createdAt?: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id?: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  userId: string;
  createdAt?: string;
}

export interface TransactionFilters {
  walletId?: string;
  category?: string;
  month?: string;
}

export interface FixedDeposit {
  id?: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  branch?: string;
  currency: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  openedDate: string;
  maturityDate: string;
  nextInterestPayment?: string;
  nextInterestAmount?: number;
  interestDispositionAccount?: string;
  notes?: string;
  createdAt?: string;
}

export type ActivityType =
  | "contact_added"
  | "company_added"
  | "wallet_added"
  | "transaction_added"
  | "fd_added"
  | "hubspot_import"
  | "google_import"
  | "linkedin_import"
  | "vcf_import"
  | "transactions_imported";

export interface Activity {
  id?: string;
  userId: string;
  type: ActivityType;
  description: string;
  createdAt?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  defaultCountry?: string;
  defaultCountryCode?: string;
}

export interface HubSpotIntegration {
  token: string;
  connectedAt: string;
  lastSyncedAt?: string;
}

export interface GoogleIntegration {
  accessToken: string;
  connectedAt: string;
  lastSyncedAt?: string;
  lastImportCount?: number;
}

export interface FileImportIntegration {
  lastSyncedAt?: string;
  lastImportCount?: number;
}

export interface GoogleImportContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  companyName: string;
  city: string;
  country: string;
  notes: string;
  source: "google";
  googleId: string;
}

export interface LinkedInImportContact {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: string;
  lastInteractionDate: string;
  source: "linkedin";
}

export interface VcfImportContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  companyName: string;
  city: string;
  country: string;
  linkedInUrl: string;
  notes: string;
  source: "vcf";
}

export interface HubSpotImportContact {
  hubspotId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobilePhone: string;
  role: string;
  companyName: string;
  industry: string;
  domain: string;
  website: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  linkedInUrl: string;
  twitterHandle: string;
  lifecycleStage: string;
  leadStatus: string;
  annualRevenue: string;
  numberOfEmployees: string;
  lastInteractionDate: string;
  associatedCompanyId: string;
  hubspotOwnerEmail: string;
  analyticsSource: string;
  source: "hubspot";
}

export interface HubSpotImportCompany {
  hubspotId: string;
  name: string;
  domain: string;
  website: string;
  industry: string;
  description: string;
  aboutUs: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  phone: string;
  numberOfEmployees: string;
  annualRevenue: string;
  foundedYear: string;
  linkedinUrl: string;
  twitterHandle: string;
  facebookUrl: string;
  leadStatus: string;
  lifecycleStage: string;
  timezone: string;
  type: string;
  logoUrl: string;
}
