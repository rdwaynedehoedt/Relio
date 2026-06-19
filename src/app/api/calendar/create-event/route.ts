import { NextResponse } from "next/server";
import {
  mapGoogleEvent,
  type GoogleCalendarApiEvent,
} from "@/lib/calendar-utils";
import {
  GOOGLE_TOKEN_EXPIRED_CODE,
  googleApiAuthStatus,
} from "@/lib/google-token";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google access token is required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      title?: string;
      startTime?: string;
      endTime?: string;
      attendeeEmail?: string;
      description?: string;
    };

    const title = body.title?.trim();
    const startTime = body.startTime?.trim();
    const endTime = body.endTime?.trim();

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "title, startTime, and endTime are required." },
        { status: 400 },
      );
    }

    const eventPayload: Record<string, unknown> = {
      summary: title,
      description: body.description?.trim() || undefined,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
    };

    if (body.attendeeEmail?.trim()) {
      eventPayload.attendees = [{ email: body.attendeeEmail.trim() }];
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      if (googleApiAuthStatus(response.status)) {
        return NextResponse.json(
          {
            error: "Google access token expired or invalid.",
            code: GOOGLE_TOKEN_EXPIRED_CODE,
          },
          { status: 401 },
        );
      }

      throw new Error(
        `Google Calendar API error (${response.status}): ${errorBody || response.statusText}`,
      );
    }

    const created = (await response.json()) as GoogleCalendarApiEvent;
    const event = mapGoogleEvent(created);

    if (!event) {
      throw new Error("Created event could not be parsed.");
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Calendar create-event failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create calendar event.",
      },
      { status: 500 },
    );
  }
}
