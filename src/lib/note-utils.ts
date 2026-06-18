import type { Note, NoteMood, NoteType } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CircleDot,
  Flag,
  Lightbulb,
  Scale,
} from "lucide-react";

export const NOTE_TYPES: NoteType[] = [
  "idea",
  "article",
  "meeting",
  "decision",
  "goal",
  "random",
];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  idea: "Idea",
  article: "Article",
  meeting: "Meeting",
  decision: "Decision",
  goal: "Goal",
  random: "Random",
};

export const NOTE_TYPE_ICONS: Record<NoteType, LucideIcon> = {
  idea: Lightbulb,
  article: BookOpen,
  meeting: Calendar,
  decision: Scale,
  goal: Flag,
  random: CircleDot,
};

export const NOTE_TYPE_STYLES: Record<
  NoteType,
  { badge: string; border: string; card: string }
> = {
  idea: {
    badge: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
    border: "border-violet-500/30",
    card: "bg-violet-500/[0.07] dark:bg-violet-500/[0.12]",
  },
  article: {
    badge: "bg-blue-500/15 text-blue-800 dark:text-blue-300",
    border: "border-blue-500/30",
    card: "bg-blue-500/[0.07] dark:bg-blue-500/[0.12]",
  },
  meeting: {
    badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-500/30",
    card: "bg-emerald-500/[0.07] dark:bg-emerald-500/[0.12]",
  },
  decision: {
    badge: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
    border: "border-orange-500/30",
    card: "bg-orange-500/[0.07] dark:bg-orange-500/[0.12]",
  },
  goal: {
    badge: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
    border: "border-amber-500/30",
    card: "bg-amber-500/[0.07] dark:bg-amber-500/[0.12]",
  },
  random: {
    badge: "bg-muted text-muted-foreground",
    border: "border-border/70",
    card: "bg-muted/40 dark:bg-muted/25",
  },
};

export const NOTE_MOODS: {
  value: NoteMood;
  emoji: string;
  label: string;
}[] = [
  { value: "excited", emoji: "🔥", label: "Excited" },
  { value: "inspired", emoji: "💡", label: "Inspired" },
  { value: "unsure", emoji: "🤔", label: "Unsure" },
  { value: "urgent", emoji: "⚡", label: "Urgent" },
  { value: "calm", emoji: "😌", label: "Calm" },
];

export const NOTE_MOOD_EMOJI: Record<NoteMood, string> = {
  excited: "🔥",
  inspired: "💡",
  unsure: "🤔",
  urgent: "⚡",
  calm: "😌",
};

export type NoteFilter = "all" | NoteType;

export function filterNotes(
  notes: Note[],
  {
    search,
    typeFilter,
  }: {
    search: string;
    typeFilter: NoteFilter;
  },
): Note[] {
  const query = search.trim().toLowerCase();

  return notes.filter((note) => {
    if (typeFilter !== "all" && note.type !== typeFilter) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      note.title,
      note.body,
      note.url,
      note.urlTitle,
      ...(note.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const aPinned = Number(Boolean(a.isPinned));
    const bPinned = Number(Boolean(b.isPinned));
    if (aPinned !== bPinned) return bPinned - aPinned;

    return (b.updatedAt ?? b.createdAt ?? "").localeCompare(
      a.updatedAt ?? a.createdAt ?? "",
    );
  });
}

export function getUrlDomain(url?: string): string {
  if (!url) return "";

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function getFaviconUrl(url?: string): string {
  const domain = getUrlDomain(url);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export type NoteFormValues = {
  title: string;
  body: string;
  bodyHtml: string;
  mood?: NoteMood;
  type: NoteType;
  tags: string[];
  url: string;
  urlTitle: string;
  urlDescription: string;
  urlImage: string;
  isPinned: boolean;
};

export const emptyNoteForm = (): NoteFormValues => ({
  title: "",
  body: "",
  bodyHtml: "",
  mood: undefined,
  type: "idea",
  tags: [],
  url: "",
  urlTitle: "",
  urlDescription: "",
  urlImage: "",
  isPinned: false,
});

export function stripHtml(html: string): string {
  if (!html) return "";

  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function noteBodyToHtml(note: Note): string {
  if (note.bodyHtml) return note.bodyHtml;
  if (!note.body) return "";

  return note.body
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export function noteToFormValues(note: Note): NoteFormValues {
  const bodyHtml = noteBodyToHtml(note);

  return {
    title: note.title,
    body: note.body || stripHtml(bodyHtml),
    bodyHtml,
    mood: note.mood,
    type: note.type,
    tags: note.tags ?? [],
    url: note.url ?? "",
    urlTitle: note.urlTitle ?? "",
    urlDescription: note.urlDescription ?? "",
    urlImage: note.urlImage ?? "",
    isPinned: note.isPinned ?? false,
  };
}

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
