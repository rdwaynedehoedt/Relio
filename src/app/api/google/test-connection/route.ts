import { NextResponse } from "next/server";
import {
  type GoogleApiService,
  googleApiEnableUrl,
  googleApiServiceTitle,
} from "@/lib/google-cloud-constants";
import { parseGoogleApiDisabledError } from "@/lib/google-api-errors";

type TestConnectionBody = {
  service?: GoogleApiService;
  accessToken?: string;
};

async function testPeopleApi(accessToken: string): Promise<Response> {
  const url = new URL(
    "https://people.googleapis.com/v1/people/me/connections",
  );
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("personFields", "names");

  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

async function testCalendarApi(accessToken: string): Promise<Response> {
  const now = new Date();
  const timeMax = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");

  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestConnectionBody;
    const service = body.service;
    const accessToken = body.accessToken?.trim();

    if (service !== "contacts" && service !== "calendar") {
      return NextResponse.json(
        {
          success: false,
          errorType: "other",
          message: "Invalid service. Use contacts or calendar.",
        },
        { status: 400 },
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          errorType: "other",
          message: "Google access token is required.",
        },
        { status: 400 },
      );
    }

    const response =
      service === "contacts"
        ? await testPeopleApi(accessToken)
        : await testCalendarApi(accessToken);

    if (response.ok) {
      return NextResponse.json({ success: true });
    }

    const errorBody = await response.text();
    const disabled = parseGoogleApiDisabledError(errorBody);

    if (disabled) {
      return NextResponse.json({
        success: false,
        errorType: "service_disabled",
        enableUrl: disabled.activationUrl || googleApiEnableUrl(service),
        serviceTitle: disabled.serviceTitle || googleApiServiceTitle(service),
      });
    }

    let message = "Could not reach Google. Try reconnecting your account.";

    if (response.status === 401) {
      message = "Google session expired. Reconnect your account and try again.";
    } else if (response.status === 403) {
      message =
        "Google denied access. Reconnect and allow Contacts and Calendar permissions.";
    }

    return NextResponse.json({
      success: false,
      errorType: "other",
      message,
    });
  } catch (error) {
    console.error("Google test connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        errorType: "other",
        message:
          error instanceof Error
            ? error.message
            : "Could not test Google connection.",
      },
      { status: 500 },
    );
  }
}
