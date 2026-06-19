"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PanelSectionLabel } from "@/components/crm-panel";
import GoogleApiSetupPrompt from "@/components/settings/GoogleApiSetupPrompt";
import { useGoogleApiSetup } from "@/hooks/useGoogleApiSetup";
import {
  formatEventDate,
  formatEventTimeRange,
  getEventsForCompany,
  loadCalendarEventsForUser,
  matchCalendarEvents,
} from "@/lib/calendar-utils";
import {
  getCompanies,
  getContacts,
  getGoogleIntegration,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import type { CalendarEvent, Company } from "@/lib/types";

interface CompanyMeetingsProps {
  company: Company;
}

export default function CompanyMeetings({ company }: CompanyMeetingsProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getStoredAccessToken = useCallback(async () => accessToken, [accessToken]);

  const {
    apiSetupNeeded,
    showSetupModal,
    handleGoogleApiError,
    enableApiModal,
  } = useGoogleApiSetup(getStoredAccessToken);

  useEffect(() => {
    if (!company.userId || !company.id) {
      setLoading(false);
      return;
    }

    const userId = company.userId;
    const companyId = company.id;

    async function load() {
      try {
        const integration = await getGoogleIntegration(userId);
        if (!integration?.accessToken) return;

        setConnected(true);
        setAccessToken(integration.accessToken);

        const [contacts, companies] = await Promise.all([
          getContacts(userId),
          getCompanies(userId),
        ]);

        const now = new Date();
        const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        const rawEvents = await loadCalendarEventsForUser(
          integration.accessToken,
          timeMin,
          timeMax,
        );

        if (rawEvents.needsReconnect) {
          setNeedsReconnect(true);
          return;
        }

        const matched = await matchCalendarEvents(
          rawEvents.events,
          contacts,
          companies,
        );
        const companyEvents = getEventsForCompany(matched, companyId).slice(0, 10);
        setEvents(companyEvents);
        await updateGoogleCalendarLastSynced(userId);
      } catch (error) {
        if (!handleGoogleApiError(error, "calendar")) {
          console.error("Failed to load company meetings:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [company, handleGoogleApiError]);

  return (
    <>
      <PanelSectionLabel>Recent Meetings</PanelSectionLabel>

      {loading ? (
        <p className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading meetings...
        </p>
      ) : !connected ? (
        <p className="px-2 py-2 text-[13px] text-muted-foreground/70">
          <Link
            href="/settings?section=integrations"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Connect Google
          </Link>{" "}
          in Settings to see meetings.
        </p>
      ) : apiSetupNeeded ? (
        <div className="px-2 py-1">
          <GoogleApiSetupPrompt
            service="calendar"
            onFixSetup={() => showSetupModal("calendar")}
          />
        </div>
      ) : needsReconnect ? (
        <p className="px-2 py-2 text-[13px] text-muted-foreground/70">
          Google Calendar connection expired.{" "}
          <Link
            href="/settings?section=integrations"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Reconnect in Settings
          </Link>
          .
        </p>
      ) : events.length === 0 ? (
        <p className="px-2 py-2 text-[13px] text-muted-foreground/70">
          No meetings linked to this company yet.
        </p>
      ) : (
        <ul className="space-y-2 px-2 pb-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-md bg-muted/30 px-3 py-2">
              <p className="text-[13px] font-medium text-foreground">
                {event.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatEventDate(event)} · {formatEventTimeRange(event)}
              </p>
              {event.attendeeEmails?.length ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {event.attendeeEmails.length} attendee
                  {event.attendeeEmails.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {enableApiModal}
    </>
  );
}
