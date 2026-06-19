import type { GoogleIntegrationScope } from "@/lib/types";

export const GOOGLE_TOKEN_EXPIRED_CODE = "GOOGLE_TOKEN_EXPIRED";
export const GOOGLE_CALENDAR_SCOPE_MISSING_CODE = "GOOGLE_CALENDAR_SCOPE_MISSING";

export class GoogleTokenExpiredError extends Error {
  readonly code = GOOGLE_TOKEN_EXPIRED_CODE;

  constructor(message = "Google access token expired or invalid.") {
    super(message);
    this.name = "GoogleTokenExpiredError";
  }
}

export class GoogleCalendarScopeMissingError extends Error {
  readonly code = GOOGLE_CALENDAR_SCOPE_MISSING_CODE;

  constructor(
    message = "Google Calendar permission was not granted for this token.",
  ) {
    super(message);
    this.name = "GoogleCalendarScopeMissingError";
  }
}

export function isGoogleTokenExpiredError(error: unknown): boolean {
  return (
    error instanceof GoogleTokenExpiredError ||
    (error instanceof Error && error.message.includes(GOOGLE_TOKEN_EXPIRED_CODE))
  );
}

export function isGoogleCalendarAuthError(error: unknown): boolean {
  return (
    isGoogleTokenExpiredError(error) ||
    error instanceof GoogleCalendarScopeMissingError ||
    (error instanceof Error &&
      error.message.includes(GOOGLE_CALENDAR_SCOPE_MISSING_CODE))
  );
}

export function googleApiAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export type GoogleTokenInfo = {
  valid: boolean;
  scopes: string[];
  expiresIn?: number;
};

export async function getGoogleTokenInfo(
  accessToken: string,
): Promise<GoogleTokenInfo> {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return { valid: false, scopes: [] };
  }

  const data = (await response.json()) as {
    scope?: string;
    expires_in?: number;
  };

  return {
    valid: true,
    scopes: data.scope?.split(" ") ?? [],
    expiresIn: data.expires_in,
  };
}

const CALENDAR_SCOPE_PREFIXES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function tokenHasCalendarScope(scopes: string[]): boolean {
  return scopes.some((scope) =>
    CALENDAR_SCOPE_PREFIXES.some(
      (prefix) => scope === prefix || scope.startsWith(`${prefix}.`),
    ),
  );
}

export function integrationScopesFromGoogleScopes(
  scopes: string[],
): GoogleIntegrationScope[] {
  const granted: GoogleIntegrationScope[] = [];

  if (scopes.some((scope) => scope.includes("contacts"))) {
    granted.push("contacts");
  }

  if (tokenHasCalendarScope(scopes)) {
    granted.push("calendar");
  }

  return granted;
}
