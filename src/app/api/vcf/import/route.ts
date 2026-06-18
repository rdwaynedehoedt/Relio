import { NextResponse } from "next/server";
import vCard from "vcf";
import type { VcfImportContact } from "@/lib/types";

type VcfProperty = {
  _data?: string;
};

function propValue(property: VcfProperty | VcfProperty[] | null | undefined): string {
  if (!property) return "";

  const item = Array.isArray(property) ? property[0] : property;
  return item?._data?.trim() || "";
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function parseAddress(property: VcfProperty | VcfProperty[] | null | undefined) {
  const raw = propValue(property);
  if (!raw) return { city: "", country: "" };

  const parts = raw.split(";").map((part) => part.trim());
  return {
    city: parts[3] || "",
    country: parts[6] || "",
  };
}

function mapCard(card: {
  get: (key: string) => VcfProperty | VcfProperty[] | null | undefined;
}): VcfImportContact {
  const fullName = propValue(card.get("fn"));
  const { firstName, lastName } = splitName(fullName);
  const { city, country } = parseAddress(card.get("adr"));
  const url = propValue(card.get("url"));

  return {
    firstName: firstName || "",
    lastName: lastName || "",
    email: propValue(card.get("email")),
    phone: propValue(card.get("tel")),
    companyName: propValue(card.get("org")),
    role: propValue(card.get("title")),
    city: city || "",
    country: country || "",
    linkedInUrl: url.toLowerCase().includes("linkedin") ? url : "",
    notes: propValue(card.get("note")),
    source: "vcf",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { vcf?: string };
    const vcfContent = body.vcf?.trim();

    if (!vcfContent) {
      return NextResponse.json(
        { error: "VCF content is required." },
        { status: 400 },
      );
    }

    const cards = vCard.parse(vcfContent) as Array<{
      get: (key: string) => VcfProperty | VcfProperty[] | null | undefined;
    }>;

    const contacts = cards
      .map(mapCard)
      .filter((contact) =>
        Boolean(
          contact.firstName ||
            contact.lastName ||
            contact.email ||
            contact.phone,
        ),
      );

    return NextResponse.json({
      contacts,
      total: contacts.length,
    });
  } catch (error) {
    console.error("VCF import failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to import VCF file.",
      },
      { status: 500 },
    );
  }
}
