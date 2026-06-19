"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  type GoogleApiService,
  googleApiServiceLabel,
} from "@/lib/google-cloud-constants";

type GoogleApiSetupPromptProps = {
  service: GoogleApiService;
  onFixSetup: () => void;
};

export default function GoogleApiSetupPrompt({
  service,
  onFixSetup,
}: GoogleApiSetupPromptProps) {
  const label = googleApiServiceLabel(service);

  return (
    <div className="space-y-3 py-4">
      <p className="text-sm text-muted-foreground">
        Google {label} needs a one-time setup in Cloud Console before Relio can
        sync your data.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onFixSetup}>
          Set up Google {label}
        </Button>
        <Link
          href="/settings?section=integrations"
          className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          Open Settings
        </Link>
      </div>
    </div>
  );
}
