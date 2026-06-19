"use client";

import Link from "next/link";
import { ExternalLink, Plus, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatEventTimeRange } from "@/lib/calendar-utils";
import { getInitials } from "@/lib/contact-utils";
import type { CalendarEvent, Contact } from "@/lib/types";

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  contacts: Contact[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContact: (email: string) => void;
}

export default function EventDetailDialog({
  event,
  contacts,
  open,
  onOpenChange,
  onAddContact,
}: EventDetailDialogProps) {
  if (!event) return null;

  function getContactForEmail(email: string): Contact | undefined {
    const normalized = email.trim().toLowerCase();
    return contacts.find(
      (contact) => contact.email?.trim().toLowerCase() === normalized,
    );
  }

  const googleCalendarUrl = `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(
    btoa(`${event.googleEventId} ${event.googleEventId}`),
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </p>
            <p className="mt-1 text-foreground">{formatEventTimeRange(event)}</p>
          </div>

          {event.location ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="mt-1 text-foreground">{event.location}</p>
            </div>
          ) : null}

          {event.description ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {event.description}
              </p>
            </div>
          ) : null}

          {event.attendeeEmails?.length ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attendees
              </p>
              <ul className="mt-2 space-y-2">
                {event.attendeeEmails.map((email) => {
                  const contact = getContactForEmail(email);

                  if (contact) {
                    return (
                      <li key={email} className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                            {getInitials(contact.firstName, contact.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/contacts?id=${contact.id}`}
                          className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <span className="text-xs text-muted-foreground">{email}</span>
                      </li>
                    );
                  }

                  return (
                    <li key={email} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{email}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onAddContact(email)}
                      >
                        <Plus className="size-3" />
                        Add to Relio
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {event.meetLink ? (
              <a
                href={event.meetLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
              >
                <Video className="size-3.5" />
                Google Meet
              </a>
            ) : null}

            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              Edit in Google Calendar
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
