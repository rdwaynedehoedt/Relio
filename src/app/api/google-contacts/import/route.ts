import { NextResponse } from "next/server";
import type { GoogleImportContact } from "@/lib/types";

const PERSON_FIELDS = [
  "names",
  "emailAddresses",
  "phoneNumbers",
  "organizations",
  "addresses",
  "urls",
  "biographies",
].join(",");

type GooglePerson = {
  resourceName?: string;
  names?: Array<{ givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  organizations?: Array<{ title?: string; name?: string }>;
  addresses?: Array<{ city?: string; country?: string }>;
  biographies?: Array<{ value?: string }>;
};

function fieldValue<T>(items: T[] | undefined, pick: (item: T) => string): string {
  if (!items?.length) return "";
  return pick(items[0]) || "";
}

function mapPerson(person: GooglePerson): GoogleImportContact {
  return {
    firstName: fieldValue(person.names, (name) => name.givenName || ""),
    lastName: fieldValue(person.names, (name) => name.familyName || ""),
    email: fieldValue(person.emailAddresses, (email) => email.value || ""),
    phone: fieldValue(person.phoneNumbers, (phone) => phone.value || ""),
    role: fieldValue(person.organizations, (org) => org.title || ""),
    companyName: fieldValue(person.organizations, (org) => org.name || ""),
    city: fieldValue(person.addresses, (address) => address.city || ""),
    country: fieldValue(person.addresses, (address) => address.country || ""),
    notes: fieldValue(person.biographies, (bio) => bio.value || ""),
    source: "google",
    googleId: person.resourceName || "",
  };
}

async function fetchGoogleConnections(
  accessToken: string,
): Promise<GooglePerson[]> {
  const people: GooglePerson[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      "https://people.googleapis.com/v1/people/me/connections",
    );
    url.searchParams.set("personFields", PERSON_FIELDS);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google People API error (${response.status}): ${errorBody || response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      connections?: GooglePerson[];
      nextPageToken?: string;
    };

    people.push(...(data.connections ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return people;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = body.accessToken?.trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google access token is required." },
        { status: 400 },
      );
    }

    const people = await fetchGoogleConnections(accessToken);
    const contacts = people.map(mapPerson);

    return NextResponse.json({
      contacts,
      total: contacts.length,
    });
  } catch (error) {
    console.error("Google Contacts import failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import from Google Contacts.",
      },
      { status: 500 },
    );
  }
}
