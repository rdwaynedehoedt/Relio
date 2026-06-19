"use client";

import { useState } from "react";
import { addMinutes, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCalendarEvent } from "@/lib/calendar-utils";

interface ScheduleMeetingFormProps {
  accessToken: string;
  contactEmail: string;
  onScheduled: () => void;
  onCancel: () => void;
}

export default function ScheduleMeetingForm({
  accessToken,
  contactEmail,
  onScheduled,
  onCancel,
}: ScheduleMeetingFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const start = new Date(`${date}T${time}`);
      const end = addMinutes(start, duration);

      await createCalendarEvent(accessToken, {
        title: title.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendeeEmail: contactEmail,
      });

      onScheduled();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not schedule meeting.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-2 py-2">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title"
          className="h-9"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Duration (minutes)</label>
        <Input
          type="number"
          min={15}
          step={15}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="h-9"
          required
        />
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Scheduling...
            </>
          ) : (
            "Schedule meeting"
          )}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
