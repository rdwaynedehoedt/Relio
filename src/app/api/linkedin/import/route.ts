import { NextResponse } from "next/server";
import Papa from "papaparse";
import type { LinkedInImportContact } from "@/lib/types";

type LinkedInRow = Record<string, string | undefined>;

function cell(row: LinkedInRow, key: string): string {
  return row[key]?.trim() || "";
}

function mapRow(row: LinkedInRow): LinkedInImportContact {
  return {
    firstName: cell(row, "First Name"),
    lastName: cell(row, "Last Name"),
    email: cell(row, "Email Address"),
    companyName: cell(row, "Company"),
    role: cell(row, "Position"),
    lastInteractionDate: cell(row, "Connected On"),
    source: "linkedin",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { csv?: string };
    const csv = body.csv?.trim();

    if (!csv) {
      return NextResponse.json(
        { error: "CSV content is required." },
        { status: 400 },
      );
    }

    const parsed = Papa.parse<LinkedInRow>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message || "Failed to parse CSV.");
    }

    const contacts = (parsed.data ?? []).map(mapRow).filter((contact) =>
      Boolean(
        contact.firstName ||
          contact.lastName ||
          contact.email ||
          contact.companyName,
      ),
    );

    return NextResponse.json({
      contacts,
      total: contacts.length,
    });
  } catch (error) {
    console.error("LinkedIn import failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import LinkedIn connections.",
      },
      { status: 500 },
    );
  }
}
