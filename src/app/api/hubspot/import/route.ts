import { NextResponse } from "next/server";
import { extractDomain, fetchCompanyLogo } from "@/lib/domain-utils";
import type {
  HubSpotImportCompany,
  HubSpotImportContact,
} from "@/lib/types";

const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "jobtitle",
  "company",
  "industry",
  "website",
  "domain",
  "country",
  "city",
  "state",
  "zip",
  "address",
  "linkedin_contact_url",
  "twitterhandle",
  "lifecyclestage",
  "lead_status",
  "hs_lead_status",
  "notes_last_updated",
  "num_notes",
  "hs_analytics_source",
  "createdate",
  "lastmodifieddate",
  "last_activity_date",
  "hubspot_owner_email",
  "associatedcompanyid",
  "hs_email_domain",
  "annualrevenue",
  "numemployees",
] as const;

const COMPANY_PROPERTIES = [
  "name",
  "domain",
  "website",
  "industry",
  "description",
  "about_us",
  "country",
  "city",
  "state",
  "zip",
  "address",
  "phone",
  "numberofemployees",
  "annualrevenue",
  "founded_year",
  "linkedin_company_page",
  "twitterhandle",
  "facebook_company_page",
  "hs_lead_status",
  "lifecyclestage",
  "createdate",
  "lastmodifieddate",
  "timezone",
  "type",
] as const;

type HubSpotRecord = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

function prop(
  properties: Record<string, string | null | undefined>,
  key: string,
): string {
  return properties[key] || "";
}

async function fetchHubSpotObjects(
  token: string,
  objectType: "contacts" | "companies",
  properties: readonly string[],
): Promise<HubSpotRecord[]> {
  const results: HubSpotRecord[] = [];
  let after: string | undefined;

  do {
    const url = new URL(
      `https://api.hubapi.com/crm/v3/objects/${objectType}`,
    );
    url.searchParams.set("limit", "100");
    properties.forEach((property) =>
      url.searchParams.append("properties", property),
    );
    if (after) {
      url.searchParams.set("after", after);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HubSpot API error (${response.status}): ${errorBody || response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      results?: HubSpotRecord[];
      paging?: { next?: { after?: string } };
    };

    results.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return results;
}

function mapContact(record: HubSpotRecord): HubSpotImportContact {
  const p = record.properties;

  return {
    firstName: prop(p, "firstname"),
    lastName: prop(p, "lastname"),
    email: prop(p, "email"),
    phone: prop(p, "phone"),
    mobilePhone: prop(p, "mobilephone"),
    role: prop(p, "jobtitle"),
    companyName: prop(p, "company"),
    industry: prop(p, "industry"),
    domain: prop(p, "domain") || prop(p, "hs_email_domain"),
    website: prop(p, "website"),
    country: prop(p, "country"),
    city: prop(p, "city"),
    state: prop(p, "state"),
    zip: prop(p, "zip"),
    address: prop(p, "address"),
    linkedInUrl: prop(p, "linkedin_contact_url"),
    twitterHandle: prop(p, "twitterhandle"),
    lifecycleStage: prop(p, "lifecyclestage"),
    leadStatus: prop(p, "hs_lead_status") || prop(p, "lead_status"),
    annualRevenue: prop(p, "annualrevenue"),
    numberOfEmployees: prop(p, "numemployees"),
    lastInteractionDate:
      prop(p, "last_activity_date") || prop(p, "lastmodifieddate"),
    associatedCompanyId: prop(p, "associatedcompanyid"),
    hubspotOwnerEmail: prop(p, "hubspot_owner_email"),
    analyticsSource: prop(p, "hs_analytics_source"),
    source: "hubspot",
    hubspotId: record.id || "",
  };
}

function mapCompany(record: HubSpotRecord): HubSpotImportCompany {
  const p = record.properties;
  const domain =
    prop(p, "domain") || extractDomain(prop(p, "website"));

  return {
    name: prop(p, "name"),
    domain,
    website: prop(p, "website"),
    industry: prop(p, "industry"),
    description: prop(p, "description"),
    aboutUs: prop(p, "about_us"),
    country: prop(p, "country"),
    city: prop(p, "city"),
    state: prop(p, "state"),
    zip: prop(p, "zip"),
    address: prop(p, "address"),
    phone: prop(p, "phone"),
    numberOfEmployees: prop(p, "numberofemployees"),
    annualRevenue: prop(p, "annualrevenue"),
    foundedYear: prop(p, "founded_year"),
    linkedinUrl: prop(p, "linkedin_company_page"),
    twitterHandle: prop(p, "twitterhandle"),
    facebookUrl: prop(p, "facebook_company_page"),
    leadStatus: prop(p, "hs_lead_status"),
    lifecycleStage: prop(p, "lifecyclestage"),
    timezone: prop(p, "timezone"),
    type: prop(p, "type"),
    hubspotId: record.id || "",
    logoUrl: "",
  };
}

async function attachCompanyLogos(
  companies: HubSpotImportCompany[],
): Promise<HubSpotImportCompany[]> {
  return Promise.all(
    companies.map(async (company) => {
      const domain =
        company.domain || extractDomain(company.website);
      const logoUrl = domain ? await fetchCompanyLogo(domain) : "";

      return {
        ...company,
        domain: domain || "",
        logoUrl,
      };
    }),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "HubSpot token is required." },
        { status: 400 },
      );
    }

    const [contactRecords, companyRecords] = await Promise.all([
      fetchHubSpotObjects(token, "contacts", CONTACT_PROPERTIES),
      fetchHubSpotObjects(token, "companies", COMPANY_PROPERTIES),
    ]);

    const contacts = contactRecords.map(mapContact);
    const companies = await attachCompanyLogos(
      companyRecords.map(mapCompany),
    );

    return NextResponse.json({
      contacts,
      companies,
      total: contacts.length + companies.length,
    });
  } catch (error) {
    console.error("HubSpot import failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import from HubSpot.",
      },
      { status: 500 },
    );
  }
}
