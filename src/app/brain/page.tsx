"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Brain,
  Calendar,
  CircleDot,
  Flag,
  Lightbulb,
  Pencil,
  Pin,
  Plus,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import NoteDrawer from "@/components/NoteDrawer";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  filterNotes,
  getFaviconUrl,
  getUrlDomain,
  NOTE_TYPE_ICONS,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_STYLES,
  type NoteFilter,
  type NoteFormValues,
  sortNotes,
} from "@/lib/note-utils";
import { addNote, deleteNote, getNotes, updateNote } from "@/lib/firestore";
import type { Note, NoteType } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: { value: NoteFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "idea", label: "Ideas" },
  { value: "article", label: "Articles" },
  { value: "meeting", label: "Meetings" },
  { value: "decision", label: "Decisions" },
  { value: "goal", label: "Goals" },
  { value: "random", label: "Random" },
];

const EMPTY_STATE_ICONS: Record<NoteType, typeof Lightbulb> = {
  idea: Lightbulb,
  article: BookOpen,
  meeting: Calendar,
  decision: Scale,
  goal: Flag,
  random: CircleDot,
};

export default function BrainPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<NoteFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const reloadNotes = useCallback(async () => {
    if (!user) return;
    const data = await getNotes(user.uid);
    setNotes(data);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        await reloadNotes();
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, reloadNotes]);

  const filteredNotes = useMemo(
    () =>
      sortNotes(
        filterNotes(notes, {
          search,
          typeFilter,
        }),
      ),
    [notes, search, typeFilter],
  );

  function openAddDrawer() {
    setDrawerMode("add");
    setSelectedNote(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(note: Note) {
    setDrawerMode("edit");
    setSelectedNote(note);
    setDrawerOpen(true);
  }

  async function handleSave(values: NoteFormValues) {
    if (!user) return;

    const hasUrl = Boolean(values.url.trim());
    const payload = {
      title: values.title,
      body: values.body,
      type: values.type,
      tags: values.tags,
      isPinned: values.isPinned,
      userId: user.uid,
      ...(hasUrl
        ? {
            url: values.url.trim(),
            ...(values.urlTitle.trim() && { urlTitle: values.urlTitle.trim() }),
            ...(values.urlDescription.trim() && {
              urlDescription: values.urlDescription.trim(),
            }),
            ...(values.urlImage.trim() && { urlImage: values.urlImage.trim() }),
          }
        : {}),
    };

    if (drawerMode === "edit" && selectedNote?.id) {
      await updateNote(selectedNote.id, payload, { clearUrlFields: !hasUrl });
      setNotes((current) =>
        sortNotes(
          current.map((note) =>
            note.id === selectedNote.id
              ? {
                  ...note,
                  ...payload,
                  updatedAt: new Date().toISOString(),
                }
              : note,
          ),
        ),
      );
      return;
    }

    const saved = await addNote(payload);
    setNotes((current) => sortNotes([saved, ...current]));
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    setNotes((current) => current.filter((note) => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  const showGlobalEmpty = !loading && notes.length === 0;
  const showFilterEmpty =
    !loading && notes.length > 0 && filteredNotes.length === 0;

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />

          <SidebarInset className="min-h-screen">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Second Brain
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ideas, articles, meetings, and decisions in one place
                  </p>
                </div>
                <Button onClick={openAddDrawer}>
                  <Plus className="size-4" />
                  New Note
                </Button>
              </div>

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notes..."
                    className="h-10 border-border/60 bg-muted/30 pl-9"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTypeFilter(option.value)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        typeFilter === option.value
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="mt-12 flex items-center justify-center py-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
                </div>
              ) : showGlobalEmpty ? (
                <div className="mt-16 flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <Brain className="size-7 text-muted-foreground" />
                  </div>
                  <h2 className="mt-6 text-lg font-semibold text-foreground">
                    Your second brain is empty
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Capture ideas, save articles, log meetings
                  </p>
                  <Button className="mt-6" onClick={openAddDrawer}>
                    Add your first note
                  </Button>
                </div>
              ) : showFilterEmpty ? (
                <div className="mt-16 flex flex-col items-center justify-center px-6 py-20 text-center">
                  {typeFilter !== "all" ? (
                    <>
                      {(() => {
                        const Icon = EMPTY_STATE_ICONS[typeFilter];
                        return (
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                            <Icon className="size-6 text-muted-foreground" />
                          </div>
                        );
                      })()}
                      <h2 className="mt-5 text-base font-semibold text-foreground">
                        No {NOTE_TYPE_LABELS[typeFilter].toLowerCase()} notes yet
                      </h2>
                    </>
                  ) : (
                    <>
                      <Search className="size-8 text-muted-foreground" />
                      <h2 className="mt-5 text-base font-semibold text-foreground">
                        No notes match your search
                      </h2>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isHovered={hoveredId === note.id}
                      onHover={setHoveredId}
                      onOpen={() => openEditDrawer(note)}
                      onDelete={() => note.id && void handleDelete(note.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarInset>
        </div>

        <NoteDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mode={drawerMode}
          note={selectedNote}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </SidebarProvider>
    </AuthGuard>
  );
}

function NoteCard({
  note,
  isHovered,
  onHover,
  onOpen,
  onDelete,
}: {
  note: Note;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = NOTE_TYPE_ICONS[note.type];
  const styles = NOTE_TYPE_STYLES[note.type];
  const domain = getUrlDomain(note.url);

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        styles.border,
        note.isPinned && "ring-1 ring-amber-500/20",
      )}
      onMouseEnter={() => onHover(note.id ?? null)}
      onMouseLeave={() => onHover(null)}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            styles.badge,
          )}
        >
          <TypeIcon className="size-3" />
          {NOTE_TYPE_LABELS[note.type]}
        </span>

        {note.isPinned ? (
          <Pin className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-medium text-foreground">
        {note.title || "Untitled note"}
      </h3>

      {note.body ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {note.body}
        </p>
      ) : null}

      {note.type === "article" && note.url ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/50 bg-muted/20">
          {note.urlImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={note.urlImage}
              alt=""
              className="h-28 w-full object-cover"
            />
          ) : null}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFaviconUrl(note.url)}
              alt=""
              className="size-4 shrink-0 rounded-sm"
            />
            <span className="truncate text-xs text-muted-foreground">
              {domain}
            </span>
          </div>
        </div>
      ) : null}

      {note.tags && note.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-[11px] text-muted-foreground/80">
          {note.createdAt
            ? format(parseISO(note.createdAt), "MMM d, yyyy")
            : "Recently"}
        </span>
      </div>

      <div
        className={cn(
          "absolute top-4 right-4 flex items-center gap-1 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onOpen}
          className="flex size-8 items-center justify-center rounded-lg bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Edit note"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex size-8 items-center justify-center rounded-lg bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-destructive"
          aria-label="Delete note"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  );
}
