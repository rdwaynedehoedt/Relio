"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PanelSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pt-5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase first:pt-2">
      {children}
    </p>
  );
}

export function PanelField({
  label,
  value,
  placeholder = "Empty",
  onSave,
  type = "text",
  href,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onSave?: (value: string) => Promise<void>;
  type?: string;
  href?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  async function save(nextValue = draft) {
    if (!onSave) return;
    await onSave(nextValue);
    setEditing(false);
  }

  return (
    <div className="group -mx-2 grid grid-cols-[108px_1fr] items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/25">
      <span className="text-[12px] text-muted-foreground">{label}</span>

      {editing && onSave ? (
        <Input
          autoFocus
          type={type}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void save()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
            if (event.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
          className="h-8 border-0 bg-muted/50 text-[13px] shadow-none ring-0 focus-visible:ring-0"
        />
      ) : href && value ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="truncate text-[13px] text-foreground hover:underline"
        >
          {value}
        </a>
      ) : onSave ? (
        <button
          type="button"
          onClick={() => {
            setDraft(value ?? "");
            setEditing(true);
          }}
          className="truncate text-left text-[13px] text-foreground"
        >
          {value || (
            <span className="text-muted-foreground/50">{placeholder}</span>
          )}
        </button>
      ) : (
        <span className="truncate text-[13px] text-foreground">
          {value || (
            <span className="text-muted-foreground/50">{placeholder}</span>
          )}
        </span>
      )}
    </div>
  );
}

export function PanelTagInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: {
  tags?: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-1">
      {tags?.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => void onRemoveTag(tag)}
          className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {tag}
          <span className="text-muted-foreground/60">×</span>
        </button>
      ))}
      <Input
        value={tagInput}
        onChange={(event) => onTagInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void onAddTag();
          }
        }}
        placeholder="Add tag"
        className="h-7 w-24 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

export function PanelNotes({
  id,
  value,
  onSave,
}: {
  id: string;
  value?: string;
  onSave: (notes: string) => Promise<void>;
}) {
  return (
    <textarea
      key={id}
      defaultValue={value ?? ""}
      rows={3}
      placeholder="Write a note..."
      className="w-full resize-none rounded-lg border-0 bg-muted/40 px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:bg-muted/60"
      onBlur={(event) => {
        const nextNotes = event.target.value;
        if (nextNotes !== (value ?? "")) {
          void onSave(nextNotes);
        }
      }}
    />
  );
}

export function PanelDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  deleting,
  onConfirm,
  count = 1,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  deleting: boolean;
  onConfirm: () => void;
  count?: number;
}) {
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmInput("");
    }
  }, [open]);

  const confirmed = confirmInput === String(count);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-background p-0 shadow-lg sm:max-w-[400px]"
      >
        <DialogHeader className="items-start gap-1.5 px-5 pt-5 pb-3 text-left">
          <DialogTitle className="text-base leading-snug font-semibold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-left text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-5 pb-4">
          <label className="block text-[13px] text-muted-foreground">
            Type{" "}
            <span className="font-semibold text-foreground">{count}</span> to
            confirm
          </label>
          <Input
            inputMode="numeric"
            value={confirmInput}
            onChange={(event) => setConfirmInput(event.target.value)}
            placeholder={String(count)}
            className="h-9 border-0 bg-muted/50 text-[13px] shadow-none ring-0 focus-visible:ring-0"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/40 px-5 py-3.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-9 px-3"
            onClick={onConfirm}
            disabled={deleting || !confirmed}
          >
            {deleting ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DrawerFormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export const drawerInputClassName =
  "h-9 border-0 bg-muted/50 text-[13px] shadow-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-0";

export const drawerTextareaClassName =
  "w-full resize-none rounded-lg border-0 bg-muted/50 px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:bg-muted/70 focus-visible:ring-0";

export const drawerErrorClassName =
  "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive";

export function panelHeaderActionsClassName(variant: "default" | "danger" = "default") {
  return cn(
    "h-8 gap-1.5 px-2 text-[13px] text-muted-foreground hover:text-foreground",
    variant === "danger" && "hover:text-destructive",
  );
}
