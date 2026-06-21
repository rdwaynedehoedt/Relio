export const GOOGLE_CLOUD_PROJECT_NUMBER = "828122186689";

export type GoogleApiService = "contacts" | "calendar";

export const GOOGLE_PEOPLE_API_ENABLE_URL =
  `https://console.cloud.google.com/apis/api/people.googleapis.com`;

export const GOOGLE_CALENDAR_API_ENABLE_URL =
  `https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${GOOGLE_CLOUD_PROJECT_NUMBER}`;

export function googleApiEnableUrl(service: GoogleApiService): string {
  return service === "contacts"
    ? GOOGLE_PEOPLE_API_ENABLE_URL
    : GOOGLE_CALENDAR_API_ENABLE_URL;
}

export function googleApiServiceLabel(service: GoogleApiService): string {
  return service === "contacts" ? "Contacts" : "Calendar";
}

export function googleApiServiceTitle(service: GoogleApiService): string {
  return service === "contacts" ? "People API" : "Google Calendar API";
}
