"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AuthGuard from "@/components/AuthGuard";
import EventDetailDialog from "@/components/calendar/EventDetailDialog";
import WeekDayGrid from "@/components/calendar/WeekDayGrid";
import { createContactFromAttendee } from "@/lib/calendar-utils";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  type CalendarViewMode,
  filterEventsForDay,
  filterEventsForRange,
  formatEventTimeRange,
  getViewRange,
  loadCalendarEventsForUser,
  matchCalendarEvents,
} from "@/lib/calendar-utils";
import {
  getCompanies,
  getContacts,
  getGoogleIntegration,
  logActivity,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import type { CalendarEvent, Contact, Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { user, connectGoogleContacts } = useAuth();
  const [view, setView] = useState<CalendarViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const viewRange = useMemo(
    () => getViewRange(view, anchorDate),
    [view, anchorDate],
  );

  const days = useMemo(() => {
    if (view === "month") {
      return eachDayOfInterval({ start: viewRange.start, end: viewRange.end });
    }

    if (view === "day") {
      return [anchorDate];
    }

    return eachDayOfInterval({
      start: anchorDate,
      end: addDays(anchorDate, 6),
    });
  }, [view, anchorDate, viewRange]);

  const visibleEvents = useMemo(
    () => filterEventsForRange(events, viewRange.start, viewRange.end),
    [events, viewRange],
  );

  const loadEvents = useCallback(
    async (token: string, userId: string, userContacts: Contact[], userCompanies: Company[]) => {
      const result = await loadCalendarEventsForUser(
        token,
        viewRange.start,
        viewRange.end,
      );

      if (result.needsReconnect) {
        setNeedsReconnect(true);
        return false;
      }

      setNeedsReconnect(false);
      setAccessToken(result.accessToken);

      const matched = await matchCalendarEvents(
        result.events,
        userContacts,
        userCompanies,
      );

      setEvents(matched);
      await updateGoogleCalendarLastSynced(userId);
      setLastSyncedAt(new Date().toISOString());
      return true;
    },
    [viewRange],
  );

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function init() {
      try {
        const [integration, userContacts, userCompanies] = await Promise.all([
          getGoogleIntegration(userId),
          getContacts(userId),
          getCompanies(userId),
        ]);

        setContacts(userContacts);
        setCompanies(userCompanies);

        if (integration?.accessToken) {
          setAccessToken(integration.accessToken);
          setConnectedAt(integration.connectedAt);
          setLastSyncedAt(
            integration.calendarLastSyncedAt ?? integration.lastSyncedAt ?? null,
          );
          await loadEvents(
            integration.accessToken,
            userId,
            userContacts,
            userCompanies,
          );
        }
      } catch (error) {
        console.error("Failed to load calendar:", error);
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [user, loadEvents]);

  async function handleConnect() {
    if (!user) return;

    setConnecting(true);
    try {
      const token = await connectGoogleContacts();
      if (!token) throw new Error("Could not get Google access token.");

      setAccessToken(token);
      const now = new Date().toISOString();
      setConnectedAt(now);

      const userContacts = await getContacts(user.uid);
      const userCompanies = await getCompanies(user.uid);
      setContacts(userContacts);
      setCompanies(userCompanies);

      await loadEvents(token, user.uid, userContacts, userCompanies);
      await logActivity(user.uid, "calendar_connected", "Connected Google Calendar");
    } catch (error) {
      console.error("Failed to connect Google Calendar:", error);
    } finally {
      setConnecting(false);
    }
  }

  async function handleRefresh() {
    if (!user || !accessToken) return;

    setRefreshing(true);
    try {
      await loadEvents(accessToken, user.uid, contacts, companies);
    } catch (error) {
      console.error("Failed to refresh calendar:", error);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAddContact(email: string) {
    if (!user) return;

    const contact = await createContactFromAttendee(user.uid, email);
    const updatedContacts = [...contacts, contact];
    setContacts(updatedContacts);

    const rematched = await matchCalendarEvents(events, updatedContacts, companies);
    setEvents(rematched);

    if (selectedEvent) {
      const updated = rematched.find((item) => item.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  }

  function openEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setDetailOpen(true);
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />

          <SidebarInset className="min-h-screen">
            <div className="mx-auto max-w-7xl px-8 py-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Calendar
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Google Calendar synced with your Relio contacts
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!accessToken ? (
                    <Button onClick={() => void handleConnect()} disabled={connecting}>
                      {connecting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Calendar className="size-4" />
                          Connect Google Calendar
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Connected</p>
                        {lastSyncedAt ? (
                          <p>
                            Last synced{" "}
                            {formatDistanceToNow(new Date(lastSyncedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        ) : connectedAt ? (
                          <p>
                            Connected{" "}
                            {formatDistanceToNow(new Date(connectedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => void handleRefresh()}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                        Refresh
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {(["day", "week", "month"] as CalendarViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={view === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}

                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAnchorDate((current) =>
                        view === "month"
                          ? addDays(current, -28)
                          : view === "week"
                            ? addDays(current, -7)
                            : addDays(current, -1),
                      )
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnchorDate(startOfDay(new Date()))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAnchorDate((current) =>
                        view === "month"
                          ? addDays(current, 28)
                          : view === "week"
                            ? addDays(current, 7)
                            : addDays(current, 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-foreground">
                {format(viewRange.start, "MMM d")} – {format(viewRange.end, "MMM d, yyyy")}
              </p>

              {loading ? (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                  Loading calendar...
                </p>
              ) : !accessToken ? (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                  Connect Google Calendar to view your events.
                </p>
              ) : needsReconnect ? (
                <div className="mt-12 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Your Google Calendar connection expired. Reconnect to load events.
                  </p>
                  <Button onClick={() => void handleConnect()} disabled={connecting}>
                    {connecting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      "Reconnect Google"
                    )}
                  </Button>
                </div>
              ) : view === "month" ? (
                <MonthGrid
                  days={days}
                  events={visibleEvents}
                  onSelectEvent={openEvent}
                />
              ) : (
                <WeekDayGrid
                  days={days}
                  events={visibleEvents}
                  onSelectEvent={openEvent}
                />
              )}
            </div>
          </SidebarInset>
        </div>

        <EventDetailDialog
          event={selectedEvent}
          contacts={contacts}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onAddContact={(email) => void handleAddContact(email)}
        />
      </SidebarProvider>
    </AuthGuard>
  );
}

function MonthGrid({
  days,
  events,
  onSelectEvent,
}: {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayEvents = filterEventsForDay(events, day);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-28 rounded-xl border border-border/60 bg-card p-2 shadow-sm",
              isSameDay(day, new Date()) && "border-primary/40 bg-primary/5",
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {format(day, "d")}
            </p>
            <ul className="mt-1 space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] font-medium text-primary hover:bg-primary/20"
                  >
                    {formatEventTimeRange(event)} · {event.title}
                  </button>
                </li>
              ))}
              {dayEvents.length > 3 ? (
                <li className="text-[10px] text-muted-foreground">
                  +{dayEvents.length - 3} more
                </li>
              ) : null}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
