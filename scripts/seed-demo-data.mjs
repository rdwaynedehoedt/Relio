/**
 * Seed a Firebase user with realistic demo data for product demos.
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *   npm run seed-demo-data
 *   npm run seed-demo-data -- --uid FOQcU8Cq8OWUhm8doMvqmbqeEQf1
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  addDays,
  addMonths,
  format,
  subDays,
  subMonths,
} from "date-fns";

const DEFAULT_DEMO_UID = "FOQcU8Cq8OWUhm8doMvqmbqeEQf1";

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
    uid: DEFAULT_DEMO_UID,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--uid") args.uid = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
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
    initializeApp({ credential: cert(JSON.parse(json)), projectId });
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
    "Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path.",
  );
}

function iso(date) {
  return format(date, "yyyy-MM-dd");
}

function isoDateTime(date) {
  return date.toISOString();
}

function daysAgo(n) {
  return subDays(new Date(), n);
}

function buildDemoData(userId) {
  const now = new Date();

  const companies = [
    {
      name: "Meridian Cloud Systems",
      domain: "meridiancloud.io",
      industry: "Software",
      website: "https://meridiancloud.io",
      description: "B2B workflow automation for mid-market teams.",
      country: "United States",
      city: "San Francisco",
      state: "CA",
      numberOfEmployees: "120",
      annualRevenue: "$18M",
      foundedYear: "2019",
      linkedinUrl: "https://linkedin.com/company/meridian-cloud",
      type: "Prospect",
      tags: ["enterprise", "saas"],
    },
    {
      name: "Apex Ventures",
      domain: "apexvc.com",
      industry: "Venture Capital",
      website: "https://apexvc.com",
      description: "Early-stage fund focused on SaaS and fintech in South Asia.",
      country: "Singapore",
      city: "Singapore",
      numberOfEmployees: "24",
      annualRevenue: "$2M",
      foundedYear: "2016",
      type: "Investor",
      tags: ["investor", "series-a"],
    },
    {
      name: "Harbour Digital",
      domain: "harbourdigital.co",
      industry: "Marketing Agency",
      website: "https://harbourdigital.co",
      country: "United Kingdom",
      city: "London",
      numberOfEmployees: "45",
      annualRevenue: "$6M",
      foundedYear: "2017",
      tags: ["partner", "agency"],
    },
    {
      name: "Colombo FinTech Hub",
      domain: "colombofintech.lk",
      industry: "Financial Services",
      website: "https://colombofintech.lk",
      country: "Sri Lanka",
      city: "Colombo",
      numberOfEmployees: "80",
      annualRevenue: "LKR 420M",
      foundedYear: "2020",
      tags: ["community", "local"],
    },
    {
      name: "Northstar Analytics",
      domain: "northstaranalytics.com",
      industry: "Data & Analytics",
      website: "https://northstaranalytics.com",
      country: "United Arab Emirates",
      city: "Dubai",
      numberOfEmployees: "65",
      annualRevenue: "$9M",
      foundedYear: "2018",
      tags: ["customer", "analytics"],
    },
    {
      name: "Bluewave Health",
      domain: "bluewavehealth.com",
      industry: "Healthcare",
      website: "https://bluewavehealth.com",
      country: "Australia",
      city: "Sydney",
      numberOfEmployees: "210",
      annualRevenue: "$32M",
      foundedYear: "2014",
      tags: ["enterprise", "healthcare"],
    },
    {
      name: "Lattice Payments",
      domain: "latticepay.io",
      industry: "Fintech",
      website: "https://latticepay.io",
      country: "United States",
      city: "New York",
      numberOfEmployees: "95",
      annualRevenue: "$14M",
      foundedYear: "2021",
      tags: ["integration", "payments"],
    },
    {
      name: "Summit Legal Partners",
      domain: "summitlegal.com",
      industry: "Legal Services",
      website: "https://summitlegal.com",
      country: "Sri Lanka",
      city: "Colombo",
      numberOfEmployees: "18",
      annualRevenue: "LKR 85M",
      foundedYear: "2012",
      tags: ["advisor"],
    },
    {
      name: "Orbit Logistics",
      domain: "orbitlogistics.ae",
      industry: "Logistics",
      website: "https://orbitlogistics.ae",
      country: "United Arab Emirates",
      city: "Abu Dhabi",
      numberOfEmployees: "340",
      annualRevenue: "$48M",
      foundedYear: "2009",
      tags: ["prospect"],
    },
    {
      name: "Cedar Studio",
      domain: "cedarstudio.co",
      industry: "Design",
      website: "https://cedarstudio.co",
      country: "United Kingdom",
      city: "Manchester",
      numberOfEmployees: "12",
      annualRevenue: "$1.2M",
      foundedYear: "2022",
      tags: ["freelance", "design"],
    },
    {
      name: "Pacific SaaS Collective",
      domain: "pacificsaas.org",
      industry: "Community",
      website: "https://pacificsaas.org",
      country: "Australia",
      city: "Melbourne",
      numberOfEmployees: "8",
      foundedYear: "2023",
      tags: ["community"],
    },
    {
      name: "Zenith Retail Group",
      domain: "zenithretail.com",
      industry: "Retail",
      website: "https://zenithretail.com",
      country: "Sri Lanka",
      city: "Kandy",
      numberOfEmployees: "520",
      annualRevenue: "LKR 2.1B",
      foundedYear: "2005",
      tags: ["customer"],
    },
  ];

  const contacts = [
    { firstName: "Sarah", lastName: "Chen", email: "sarah.chen@meridiancloud.io", role: "VP Sales", companyName: "Meridian Cloud Systems", city: "San Francisco", country: "United States", lifecycleStage: "Opportunity", tags: ["champion", "enterprise"], source: "hubspot", lastInteractionDate: iso(daysAgo(2)) },
    { firstName: "James", lastName: "Whitfield", email: "j.whitfield@apexvc.com", role: "Partner", companyName: "Apex Ventures", city: "Singapore", country: "Singapore", lifecycleStage: "Qualified", tags: ["investor"], source: "manual", lastInteractionDate: iso(daysAgo(5)) },
    { firstName: "Priya", lastName: "Fernando", email: "priya@harbourdigital.co", role: "Account Director", companyName: "Harbour Digital", city: "London", country: "United Kingdom", lifecycleStage: "Customer", tags: ["partner"], source: "google", lastInteractionDate: iso(daysAgo(8)) },
    { firstName: "Marcus", lastName: "Silva", email: "marcus.s@northstaranalytics.com", role: "Head of Product", companyName: "Northstar Analytics", city: "Dubai", country: "United Arab Emirates", lifecycleStage: "Customer", tags: ["renewal"], source: "hubspot", lastInteractionDate: iso(daysAgo(3)) },
    { firstName: "Amelia", lastName: "Brooks", email: "amelia.b@bluewavehealth.com", role: "COO", companyName: "Bluewave Health", city: "Sydney", country: "Australia", lifecycleStage: "Lead", tags: ["enterprise"], source: "linkedin", lastInteractionDate: iso(daysAgo(12)) },
    { firstName: "Daniel", lastName: "Reyes", email: "daniel@latticepay.io", role: "CEO", companyName: "Lattice Payments", city: "New York", country: "United States", lifecycleStage: "Opportunity", tags: ["integration"], source: "manual", lastInteractionDate: iso(daysAgo(6)) },
    { firstName: "Nimal", lastName: "Perera", email: "nimal.perera@summitlegal.com", role: "Managing Partner", companyName: "Summit Legal Partners", city: "Colombo", country: "Sri Lanka", lifecycleStage: "Customer", tags: ["advisor"], source: "vcf", lastInteractionDate: iso(daysAgo(20)) },
    { firstName: "Fatima", lastName: "Al-Rashid", email: "fatima@orbitlogistics.ae", role: "Procurement Lead", companyName: "Orbit Logistics", city: "Abu Dhabi", country: "United Arab Emirates", lifecycleStage: "Lead", tags: ["prospect"], source: "hubspot", lastInteractionDate: iso(daysAgo(14)) },
    { firstName: "Olivia", lastName: "Grant", email: "olivia@cedarstudio.co", role: "Creative Director", companyName: "Cedar Studio", city: "Manchester", country: "United Kingdom", lifecycleStage: "Customer", tags: ["design"], source: "google", lastInteractionDate: iso(daysAgo(9)) },
    { firstName: "Ravi", lastName: "Krishnan", email: "ravi@colombofintech.lk", role: "Program Director", companyName: "Colombo FinTech Hub", city: "Colombo", country: "Sri Lanka", lifecycleStage: "Other", tags: ["community"], source: "manual", lastInteractionDate: iso(daysAgo(4)) },
    { firstName: "Tom", lastName: "Nguyen", email: "tom.nguyen@pacificsaas.org", role: "Community Lead", companyName: "Pacific SaaS Collective", city: "Melbourne", country: "Australia", lifecycleStage: "Other", tags: ["network"], source: "linkedin", lastInteractionDate: iso(daysAgo(18)) },
    { firstName: "Anjali", lastName: "Wickramasinghe", email: "anjali@zenithretail.com", role: "Head of Digital", companyName: "Zenith Retail Group", city: "Kandy", country: "Sri Lanka", lifecycleStage: "Opportunity", tags: ["retail"], source: "hubspot", lastInteractionDate: iso(daysAgo(7)) },
    { firstName: "Ethan", lastName: "Morris", email: "ethan.morris@meridiancloud.io", role: "Solutions Engineer", companyName: "Meridian Cloud Systems", city: "San Francisco", country: "United States", lifecycleStage: "Opportunity", tags: ["technical"], source: "manual", lastInteractionDate: iso(daysAgo(2)) },
    { firstName: "Leila", lastName: "Hassan", email: "leila@apexvc.com", role: "Principal", companyName: "Apex Ventures", city: "Singapore", country: "Singapore", lifecycleStage: "Qualified", tags: ["investor"], source: "manual", lastInteractionDate: iso(daysAgo(11)) },
    { firstName: "Chris", lastName: "Dalton", email: "chris@harbourdigital.co", role: "Growth Lead", companyName: "Harbour Digital", city: "London", country: "United Kingdom", lifecycleStage: "Customer", tags: ["marketing"], source: "google", lastInteractionDate: iso(daysAgo(15)) },
    { firstName: "Maya", lastName: "Singh", email: "maya.singh@northstaranalytics.com", role: "Customer Success", companyName: "Northstar Analytics", city: "Dubai", country: "United Arab Emirates", lifecycleStage: "Customer", tags: ["cs"], source: "hubspot", lastInteractionDate: iso(daysAgo(1)) },
    { firstName: "Ben", lastName: "Carter", email: "ben.carter@latticepay.io", role: "Head of Partnerships", companyName: "Lattice Payments", city: "New York", country: "United States", lifecycleStage: "Lead", tags: ["payments"], source: "linkedin", lastInteractionDate: iso(daysAgo(22)) },
    { firstName: "Dilani", lastName: "Jayawardena", email: "dilani.j@summitlegal.com", role: "Associate", companyName: "Summit Legal Partners", city: "Colombo", country: "Sri Lanka", lifecycleStage: "Customer", tags: ["legal"], source: "vcf", lastInteractionDate: iso(daysAgo(30)) },
    { firstName: "Hugo", lastName: "Martinez", email: "hugo@orbitlogistics.ae", role: "Operations Director", companyName: "Orbit Logistics", city: "Abu Dhabi", country: "United Arab Emirates", lifecycleStage: "Lead", tags: ["logistics"], source: "manual", lastInteractionDate: iso(daysAgo(16)) },
    { firstName: "Emma", lastName: "Clarke", email: "emma@cedarstudio.co", role: "Brand Strategist", companyName: "Cedar Studio", city: "Manchester", country: "United Kingdom", lifecycleStage: "Customer", tags: ["brand"], source: "google", lastInteractionDate: iso(daysAgo(10)) },
    { firstName: "Kamal", lastName: "Rajapaksa", email: "kamal@colombofintech.lk", role: "Events Lead", companyName: "Colombo FinTech Hub", city: "Colombo", country: "Sri Lanka", lifecycleStage: "Other", tags: ["events"], source: "manual", lastInteractionDate: iso(daysAgo(6)) },
    { firstName: "Sophie", lastName: "Laurent", email: "sophie@bluewavehealth.com", role: "Director of IT", companyName: "Bluewave Health", city: "Sydney", country: "Australia", lifecycleStage: "Lead", tags: ["healthcare"], source: "hubspot", lastInteractionDate: iso(daysAgo(13)) },
    { firstName: "Arjun", lastName: "Mehta", email: "arjun@zenithretail.com", role: "CFO", companyName: "Zenith Retail Group", city: "Kandy", country: "Sri Lanka", lifecycleStage: "Opportunity", tags: ["decision-maker"], source: "linkedin", lastInteractionDate: iso(daysAgo(5)) },
    { firstName: "Nina", lastName: "Kowalski", email: "nina@pacificsaas.org", role: "Founder", companyName: "Pacific SaaS Collective", city: "Melbourne", country: "Australia", lifecycleStage: "Other", tags: ["founder"], source: "manual", lastInteractionDate: iso(daysAgo(25)) },
  ];

  const wallets = [
    { name: "Commercial Bank — Operating", currency: "LKR", balance: 1847500, color: "#6366f1" },
    { name: "USD Business Account", currency: "USD", balance: 24850, color: "#10b981" },
    { name: "Wise — Freelance", currency: "USD", balance: 6320, color: "#f59e0b" },
    { name: "Revolut — Travel", currency: "GBP", balance: 2180, color: "#ec4899" },
  ];

  const transactionTemplates = [
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Ministry of Crab — client dinner", amount: 28500, daysAgo: 2 },
    { walletIndex: 0, type: "expense", category: "Transport", description: "Uber rides — Colombo meetings", amount: 12400, daysAgo: 3 },
    { walletIndex: 0, type: "expense", category: "Bills & Utilities", description: "Dialog fibre + mobile", amount: 8900, daysAgo: 5 },
    { walletIndex: 0, type: "expense", category: "Business", description: "WeWork day pass", amount: 15000, daysAgo: 6 },
    { walletIndex: 0, type: "income", category: "Salary & Income", description: "Relio Ltd — director salary", amount: 450000, daysAgo: 1 },
    { walletIndex: 0, type: "expense", category: "Shopping", description: "Office supplies — Softlogic", amount: 18750, daysAgo: 8 },
    { walletIndex: 0, type: "expense", category: "Health", description: "Annual health screening", amount: 42000, daysAgo: 12 },
    { walletIndex: 0, type: "expense", category: "Subscriptions", description: "Notion + Linear + Figma", amount: 9800, daysAgo: 4 },
    { walletIndex: 0, type: "expense", category: "Travel", description: "Colombo ↔ Singapore flights", amount: 185000, daysAgo: 18 },
    { walletIndex: 0, type: "income", category: "Freelance Income", description: "Consulting — Zenith Retail", amount: 320000, daysAgo: 14 },
    { walletIndex: 1, type: "income", category: "Salary & Income", description: "Meridian Cloud — annual contract", amount: 12000, daysAgo: 3 },
    { walletIndex: 1, type: "expense", category: "Business", description: "AWS + Vercel infrastructure", amount: 890, daysAgo: 2 },
    { walletIndex: 1, type: "expense", category: "Subscriptions", description: "HubSpot + Intercom", amount: 420, daysAgo: 5 },
    { walletIndex: 1, type: "income", category: "Freelance Income", description: "Northstar Analytics retainer", amount: 4500, daysAgo: 10 },
    { walletIndex: 1, type: "expense", category: "Travel", description: "Dubai conference hotel", amount: 680, daysAgo: 21 },
    { walletIndex: 1, type: "expense", category: "Entertainment", description: "Team dinner — Singapore", amount: 240, daysAgo: 17 },
    { walletIndex: 2, type: "income", category: "Freelance Income", description: "Cedar Studio brand project", amount: 2800, daysAgo: 9 },
    { walletIndex: 2, type: "expense", category: "Business", description: "Stripe processing fees", amount: 85, daysAgo: 9 },
    { walletIndex: 2, type: "income", category: "Freelance Income", description: "Harbour Digital referral fee", amount: 1500, daysAgo: 16 },
    { walletIndex: 3, type: "expense", category: "Travel", description: "London Airbnb — 5 nights", amount: 890, daysAgo: 24 },
    { walletIndex: 3, type: "expense", category: "Food & Dining", description: "Restaurants — Shoreditch", amount: 185, daysAgo: 23 },
    { walletIndex: 3, type: "expense", category: "Transport", description: "Heathrow Express + Tube", amount: 62, daysAgo: 22 },
    { walletIndex: 0, type: "expense", category: "Savings & Investments", description: "Monthly FD top-up", amount: 150000, daysAgo: 7 },
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Grocery — Keells", amount: 22400, daysAgo: 1 },
    { walletIndex: 0, type: "expense", category: "Transport", description: "Fuel — Ceypetco", amount: 9800, daysAgo: 4 },
    { walletIndex: 1, type: "expense", category: "Business", description: "Google Workspace", amount: 72, daysAgo: 6 },
    { walletIndex: 0, type: "expense", category: "Entertainment", description: "Spotify + Netflix", amount: 4500, daysAgo: 5 },
    { walletIndex: 0, type: "income", category: "Freelance Income", description: "Workshop — FinTech Hub", amount: 95000, daysAgo: 28 },
    { walletIndex: 0, type: "expense", category: "Business", description: "Legal retainer — Summit Legal", amount: 75000, daysAgo: 19 },
    { walletIndex: 1, type: "income", category: "Freelance Income", description: "Lattice Payments pilot", amount: 3200, daysAgo: 32 },
    { walletIndex: 0, type: "expense", category: "Travel", description: "Airport lounge + parking", amount: 8500, daysAgo: 18 },
    { walletIndex: 0, type: "expense", category: "Shopping", description: "New laptop stand + monitor", amount: 68000, daysAgo: 11 },
    { walletIndex: 2, type: "expense", category: "Subscriptions", description: "Canva Pro + Loom", amount: 45, daysAgo: 3 },
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Coffee meetings — Whight & Co", amount: 5600, daysAgo: 2 },
    { walletIndex: 0, type: "expense", category: "Business", description: "Domain renewals", amount: 12000, daysAgo: 35 },
    { walletIndex: 1, type: "expense", category: "Health", description: "International health insurance", amount: 310, daysAgo: 30 },
    { walletIndex: 0, type: "income", category: "Salary & Income", description: "Relio Ltd — director salary", amount: 450000, daysAgo: 31 },
    { walletIndex: 0, type: "expense", category: "Bills & Utilities", description: "CEB electricity", amount: 14200, daysAgo: 33 },
    { walletIndex: 0, type: "expense", category: "Transport", description: "PickMe — daily commute", amount: 8900, daysAgo: 6 },
    { walletIndex: 1, type: "expense", category: "Business", description: "OpenAI API credits", amount: 180, daysAgo: 4 },
    { walletIndex: 0, type: "expense", category: "Other", description: "Charity donation — SOS Children's", amount: 25000, daysAgo: 40 },
    { walletIndex: 3, type: "expense", category: "Entertainment", description: "West End theatre tickets", amount: 120, daysAgo: 24 },
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Team lunch — Café Kumbuk", amount: 15800, daysAgo: 15 },
    { walletIndex: 1, type: "income", category: "Freelance Income", description: "Bluewave Health discovery sprint", amount: 5500, daysAgo: 45 },
    { walletIndex: 0, type: "expense", category: "Travel", description: "Visa fees — UK business trip", amount: 35000, daysAgo: 26 },
    { walletIndex: 2, type: "income", category: "Freelance Income", description: "Pacific SaaS keynote", amount: 900, daysAgo: 38 },
    { walletIndex: 0, type: "expense", category: "Savings & Investments", description: "Index fund — CDIC", amount: 200000, daysAgo: 42 },
    { walletIndex: 0, type: "expense", category: "Business", description: "Accountant — quarterly review", amount: 45000, daysAgo: 27 },
    { walletIndex: 1, type: "expense", category: "Travel", description: "Singapore Grab + MRT", amount: 95, daysAgo: 17 },
    { walletIndex: 0, type: "expense", category: "Health", description: "Gym membership — Fitness First", amount: 18000, daysAgo: 8 },
    { walletIndex: 0, type: "income", category: "Freelance Income", description: "Orbit Logistics proposal fee", amount: 125000, daysAgo: 50 },
    { walletIndex: 0, type: "expense", category: "Shopping", description: "Work wardrobe refresh", amount: 52000, daysAgo: 36 },
    { walletIndex: 1, type: "expense", category: "Subscriptions", description: "GitHub + Sentry", amount: 65, daysAgo: 5 },
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Delivery — PickMe Food", amount: 7800, daysAgo: 0 },
    { walletIndex: 1, type: "income", category: "Salary & Income", description: "Meridian Cloud — Q2 payment", amount: 12000, daysAgo: 60 },
    { walletIndex: 0, type: "expense", category: "Bills & Utilities", description: "Water board", amount: 3200, daysAgo: 34 },
    { walletIndex: 0, type: "expense", category: "Transport", description: "Vehicle service — Toyota", amount: 35000, daysAgo: 55 },
    { walletIndex: 2, type: "expense", category: "Business", description: "Contractor — UI audit", amount: 650, daysAgo: 20 },
    { walletIndex: 0, type: "income", category: "Freelance Income", description: "Colombo FinTech Hub sponsorship", amount: 180000, daysAgo: 62 },
    { walletIndex: 0, type: "expense", category: "Entertainment", description: "Cricket match tickets", amount: 12000, daysAgo: 48 },
    { walletIndex: 1, type: "expense", category: "Business", description: "DocuSign + PandaDoc", amount: 55, daysAgo: 12 },
    { walletIndex: 0, type: "expense", category: "Travel", description: "Hotel — Galle Face", amount: 42000, daysAgo: 9 },
    { walletIndex: 3, type: "expense", category: "Food & Dining", description: "Pub dinner — Manchester", amount: 48, daysAgo: 58 },
    { walletIndex: 0, type: "expense", category: "Subscriptions", description: "Apple iCloud + Google One", amount: 3200, daysAgo: 5 },
    { walletIndex: 1, type: "income", category: "Freelance Income", description: "Apex Ventures advisory session", amount: 2000, daysAgo: 44 },
    { walletIndex: 0, type: "expense", category: "Business", description: "Company registration renewal", amount: 28000, daysAgo: 70 },
    { walletIndex: 0, type: "income", category: "Salary & Income", description: "Relio Ltd — director salary", amount: 450000, daysAgo: 61 },
    { walletIndex: 0, type: "expense", category: "Savings & Investments", description: "Emergency fund transfer", amount: 100000, daysAgo: 15 },
    { walletIndex: 1, type: "expense", category: "Travel", description: "Airport transfer — Changi", amount: 35, daysAgo: 18 },
    { walletIndex: 0, type: "expense", category: "Food & Dining", description: "Anniversary dinner — Nihonbashi", amount: 38000, daysAgo: 52 },
    { walletIndex: 2, type: "income", category: "Freelance Income", description: "Emma Clarke brand guidelines", amount: 1200, daysAgo: 29 },
    { walletIndex: 0, type: "expense", category: "Health", description: "Dental check-up", amount: 15000, daysAgo: 41 },
    { walletIndex: 0, type: "expense", category: "Business", description: "Pitch deck printing", amount: 8500, daysAgo: 23 },
    { walletIndex: 1, type: "expense", category: "Entertainment", description: "Conference after-party", amount: 85, daysAgo: 21 },
    { walletIndex: 0, type: "expense", category: "Transport", description: "Highway tolls", amount: 4500, daysAgo: 7 },
    { walletIndex: 0, type: "income", category: "Freelance Income", description: "Zenith Retail — phase 1 delivery", amount: 280000, daysAgo: 75 },
  ];

  const fixedDeposits = [
    {
      bankName: "Commercial Bank of Ceylon",
      accountNumber: "882014567890",
      branch: "Colombo Fort",
      currency: "LKR",
      principalAmount: 2500000,
      currentBalance: 2687500,
      interestRate: 12.5,
      openedDate: iso(subMonths(now, 14)),
      maturityDate: iso(addMonths(now, 10)),
      nextInterestPayment: iso(addDays(now, 18)),
      nextInterestAmount: 26041,
      interestDispositionAccount: "882014567890",
      notes: "12-month FD — auto-renew at maturity",
    },
    {
      bankName: "Hatton National Bank",
      accountNumber: "004123987654",
      branch: "Union Place",
      currency: "LKR",
      principalAmount: 1800000,
      currentBalance: 1926000,
      interestRate: 11.75,
      openedDate: iso(subMonths(now, 8)),
      maturityDate: iso(addMonths(now, 4)),
      nextInterestPayment: iso(addDays(now, 12)),
      nextInterestAmount: 17625,
      notes: "6-month rollover from previous term",
    },
    {
      bankName: "Sampath Bank",
      accountNumber: "103456789012",
      branch: "Nugegoda",
      currency: "USD",
      principalAmount: 15000,
      currentBalance: 15840,
      interestRate: 4.25,
      openedDate: iso(subMonths(now, 6)),
      maturityDate: iso(addMonths(now, 6)),
      nextInterestPayment: iso(addDays(now, 25)),
      nextInterestAmount: 53.13,
      notes: "USD savings — foreign income reserve",
    },
  ];

  const notes = [
    {
      title: "Series A prep — investor narrative",
      body: "Focus on revenue retention (118% NRR) and expansion into UAE. Lead with Meridian case study. Avoid over-indexing on feature list — investors care about distribution.",
      type: "idea",
      mood: "inspired",
      tags: ["fundraising", "strategy"],
      isPinned: true,
    },
    {
      title: "Meridian Cloud — discovery call notes",
      body: "Sarah wants SSO + audit logs before Q3 rollout. Ethan confirmed API limits are fine. Send security questionnaire by Friday. Follow up on 50-seat pilot pricing.",
      type: "meeting",
      mood: "calm",
      tags: ["sales", "enterprise"],
    },
    {
      title: "Why personal CRM + finance in one app",
      body: "Most founders track relationships in one tool and money in another. Relio connects the dots — who you met, what you spent pursuing them, and whether the ROI is there.",
      type: "article",
      mood: "excited",
      tags: ["product", "positioning"],
      url: "https://example.com/personal-crm-finance",
      urlTitle: "The case for unified life ops",
      urlDescription: "How founders lose context when tools don't talk to each other.",
    },
    {
      title: "Decision: pricing model for Relio Pro",
      body: "Going with $19/mo individual, $49/mo team (up to 5). Free tier stays at 100 contacts. Revisit after 500 paid users.",
      type: "decision",
      mood: "urgent",
      tags: ["pricing", "product"],
      isPinned: true,
    },
    {
      title: "Apex Ventures follow-up questions",
      body: "Leila asked about CAC payback and gross margin at scale. Prepare 18-month model. James wants intro to Meridian as reference customer.",
      type: "meeting",
      mood: "unsure",
      tags: ["investor", "fundraising"],
    },
    {
      title: "Colombo apartment hunt criteria",
      body: "2 bed, near Havelock Rd or Bambalapitiya. Budget 45–55M LKR. Need parking + fibre. Shortlist: Monarch, Clearpoint, Empire.",
      type: "goal",
      mood: "calm",
      tags: ["personal", "home"],
    },
    {
      title: "Random — book recommendations from Ravi",
      body: "The Mom Test, Obviously Awesome, Amp It Up. Also: Sri Lankan fintech report from Lankan Angel Network.",
      type: "random",
      tags: ["reading"],
    },
    {
      title: "Q2 marketing plan sketch",
      body: "1) Founder-led LinkedIn 3x/week 2) FinTech Hub event sponsorship 3) Case study with Northstar 4) Product Hunt relaunch in August.",
      type: "idea",
      mood: "inspired",
      tags: ["marketing", "growth"],
    },
  ];

  const goals = [
    {
      title: "Close Series A round",
      description: "Raise $1.5M from Apex or similar fund to scale GTM.",
      category: "business",
      status: "active",
      targetDate: iso(addMonths(now, 6)),
      targetAmount: 1500000,
      currentAmount: 320000,
      currency: "USD",
      coverEmoji: "🚀",
      isPinned: true,
      financeLink: true,
      milestones: [
        { id: "m1", title: "Finalize pitch deck", completed: true, completedAt: isoDateTime(daysAgo(30)) },
        { id: "m2", title: "10 investor meetings", completed: true, completedAt: isoDateTime(daysAgo(10)) },
        { id: "m3", title: "Term sheet signed", completed: false },
        { id: "m4", title: "Funds in bank", completed: false },
      ],
    },
    {
      title: "Buy apartment in Colombo",
      description: "2-bed near the coast, 45–55M LKR budget.",
      category: "home",
      status: "active",
      targetDate: iso(addMonths(now, 14)),
      targetAmount: 50000000,
      currentAmount: 12500000,
      currency: "LKR",
      coverEmoji: "🏠",
      financeLink: true,
      milestones: [
        { id: "m1", title: "Save 25% down payment", completed: false },
        { id: "m2", title: "Get pre-approval", completed: false },
        { id: "m3", title: "Shortlist 3 properties", completed: true, completedAt: isoDateTime(daysAgo(20)) },
      ],
    },
    {
      title: "Run the Colombo Marathon",
      description: "Sub-4:30 finish. Training 4x per week.",
      category: "health",
      status: "active",
      targetDate: iso(addMonths(now, 8)),
      coverEmoji: "🏃",
      milestones: [
        { id: "m1", title: "Complete 10K under 50 min", completed: true, completedAt: isoDateTime(daysAgo(45)) },
        { id: "m2", title: "Run half marathon", completed: false },
        { id: "m3", title: "Race day", completed: false },
      ],
    },
    {
      title: "Bali sabbatical month",
      description: "4 weeks in Ubud for deep work + reset.",
      category: "travel",
      status: "dream",
      targetDate: iso(addMonths(now, 10)),
      targetAmount: 8000,
      currentAmount: 2400,
      currency: "USD",
      coverEmoji: "🌴",
      financeLink: true,
    },
    {
      title: "Build 6-month emergency fund",
      description: "6 months of living expenses in liquid savings.",
      category: "finance",
      status: "active",
      targetAmount: 3600000,
      currentAmount: 2100000,
      currency: "LKR",
      coverEmoji: "🛡️",
      isPinned: true,
      financeLink: true,
      milestones: [
        { id: "m1", title: "Reach 3-month mark", completed: true, completedAt: isoDateTime(daysAgo(60)) },
        { id: "m2", title: "Reach 6-month mark", completed: false },
      ],
    },
  ];

  const lifeEvents = [
    { title: "Founded Relio", description: "Left consulting to build personal CRM + finance for founders.", date: iso(subMonths(now, 18)), category: "career", emoji: "🚀", mood: "amazing" },
    { title: "First paying customer", description: "Northstar Analytics signed annual plan.", date: iso(subMonths(now, 14)), category: "milestone", emoji: "💰", mood: "amazing" },
    { title: "Moved to new Colombo office", description: "WeWork Colombo — bigger space for small team.", date: iso(subMonths(now, 9)), category: "career", emoji: "🏢", mood: "good" },
    { title: "Closed Meridian enterprise deal", description: "$120K ACV — biggest contract to date.", date: iso(subMonths(now, 5)), category: "finance", emoji: "🤝", mood: "amazing" },
    { title: "Singapore investor roadshow", description: "Met 8 funds in 4 days. Apex and two others interested.", date: iso(subMonths(now, 3)), category: "travel", emoji: "✈️", mood: "good" },
    { title: "Completed first marathon training block", description: "10K PR at Colombo Night Run.", date: iso(subMonths(now, 2)), category: "health", emoji: "🏃", mood: "good" },
    { title: "Parents' 35th anniversary", description: "Celebrated in Kandy with family.", date: iso(subMonths(now, 1)), category: "personal", emoji: "❤️", mood: "amazing" },
    { title: "Launched Relio Brain feature", description: "Notes, ideas, and decisions in one searchable place.", date: iso(daysAgo(21)), category: "milestone", emoji: "🧠", mood: "good" },
    { title: "Dubai FinTech summit", description: "Keynote on founder ops stack. 40+ leads collected.", date: iso(daysAgo(35)), category: "travel", emoji: "🌍", mood: "good" },
    { title: "Emergency fund milestone", description: "Hit 3 months of expenses saved.", date: iso(daysAgo(60)), category: "finance", emoji: "🛡️", mood: "neutral" },
  ];

  const activities = [
    { type: "contact_added", description: "Added contact Maya Singh", daysAgo: 1 },
    { type: "transaction_added", description: "Added transaction — Food & Dining LKR 7,800", daysAgo: 0 },
    { type: "hubspot_import", description: "Imported 12 contacts from HubSpot", daysAgo: 3 },
    { type: "note_added", description: 'Saved note "Series A prep — investor narrative"', daysAgo: 4 },
    { type: "goal_added", description: 'Added goal "Close Series A round"', daysAgo: 7 },
    { type: "fd_added", description: "Added FD — Commercial Bank LKR 2,500,000", daysAgo: 14 },
    { type: "wallet_added", description: "Added wallet Commercial Bank — Operating", daysAgo: 30 },
    { type: "company_added", description: "Added company Meridian Cloud Systems", daysAgo: 45 },
    { type: "google_import", description: "Imported 8 contacts from Google", daysAgo: 12 },
    { type: "life_event_added", description: 'Added life event "Launched Relio Brain feature"', daysAgo: 21 },
    { type: "transactions_imported", description: "Imported 24 transactions from CSV", daysAgo: 28 },
    { type: "linkedin_import", description: "Imported 6 contacts from LinkedIn", daysAgo: 35 },
  ];

  return {
    companies: companies.map((c) => ({ ...c, userId })),
    contacts: contacts.map((c) => ({ ...c, userId })),
    wallets: wallets.map((w) => ({ ...w, userId })),
    transactionTemplates,
    fixedDeposits: fixedDeposits.map((fd) => ({ ...fd, userId })),
    notes: notes.map((n) => ({ ...n, userId })),
    goals: goals.map((g) => ({ ...g, userId })),
    lifeEvents: lifeEvents.map((e) => ({ ...e, userId })),
    activities: activities.map((a) => ({ ...a, userId })),
  };
}

async function queryByUserId(db, collectionName, userId) {
  const snapshot = await db
    .collection(collectionName)
    .where("userId", "==", userId)
    .get();
  return snapshot.docs;
}

async function batchDelete(db, refs) {
  const chunkSize = 500;
  for (let i = 0; i < refs.length; i += chunkSize) {
    const batch = db.batch();
    refs.slice(i, i + chunkSize).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteUserData(db, userId) {
  console.log(`Clearing existing data for ${userId}...`);

  for (const collectionName of USER_COLLECTIONS) {
    const docs = await queryByUserId(db, collectionName, userId);
    if (docs.length === 0) continue;
    console.log(`  delete ${collectionName}: ${docs.length}`);
    await batchDelete(db, docs.map((d) => d.ref));
  }

  for (const sub of USER_SUBCOLLECTIONS) {
    const snapshot = await db.collection("users").doc(userId).collection(sub).get();
    if (snapshot.empty) continue;
    console.log(`  delete users/*/${sub}: ${snapshot.size}`);
    await batchDelete(db, snapshot.docs.map((d) => d.ref));
  }
}

function omitUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  );
}

async function batchSet(db, entries) {
  const chunkSize = 500;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const batch = db.batch();
    entries.slice(i, i + chunkSize).forEach(({ ref, data }) => batch.set(ref, omitUndefined(data)));
    await batch.commit();
  }
}

async function seedDemoUser(db, userId, { dryRun }) {
  const demo = buildDemoData(userId);
  const now = new Date().toISOString();

  if (dryRun) {
    console.log("Would seed:");
    console.log(`  companies: ${demo.companies.length}`);
    console.log(`  contacts: ${demo.contacts.length}`);
    console.log(`  wallets: ${demo.wallets.length}`);
    console.log(`  transactions: ${demo.transactionTemplates.length}`);
    console.log(`  fixedDeposits: ${demo.fixedDeposits.length}`);
    console.log(`  notes: ${demo.notes.length}`);
    console.log(`  goals: ${demo.goals.length}`);
    console.log(`  lifeEvents: ${demo.lifeEvents.length}`);
    console.log(`  activities: ${demo.activities.length}`);
    return;
  }

  await deleteUserData(db, userId);

  const companyIdByName = new Map();
  const companyEntries = demo.companies.map((company) => {
    const ref = db.collection("companies").doc();
    companyIdByName.set(company.name, ref.id);
    return {
      ref,
      data: {
        ...company,
        createdAt: isoDateTime(subDays(new Date(), 60)),
        updatedAt: now,
      },
    };
  });
  await batchSet(db, companyEntries);
  console.log(`  companies: ${companyEntries.length}`);

  const contactIdByEmail = new Map();
  const contactEntries = demo.contacts.map((contact, index) => {
    const ref = db.collection("contacts").doc();
    contactIdByEmail.set(contact.email, ref.id);
    return {
      ref,
      data: {
        ...contact,
        companyId: companyIdByName.get(contact.companyName),
        createdAt: isoDateTime(subDays(new Date(), 50 - index)),
        updatedAt: now,
      },
    };
  });
  await batchSet(db, contactEntries);
  console.log(`  contacts: ${contactEntries.length}`);

  const walletIds = [];
  const walletEntries = demo.wallets.map((wallet, index) => {
    const ref = db.collection("wallets").doc();
    walletIds.push(ref.id);
    return {
      ref,
      data: {
        ...wallet,
        createdAt: isoDateTime(subDays(new Date(), 90 - index * 10)),
      },
    };
  });
  await batchSet(db, walletEntries);
  console.log(`  wallets: ${walletEntries.length}`);

  const transactionEntries = demo.transactionTemplates.map((tx) => {
    const ref = db.collection("transactions").doc();
    const date = iso(daysAgo(tx.daysAgo));
    return {
      ref,
      data: {
        walletId: walletIds[tx.walletIndex],
        type: tx.type,
        category: tx.category,
        description: tx.description,
        amount: tx.amount,
        date,
        userId,
        createdAt: isoDateTime(daysAgo(tx.daysAgo)),
      },
    };
  });
  await batchSet(db, transactionEntries);
  console.log(`  transactions: ${transactionEntries.length}`);

  const fdEntries = demo.fixedDeposits.map((fd) => ({
    ref: db.collection("fixedDeposits").doc(),
    data: { ...fd, createdAt: now },
  }));
  await batchSet(db, fdEntries);
  console.log(`  fixedDeposits: ${fdEntries.length}`);

  const noteIds = [];
  const noteEntries = demo.notes.map((note, index) => {
    const ref = db.collection("notes").doc();
    noteIds.push(ref.id);
    const linkedContactIds =
      index === 1
        ? [contactIdByEmail.get("sarah.chen@meridiancloud.io")].filter(Boolean)
        : index === 4
          ? [contactIdByEmail.get("j.whitfield@apexvc.com")].filter(Boolean)
          : undefined;
    const linkedCompanyIds =
      index === 1
        ? [companyIdByName.get("Meridian Cloud Systems")].filter(Boolean)
        : undefined;

    return {
      ref,
      data: {
        ...note,
        ...(linkedContactIds?.length ? { linkedContactIds } : {}),
        ...(linkedCompanyIds?.length ? { linkedCompanyIds } : {}),
        createdAt: isoDateTime(subDays(new Date(), 20 - index * 2)),
        updatedAt: now,
      },
    };
  });
  await batchSet(db, noteEntries);
  console.log(`  notes: ${noteEntries.length}`);

  const goalEntries = demo.goals.map((goal, index) => ({
    ref: db.collection("goals").doc(),
    data: {
      ...goal,
      linkedContactIds:
        index === 0
          ? [
              contactIdByEmail.get("j.whitfield@apexvc.com"),
              contactIdByEmail.get("leila@apexvc.com"),
            ].filter(Boolean)
          : undefined,
      linkedNoteIds:
        index === 0 ? [noteIds[0], noteIds[4]].filter(Boolean) : index === 1 ? [noteIds[5]] : undefined,
      createdAt: isoDateTime(subDays(new Date(), 40 - index * 5)),
      updatedAt: now,
    },
  }));
  await batchSet(db, goalEntries);
  console.log(`  goals: ${goalEntries.length}`);

  const lifeEventEntries = demo.lifeEvents.map((event) => ({
    ref: db.collection("lifeEvents").doc(),
    data: {
      ...event,
      createdAt: isoDateTime(parseISO(event.date)),
    },
  }));
  await batchSet(db, lifeEventEntries);
  console.log(`  lifeEvents: ${lifeEventEntries.length}`);

  const activityEntries = demo.activities.map((activity) => ({
    ref: db.collection("activities").doc(),
    data: {
      userId,
      type: activity.type,
      description: activity.description,
      createdAt: isoDateTime(daysAgo(activity.daysAgo)),
    },
  }));
  await batchSet(db, activityEntries);
  console.log(`  activities: ${activityEntries.length}`);

  const userRef = db.collection("users").doc(userId);
  await userRef.collection("preferences").doc("settings").set({
    theme: "system",
    defaultCountry: "Sri Lanka",
    defaultCountryCode: "LK",
    birthYear: 1992,
  });
  await userRef.collection("onboarding").doc("state").set({
    completed: true,
    welcomeDone: true,
    checklistDismissed: true,
    name: "Alex",
    heardFrom: "friend",
    useCase: ["crm", "finance", "notes"],
    pagesCompleted: {
      contacts: true,
      companies: true,
      finance: true,
      brain: true,
      lifemap: true,
    },
  });
  await userRef.collection("integrations").doc("hubspot").set({
    token: "demo-hubspot-token-not-real",
    connectedAt: isoDateTime(daysAgo(45)),
    lastSyncedAt: isoDateTime(daysAgo(3)),
  });
  await userRef.collection("integrations").doc("google").set({
    accessToken: "demo-google-token-not-real",
    connectedAt: isoDateTime(daysAgo(30)),
    lastSyncedAt: isoDateTime(daysAgo(12)),
    lastImportCount: 8,
  });
  await userRef.collection("integrations").doc("linkedin").set({
    lastSyncedAt: isoDateTime(daysAgo(35)),
    lastImportCount: 6,
  });
  console.log("  preferences, onboarding, integrations: set");
}

function parseISO(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Seed a Relio demo account with realistic sample data.

Options:
  --uid <firebaseUid>   Target user (default: ${DEFAULT_DEMO_UID})
  --dry-run             Show counts only
  --help                Show this help
`);
    return;
  }

  initAdmin();
  const auth = getAuth();
  const db = getFirestore();

  try {
    const user = await auth.getUser(args.uid);
    console.log(`Seeding demo data for ${user.email ?? user.uid} (${args.uid})`);
  } catch {
    console.log(`Seeding demo data for uid ${args.uid} (auth user not verified)`);
  }

  await seedDemoUser(db, args.uid, args);
  console.log(args.dryRun ? "\nDry run complete." : "\nDemo account ready!");
}

main().catch((error) => {
  console.error("\nError:", error.message ?? error);
  process.exit(1);
});
