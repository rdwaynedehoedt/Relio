import type { Note, NoteType } from "@/lib/types";
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
  { badge: string; border: string }
> = {
  idea: {
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    border: "border-violet-500/20",
  },
  article: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20",
  },
  meeting: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  decision: {
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    border: "border-orange-500/20",
  },
  goal: {
    badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  random: {
    badge: "bg-muted text-muted-foreground",
    border: "border-border/60",
  },
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
  type: "idea",
  tags: [],
  url: "",
  urlTitle: "",
  urlDescription: "",
  urlImage: "",
  isPinned: false,
});

export function noteToFormValues(note: Note): NoteFormValues {
  return {
    title: note.title,
    body: note.body,
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
