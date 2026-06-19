import { NextResponse } from "next/server";
import {
  linkEventsToCompanies,
  matchEventsToContacts,
} from "@/lib/calendar-utils";
import type { CalendarEvent, Contact, Company } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      events?: CalendarEvent[];
      contacts?: Contact[];
      companies?: Company[];
    };

    const events = body.events ?? [];
    const contacts = body.contacts ?? [];
    const companies = body.companies ?? [];

    if (!events.length) {
      return NextResponse.json({ events: [] });
    }

    const matched = matchEventsToContacts(events, contacts);
    const withCompanies = linkEventsToCompanies(matched, contacts, companies);

    return NextResponse.json({ events: withCompanies });
  } catch (error) {
    console.error("Calendar match-contacts failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to match calendar events to contacts.",
      },
      { status: 500 },
    );
  }
}
