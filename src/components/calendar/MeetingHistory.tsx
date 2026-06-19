"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScheduleMeetingForm from "@/components/calendar/ScheduleMeetingForm";
import { PanelSectionLabel } from "@/components/crm-panel";
import GoogleApiSetupPrompt from "@/components/settings/GoogleApiSetupPrompt";
import { useGoogleApiSetup } from "@/hooks/useGoogleApiSetup";
import {
  fetchCalendarEvents,
  formatEventDate,
  formatEventTimeRange,
  getEventsForContact,
  groupEventsByMonth,
  isPastEvent,
  loadCalendarEventsForUser,
  matchCalendarEvents,
} from "@/lib/calendar-utils";
import {
  getGoogleIntegration,
  logActivity,
  updateContact,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import type { CalendarEvent, Contact } from "@/lib/types";

interface MeetingHistoryProps {
  contact: Contact;
  contacts: Contact[];
  onContactUpdated: (id: string, data: Partial<Contact>) => Promise<void>;
}

export default function MeetingHistory({
  contact,
  contacts,
  onContactUpdated,
}: MeetingHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  const getStoredAccessToken = useCallback(async () => accessToken, [accessToken]);

  const {
    apiSetupNeeded,
    showSetupModal,
    handleGoogleApiError,
    enableApiModal,
  } = useGoogleApiSetup(getStoredAccessToken);

  useEffect(() => {
    if (!contact.userId || !contact.email) {
      setLoading(false);
      return;
    }

    const userId = contact.userId;

    async function load() {
      try {
        const integration = await getGoogleIntegration(userId);
        if (!integration?.accessToken) return;

        setAccessToken(integration.accessToken);

        const now = new Date();
        const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        const result = await loadCalendarEventsForUser(
          integration.accessToken,
          timeMin,
          timeMax,
        );

        if (result.needsReconnect) {
          setNeedsReconnect(true);
          return;
        }

        setNeedsReconnect(false);
        setAccessToken(result.accessToken);

        const matched = await matchCalendarEvents(result.events, contacts);
        const contactEvents = getEventsForContact(matched, contact.email);
        setEvents(contactEvents);

        const pastEvents = contactEvents.filter(isPastEvent);
        const latestPast = pastEvents[pastEvents.length - 1];

        if (
          latestPast &&
          contact.id &&
          (!contact.lastInteractionDate ||
            latestPast.endTime > contact.lastInteractionDate)
        ) {
          await updateContact(contact.id, {
            lastInteractionDate: latestPast.endTime,
          });
          await onContactUpdated(contact.id, {
            lastInteractionDate: latestPast.endTime,
          });
        }

        await updateGoogleCalendarLastSynced(userId);
      } catch (error) {
        if (!handleGoogleApiError(error, "calendar")) {
          console.error("Failed to load meeting history:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [contact, contacts, onContactUpdated, handleGoogleApiError]);

  const upcoming = events.filter((event) => !isPastEvent(event));
  const past = events.filter(isPastEvent);
  const pastByMonth = groupEventsByMonth(past);

  async function handleScheduled() {
    setShowScheduleForm(false);

    if (!accessToken || !contact.email) return;

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const rawEvents = await fetchCalendarEvents(accessToken, timeMin, timeMax);
      const matched = await matchCalendarEvents(rawEvents, contacts);
      setEvents(getEventsForContact(matched, contact.email));

      await logActivity(
        contact.userId,
        "meeting_scheduled",
        `Scheduled meeting with ${contact.firstName} ${contact.lastName}`,
      );
    } catch (error) {
      if (!handleGoogleApiError(error, "calendar")) {
        console.error("Failed to refresh meeting history:", error);
      }
    }
  }

  return (
    <>
      <PanelSectionLabel>Meeting History</PanelSectionLabel>

      {loading ? (
        <p className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading meetings...
        </p>
      ) : !accessToken ? (
        <p className="px-2 py-2 text-[13px] text-muted-foreground/70">
          <Link
            href="/settings?section=integrations"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Connect Google
          </Link>{" "}
          in Settings to see meeting history.
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
      ) : (
        <div className="space-y-4 px-2 pb-2">
          {upcoming.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Upcoming
              </p>
              <ul className="space-y-2">
                {upcoming.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                  >
                    <p className="text-[13px] font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event)} · {formatEventTimeRange(event)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {past.length > 0 ? (
            <div className="space-y-3">
              {[...pastByMonth.entries()].map(([month, monthEvents]) => (
                <div key={month}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {month}
                  </p>
                  <ul className="space-y-1.5">
                    {monthEvents.map((event) => (
                      <li key={event.id} className="text-[13px]">
                        <span className="font-medium text-foreground">
                          {event.title}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {format(parseISO(event.startTime), "MMM d")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/70">
              No meetings found with this contact.
            </p>
          ) : null}

          {showScheduleForm && accessToken ? (
            <ScheduleMeetingForm
              accessToken={accessToken}
              contactEmail={contact.email}
              onScheduled={() => void handleScheduled()}
              onCancel={() => setShowScheduleForm(false)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={!accessToken}
              onClick={() => setShowScheduleForm(true)}
            >
              <CalendarPlus className="size-3.5" />
              Schedule a meeting
            </Button>
          )}
        </div>
      )}

      {enableApiModal}
    </>
  );
}
