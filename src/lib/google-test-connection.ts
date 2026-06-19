import type { GoogleApiService } from "@/lib/google-cloud-constants";

export type GoogleTestConnectionResult =
  | { success: true }
  | {
      success: false;
      errorType: "service_disabled";
      enableUrl: string;
      serviceTitle?: string;
    }
  | { success: false; errorType: "other"; message: string };

export async function testGoogleConnection(
  service: GoogleApiService,
  accessToken: string,
): Promise<GoogleTestConnectionResult> {
  const response = await fetch("/api/google/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, accessToken: accessToken.trim() }),
  });

  return (await response.json()) as GoogleTestConnectionResult;
}
