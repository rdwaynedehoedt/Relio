import {
  addDays,
  endOfDay,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { CalendarEvent, Contact, Company } from "@/lib/types";
import { addContact, logActivity } from "@/lib/firestore";
import {
  GOOGLE_API_DISABLED_CODE,
  googleApiDisabledFromPayload,
} from "@/lib/google-api-errors";
import {
  GOOGLE_CALENDAR_SCOPE_MISSING_CODE,
  GOOGLE_TOKEN_EXPIRED_CODE,
  GoogleCalendarScopeMissingError,
  GoogleTokenExpiredError,
  isGoogleCalendarAuthError,
} from "@/lib/google-token";

export type GoogleCalendarApiEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string }>;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

export function extractMeetLink(event: GoogleCalendarApiEvent): string | undefined {
  if (event.hangoutLink) return event.hangoutLink;

  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );

  return videoEntry?.uri;
}

export function mapGoogleEvent(event: GoogleCalendarApiEvent): CalendarEvent | null {
  const startRaw = event.start?.dateTime ?? event.start?.date;
  const endRaw = event.end?.dateTime ?? event.end?.date;

  if (!event.id || !startRaw || !endRaw) return null;

  const attendeeEmails = event.attendees
    ?.map((attendee) => attendee.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  return {
    id: event.id,
    googleEventId: event.id,
    title: event.summary?.trim() || "Untitled event",
    description: event.description,
    startTime: startRaw,
    endTime: endRaw,
    attendeeEmails,
    location: event.location,
    meetLink: extractMeetLink(event),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function matchEventsToContacts(
  events: CalendarEvent[],
  contacts: Contact[],
): CalendarEvent[] {
  const emailToContact = new Map<string, Contact>();

  for (const contact of contacts) {
    if (!contact.email) continue;
    emailToContact.set(normalizeEmail(contact.email), contact);
  }

  return events.map((event) => {
    const linkedContactIds: string[] = [];

    for (const email of event.attendeeEmails ?? []) {
      const contact = emailToContact.get(normalizeEmail(email));
      if (contact?.id) {
        linkedContactIds.push(contact.id);
      }
    }

    const linkedCompanyId = inferLinkedCompanyId(
      linkedContactIds,
      contacts,
    );

    return {
      ...event,
      linkedContactIds: linkedContactIds.length > 0 ? linkedContactIds : undefined,
      linkedCompanyId,
    };
  });
}

export function inferLinkedCompanyId(
  linkedContactIds: string[],
  contacts: Contact[],
): string | undefined {
  if (linkedContactIds.length < 2) return undefined;

  const companyNames = new Map<string, number>();

  for (const contactId of linkedContactIds) {
    const contact = contacts.find((item) => item.id === contactId);
    const companyName = contact?.companyName?.trim().toLowerCase();
    if (!companyName) continue;

    companyNames.set(companyName, (companyNames.get(companyName) ?? 0) + 1);
  }

  const sharedCompany = [...companyNames.entries()].find(([, count]) => count >= 2);
  if (!sharedCompany) return undefined;

  const contact = contacts.find(
    (item) =>
      item.companyName?.trim().toLowerCase() === sharedCompany[0] &&
      item.companyId,
  );

  return contact?.companyId;
}

export function linkEventsToCompanies(
  events: CalendarEvent[],
  contacts: Contact[],
  companies: Company[],
): CalendarEvent[] {
  return events.map((event) => {
    if (event.linkedCompanyId) return event;

    const linkedContactIds = event.linkedContactIds ?? [];
    const companyId = inferLinkedCompanyIdFromCompanies(
      linkedContactIds,
      contacts,
      companies,
    );

    if (!companyId) return event;

    return { ...event, linkedCompanyId: companyId };
  });
}

function inferLinkedCompanyIdFromCompanies(
  linkedContactIds: string[],
  contacts: Contact[],
  companies: Company[],
): string | undefined {
  if (linkedContactIds.length < 2) return undefined;

  const companyNameCounts = new Map<string, number>();

  for (const contactId of linkedContactIds) {
    const contact = contacts.find((item) => item.id === contactId);
    const companyName = contact?.companyName?.trim().toLowerCase();
    if (!companyName) continue;
    companyNameCounts.set(companyName, (companyNameCounts.get(companyName) ?? 0) + 1);
  }

  const shared = [...companyNameCounts.entries()].find(([, count]) => count >= 2);
  if (!shared) return undefined;

  const company = companies.find(
    (item) => item.name.trim().toLowerCase() === shared[0],
  );

  return company?.id;
}

export function filterEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => isSameDay(parseISO(event.startTime), day));
}

export function filterEventsForRange(
  events: CalendarEvent[],
  start: Date,
  end: Date,
): CalendarEvent[] {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return events.filter((event) => {
    const eventStart = parseISO(event.startTime).getTime();
    const eventEnd = parseISO(event.endTime).getTime();
    return eventEnd >= startMs && eventStart <= endMs;
  });
}

export function getEventsForContact(
  events: CalendarEvent[],
  contactEmail: string,
): CalendarEvent[] {
  const normalized = normalizeEmail(contactEmail);

  return events
    .filter((event) =>
      event.attendeeEmails?.some((email) => normalizeEmail(email) === normalized),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getEventsForCompany(
  events: CalendarEvent[],
  companyId: string,
): CalendarEvent[] {
  return events
    .filter((event) => event.linkedCompanyId === companyId)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

export function formatEventTimeRange(event: CalendarEvent): string {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const isAllDay = event.startTime.length <= 10;

  if (isAllDay) {
    return format(start, "MMM d, yyyy");
  }

  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

export function formatEventDate(event: CalendarEvent): string {
  return format(parseISO(event.startTime), "MMM d, yyyy");
}

export type CalendarViewMode = "day" | "week" | "month";

export function getViewRange(
  view: CalendarViewMode,
  anchorDate: Date,
): { start: Date; end: Date } {
  if (view === "day") {
    return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
  }

  if (view === "week") {
    return {
      start: startOfDay(anchorDate),
      end: endOfDay(addDays(anchorDate, 6)),
    };
  }

  return {
    start: startOfMonth(anchorDate),
    end: endOfMonth(anchorDate),
  };
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const response = await fetch(`/api/calendar/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      activationUrl?: string;
      serviceTitle?: string;
    };

    if (body.code === GOOGLE_API_DISABLED_CODE) {
      throw googleApiDisabledFromPayload("calendar", body);
    }

    if (response.status === 401 || body.code === GOOGLE_TOKEN_EXPIRED_CODE) {
      throw new GoogleTokenExpiredError(
        body.error ?? "Google access token expired or invalid.",
      );
    }

    if (
      response.status === 403 ||
      body.code === GOOGLE_CALENDAR_SCOPE_MISSING_CODE
    ) {
      throw new GoogleCalendarScopeMissingError(
        body.error ?? "Google Calendar permission was not granted.",
      );
    }

    throw new Error(body.error ?? "Failed to fetch calendar events.");
  }

  const data = (await response.json()) as { events: CalendarEvent[] };
  return data.events;
}

export async function loadCalendarEventsForUser(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<{ events: CalendarEvent[]; accessToken: string; needsReconnect: boolean }> {
  try {
    const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);
    return { events, accessToken, needsReconnect: false };
  } catch (error) {
    if (isGoogleCalendarAuthError(error)) {
      return { events: [], accessToken, needsReconnect: true };
    }
    throw error;
  }
}

export async function matchCalendarEvents(
  events: CalendarEvent[],
  contacts: Contact[],
  companies?: Company[],
): Promise<CalendarEvent[]> {
  const response = await fetch("/api/calendar/match-contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events, contacts, companies }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to match calendar events.");
  }

  const data = (await response.json()) as { events: CalendarEvent[] };
  return data.events;
}

export async function createCalendarEvent(
  accessToken: string,
  payload: {
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmail?: string;
    description?: string;
  },
): Promise<CalendarEvent> {
  const response = await fetch("/api/calendar/create-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      activationUrl?: string;
      serviceTitle?: string;
    };

    if (body.code === GOOGLE_API_DISABLED_CODE) {
      throw googleApiDisabledFromPayload("calendar", body);
    }

    if (response.status === 401 || body.code === GOOGLE_TOKEN_EXPIRED_CODE) {
      throw new GoogleTokenExpiredError(
        body.error ?? "Google access token expired or invalid.",
      );
    }

    if (
      response.status === 403 ||
      body.code === GOOGLE_CALENDAR_SCOPE_MISSING_CODE
    ) {
      throw new GoogleCalendarScopeMissingError(
        body.error ?? "Google Calendar permission was not granted.",
      );
    }

    throw new Error(body.error ?? "Failed to create calendar event.");
  }

  const data = (await response.json()) as { event: CalendarEvent };
  return data.event;
}

export function groupEventsByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = format(parseISO(event.startTime), "MMMM yyyy");
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return groups;
}

export function isPastEvent(event: CalendarEvent): boolean {
  return parseISO(event.endTime).getTime() < Date.now();
}

export async function createContactFromAttendee(
  userId: string,
  email: string,
): Promise<Contact> {
  const localPart = email.split("@")[0] ?? email;
  const nameParts = localPart.replace(/[._]/g, " ").split(" ");

  const contact = await addContact({
    userId,
    firstName: nameParts[0] ?? localPart,
    lastName: nameParts.slice(1).join(" ") || "",
    email,
    source: "manual",
  });

  await logActivity(
    userId,
    "contact_from_meeting",
    `Added contact from meeting attendee: ${email}`,
  );

  return contact;
}

export function getEventTopPercent(event: CalendarEvent, dayStartHour = 0): number {
  const start = parseISO(event.startTime);
  const minutes = start.getHours() * 60 + start.getMinutes() - dayStartHour * 60;
  return (minutes / (24 * 60)) * 100;
}

export function getEventHeightPercent(event: CalendarEvent): number {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  return Math.max((durationMinutes / (24 * 60)) * 100, 2.5);
}
