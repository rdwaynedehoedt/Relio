import { NextResponse } from "next/server";
import {
  mapGoogleEvent,
  type GoogleCalendarApiEvent,
} from "@/lib/calendar-utils";
import {
  GOOGLE_CALENDAR_SCOPE_MISSING_CODE,
  GOOGLE_TOKEN_EXPIRED_CODE,
  getGoogleTokenInfo,
  googleApiAuthStatus,
  tokenHasCalendarScope,
} from "@/lib/google-token";
import {
  GOOGLE_API_DISABLED_CODE,
  parseGoogleApiDisabledError,
} from "@/lib/google-api-errors";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("accessToken");
  return queryToken?.trim() || null;
}

export async function GET(request: Request) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google access token is required." },
        { status: 400 },
      );
    }

    const tokenInfo = await getGoogleTokenInfo(accessToken);

    if (!tokenInfo.valid) {
      return NextResponse.json(
        {
          error: "Google access token expired or invalid.",
          code: GOOGLE_TOKEN_EXPIRED_CODE,
        },
        { status: 401 },
      );
    }

    if (!tokenHasCalendarScope(tokenInfo.scopes)) {
      return NextResponse.json(
        {
          error:
            "Google Calendar permission was not granted. Reconnect Google and allow Calendar access.",
          code: GOOGLE_CALENDAR_SCOPE_MISSING_CODE,
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const timeMin =
      url.searchParams.get("timeMin") ?? new Date().toISOString();
    const timeMax =
      url.searchParams.get("timeMax") ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const calendarUrl = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );
    calendarUrl.searchParams.set("timeMin", timeMin);
    calendarUrl.searchParams.set("timeMax", timeMax);
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");
    calendarUrl.searchParams.set("maxResults", "250");

    const response = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const disabled = parseGoogleApiDisabledError(errorBody);

      if (disabled) {
        return NextResponse.json(
          {
            error: `Enable ${disabled.serviceTitle} in Google Cloud Console, then try again.`,
            code: GOOGLE_API_DISABLED_CODE,
            activationUrl: disabled.activationUrl,
            serviceTitle: disabled.serviceTitle,
          },
          { status: 403 },
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          {
            error:
              "Google Calendar API access denied. Enable the Calendar API in Google Cloud Console for your Firebase project.",
            code: GOOGLE_CALENDAR_SCOPE_MISSING_CODE,
          },
          { status: 403 },
        );
      }

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

    const data = (await response.json()) as { items?: GoogleCalendarApiEvent[] };
    const events = (data.items ?? [])
      .map(mapGoogleEvent)
      .filter((event): event is NonNullable<typeof event> => event !== null);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar events fetch failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch calendar events.",
      },
      { status: 500 },
    );
  }
}
