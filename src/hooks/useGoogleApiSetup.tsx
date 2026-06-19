"use client";

import { useCallback, useState } from "react";
import EnableApiModal from "@/components/settings/EnableApiModal";
import {
  GOOGLE_CALENDAR_API_ENABLE_URL,
  type GoogleApiService,
  googleApiEnableUrl,
  googleApiServiceTitle,
} from "@/lib/google-cloud-constants";
import {
  GOOGLE_API_DISABLED_CODE,
  GoogleApiDisabledError,
} from "@/lib/google-api-errors";
import { testGoogleConnection } from "@/lib/google-test-connection";

export function toGoogleApiDisabledError(
  error: unknown,
  defaultService: GoogleApiService = "calendar",
): GoogleApiDisabledError | null {
  if (error instanceof GoogleApiDisabledError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === GOOGLE_API_DISABLED_CODE
  ) {
    const payload = error as {
      service?: GoogleApiService;
      enableUrl?: string;
      activationUrl?: string;
      serviceTitle?: string;
      message?: string;
    };

    return new GoogleApiDisabledError(
      payload.service ?? defaultService,
      payload.enableUrl ??
        payload.activationUrl ??
        googleApiEnableUrl(defaultService),
      payload.serviceTitle ?? googleApiServiceTitle(defaultService),
      payload.message,
    );
  }

  return null;
}

export function useGoogleApiSetup(
  getAccessToken: () => Promise<string | null>,
  options?: { onTestSuccess?: () => void | Promise<void> },
) {
  const [enableApiModalOpen, setEnableApiModalOpen] = useState(false);
  const [enableApiService, setEnableApiService] =
    useState<GoogleApiService>("calendar");
  const [enableApiUrl, setEnableApiUrl] = useState(
    GOOGLE_CALENDAR_API_ENABLE_URL,
  );
  const [apiSetupNeeded, setApiSetupNeeded] = useState(false);

  const showSetupModal = useCallback((service: GoogleApiService) => {
    setEnableApiService(service);
    setEnableApiUrl(googleApiEnableUrl(service));
    setEnableApiModalOpen(true);
    setApiSetupNeeded(true);
  }, []);

  const openEnableApiModal = useCallback((error: GoogleApiDisabledError) => {
    setEnableApiService(error.service);
    setEnableApiUrl(error.enableUrl);
    setEnableApiModalOpen(true);
    setApiSetupNeeded(true);
  }, []);

  const handleGoogleApiError = useCallback(
    (error: unknown, defaultService: GoogleApiService = "calendar"): boolean => {
      const disabled = toGoogleApiDisabledError(error, defaultService);

      if (disabled) {
        openEnableApiModal(disabled);
        return true;
      }

      return false;
    },
    [openEnableApiModal],
  );

  const runGoogleConnectionTest = useCallback(
    async (service: GoogleApiService): Promise<boolean> => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Connect Google in Settings first.");
      }

      const result = await testGoogleConnection(service, accessToken);

      if (result.success) {
        setApiSetupNeeded(false);
        await options?.onTestSuccess?.();
        return true;
      }

      if (result.errorType === "service_disabled") {
        setEnableApiService(service);
        setEnableApiUrl(result.enableUrl);
        setEnableApiModalOpen(true);
        setApiSetupNeeded(true);
        return false;
      }

      throw new Error(result.message);
    },
    [getAccessToken, options],
  );

  const enableApiModal = (
    <EnableApiModal
      open={enableApiModalOpen}
      onOpenChange={setEnableApiModalOpen}
      service={enableApiService}
      enableUrl={enableApiUrl}
      onTestAgain={() => runGoogleConnectionTest(enableApiService)}
    />
  );

  return {
    apiSetupNeeded,
    setApiSetupNeeded,
    showSetupModal,
    openEnableApiModal,
    handleGoogleApiError,
    runGoogleConnectionTest,
    enableApiModal,
  };
}
