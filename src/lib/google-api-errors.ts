export const GOOGLE_API_DISABLED_CODE = "GOOGLE_API_DISABLED";

export type GoogleApiDisabledInfo = {
  serviceTitle: string;
  activationUrl: string;
  message: string;
};

export function parseGoogleApiDisabledError(
  errorBody: string,
): GoogleApiDisabledInfo | null {
  try {
    const parsed = JSON.parse(errorBody) as {
      error?: {
        message?: string;
        details?: Array<{
          reason?: string;
          metadata?: {
            activationUrl?: string;
            serviceTitle?: string;
          };
        }>;
      };
    };

    const disabledDetail = parsed.error?.details?.find(
      (detail) => detail.reason === "SERVICE_DISABLED",
    );

    const activationUrl = disabledDetail?.metadata?.activationUrl;
    const serviceTitle =
      disabledDetail?.metadata?.serviceTitle ?? "Google API";

    if (activationUrl) {
      return {
        serviceTitle,
        activationUrl,
        message:
          parsed.error?.message ??
          `${serviceTitle} is not enabled for this Google Cloud project.`,
      };
    }
  } catch {
    // Not JSON — fall through.
  }

  return null;
}

export function formatGoogleApiErrorMessage(
  status: number,
  errorBody: string,
  apiLabel: string,
): string {
  const disabled = parseGoogleApiDisabledError(errorBody);

  if (disabled) {
    return `Enable ${disabled.serviceTitle} in Google Cloud Console, then try again: ${disabled.activationUrl}`;
  }

  return `${apiLabel} error (${status}): ${errorBody || "Request failed"}`;
}
