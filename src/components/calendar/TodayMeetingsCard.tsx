"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar, ExternalLink, Loader2, Video } from "lucide-react";
import GoogleApiSetupPrompt from "@/components/settings/GoogleApiSetupPrompt";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useGoogleApiSetup } from "@/hooks/useGoogleApiSetup";
import {
  filterEventsForDay,
  formatEventTimeRange,
  loadCalendarEventsForUser,
  matchCalendarEvents,
} from "@/lib/calendar-utils";
import { getInitials } from "@/lib/contact-utils";
import {
  getContacts,
  getGoogleIntegration,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import type { CalendarEvent, Contact } from "@/lib/types";

export default function TodayMeetingsCard() {
  const { user, connectGoogleContacts } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [connected, setConnected] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getStoredAccessToken = useCallback(async () => {
    if (accessToken) return accessToken;

    if (!user) return null;

    const integration = await getGoogleIntegration(user.uid);
    const token = integration?.accessToken ?? null;
    setAccessToken(token);
    return token;
  }, [accessToken, user]);

  const loadMeetings = useCallback(
    async (token: string, userId: string, userContacts: Contact[]) => {
      const today = new Date();
      const result = await loadCalendarEventsForUser(
        token,
        startOfDay(today),
        endOfDay(today),
      );

      if (result.needsReconnect) {
        setNeedsReconnect(true);
        return;
      }

      setNeedsReconnect(false);
      setAccessToken(result.accessToken);
      const matched = await matchCalendarEvents(result.events, userContacts);
      setEvents(filterEventsForDay(matched, today));
      await updateGoogleCalendarLastSynced(userId);
    },
    [],
  );

  const {
    apiSetupNeeded,
    setApiSetupNeeded,
    showSetupModal,
    handleGoogleApiError,
    enableApiModal,
  } = useGoogleApiSetup(getStoredAccessToken, {
    onTestSuccess: async () => {
      if (!user) return;

      const token = await getStoredAccessToken();
      if (!token) return;

      const userContacts = await getContacts(user.uid);
      setContacts(userContacts);
      await loadMeetings(token, user.uid, userContacts);
    },
  });

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function load() {
      try {
        const [integration, userContacts] = await Promise.all([
          getGoogleIntegration(userId),
          getContacts(userId),
        ]);

        setContacts(userContacts);

        if (!integration?.accessToken) {
          setConnected(false);
          return;
        }

        setConnected(true);
        setAccessToken(integration.accessToken);
        await loadMeetings(integration.accessToken, userId, userContacts);
        setApiSetupNeeded(false);
      } catch (error) {
        if (!handleGoogleApiError(error, "calendar")) {
          console.error("Failed to load today's meetings:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, loadMeetings, handleGoogleApiError, setApiSetupNeeded]);

  async function handleReconnect() {
    if (!user) return;

    setReconnecting(true);
    const today = new Date();

    try {
      const token = await connectGoogleContacts();
      if (!token) return;

      setConnected(true);
      setNeedsReconnect(false);
      setAccessToken(token);
      setApiSetupNeeded(false);

      const result = await loadCalendarEventsForUser(
        token,
        startOfDay(today),
        endOfDay(today),
      );

      if (result.needsReconnect) {
        setNeedsReconnect(true);
        return;
      }

      const matched = await matchCalendarEvents(result.events, contacts);
      setEvents(filterEventsForDay(matched, today));
      await updateGoogleCalendarLastSynced(user.uid);
    } catch (error) {
      if (!handleGoogleApiError(error, "calendar")) {
        console.error("Failed to reconnect Google Calendar:", error);
      }
    } finally {
      setReconnecting(false);
    }
  }

  function getContactForEmail(email: string): Contact | undefined {
    const normalized = email.trim().toLowerCase();
    return contacts.find(
      (contact) => contact.email?.trim().toLowerCase() === normalized,
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Today&apos;s Meetings
            </h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, MMM d")}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-sm text-muted-foreground">Loading...</p>
        ) : !connected ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Connect Google to see today&apos;s meetings on your dashboard.
            </p>
            <Link
              href="/settings?section=integrations"
              className={buttonVariants({ size: "sm" })}
            >
              Connect in Settings
            </Link>
          </div>
        ) : apiSetupNeeded ? (
          <GoogleApiSetupPrompt
            service="calendar"
            onFixSetup={() => showSetupModal("calendar")}
          />
        ) : needsReconnect ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Your Google token is missing Calendar permission or has expired.
              Reconnect and allow all requested permissions.
            </p>
            <Button
              size="sm"
              onClick={() => void handleReconnect()}
              disabled={reconnecting}
            >
              {reconnecting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                "Reconnect Google"
              )}
            </Button>
          </div>
        ) : events.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No meetings today</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {events.map((event) => {
              const matchedAttendees = (event.attendeeEmails ?? [])
                .map((email) => ({ email, contact: getContactForEmail(email) }))
                .filter((item) => item.contact);

              return (
                <li key={event.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {formatEventTimeRange(event)}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>

                      {matchedAttendees.length > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {matchedAttendees.slice(0, 4).map(({ email, contact }) => (
                            <div key={email} className="flex items-center gap-1.5">
                              <Avatar className="size-6">
                                <AvatarFallback className="bg-muted text-[9px] font-medium text-muted-foreground">
                                  {getInitials(
                                    contact!.firstName,
                                    contact!.lastName,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <Link
                                href={`/contacts?id=${contact!.id}`}
                                className="text-xs text-foreground underline-offset-2 hover:underline"
                              >
                                {contact!.firstName} {contact!.lastName}
                              </Link>
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-[10px]"
                              >
                                Known contact
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {event.meetLink ? (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Open Google Meet"
                      >
                        <Video className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/calendar"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          View calendar
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {enableApiModal}
    </>
  );
}
