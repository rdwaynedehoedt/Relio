"use client";

import { useState } from "react";
import { Copy, Pencil, Trash2, X } from "lucide-react";
import {
  PanelDeleteDialog,
  PanelField,
  PanelNotes,
  PanelSectionLabel,
  PanelTagInput,
  panelHeaderActionsClassName,
} from "@/components/crm-panel";
import { Button } from "@/components/ui/button";
import {
  formatInteractionDate,
  formatSocialUrl,
  getInitials,
} from "@/lib/contact-utils";
import type { Contact } from "@/lib/types";

interface ContactDetailProps {
  contact: Contact | null;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
  onClose: () => void;
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="group -mx-2 grid grid-cols-[108px_1fr] items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/25">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[13px] text-foreground">
          {value || <span className="text-muted-foreground/50">Empty</span>}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(value)}
            className="rounded p-1 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          >
            <Copy className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ContactDetail({
  contact,
  onUpdate,
  onDelete,
  onEdit,
  onClose,
}: ContactDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  if (!contact || !contact.id) {
    return null;
  }

  const currentContact = contact;
  const contactId = currentContact.id!;
  const fullName = `${currentContact.firstName} ${currentContact.lastName}`;
  const subtitle = [currentContact.role, currentContact.companyName]
    .filter(Boolean)
    .join(" · ");

  async function updateField(data: Partial<Contact>) {
    await onUpdate(contactId, data);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(contactId);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function addTag() {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    const tags = Array.from(new Set([...(currentContact.tags ?? []), nextTag]));
    await updateField({ tags });
    setTagInput("");
  }

  async function removeTag(tag: string) {
    const tags = currentContact.tags?.filter((item) => item !== tag) ?? [];
    await updateField({ tags });
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/70 text-[11px] font-medium text-muted-foreground">
            {getInitials(currentContact.firstName, currentContact.lastName)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {fullName}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={panelHeaderActionsClassName()}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={panelHeaderActionsClassName("danger")}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close contact panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <PanelSectionLabel>Contact info</PanelSectionLabel>
        <ReadOnlyField label="Email" value={currentContact.email} />
        <PanelField
          label="Phone"
          value={currentContact.phone}
          onSave={(value) => updateField({ phone: value || undefined })}
        />
        <PanelField
          label="Mobile"
          value={currentContact.mobilePhone}
          onSave={(value) => updateField({ mobilePhone: value || undefined })}
        />

        <PanelSectionLabel>Location</PanelSectionLabel>
        <PanelField
          label="Address"
          value={currentContact.address}
          onSave={(value) => updateField({ address: value || undefined })}
        />
        <PanelField
          label="City"
          value={currentContact.city}
          onSave={(value) => updateField({ city: value || undefined })}
        />
        <PanelField
          label="State"
          value={currentContact.state}
          onSave={(value) => updateField({ state: value || undefined })}
        />
        <PanelField
          label="Country"
          value={currentContact.country}
          onSave={(value) => updateField({ country: value || undefined })}
        />
        <PanelField
          label="Zip"
          value={currentContact.zip}
          onSave={(value) => updateField({ zip: value || undefined })}
        />

        <PanelSectionLabel>Professional</PanelSectionLabel>
        <PanelField
          label="Role"
          value={currentContact.role}
          onSave={(value) => updateField({ role: value || undefined })}
        />
        <PanelField
          label="Company"
          value={currentContact.companyName}
          onSave={(value) => updateField({ companyName: value || undefined })}
        />
        <PanelField
          label="Industry"
          value={currentContact.industry}
          onSave={(value) => updateField({ industry: value || undefined })}
        />
        <PanelField
          label="Lifecycle"
          value={currentContact.lifecycleStage}
          onSave={(value) => updateField({ lifecycleStage: value || undefined })}
        />

        <PanelSectionLabel>Social</PanelSectionLabel>
        <PanelField
          label="LinkedIn"
          value={currentContact.linkedInUrl}
          href={formatSocialUrl("linkedin", currentContact.linkedInUrl)}
          onSave={(value) => updateField({ linkedInUrl: value || undefined })}
        />
        <PanelField
          label="Twitter"
          value={currentContact.twitterHandle || currentContact.twitterUrl}
          href={formatSocialUrl(
            "twitter",
            currentContact.twitterHandle || currentContact.twitterUrl,
          )}
          onSave={(value) => updateField({ twitterHandle: value || undefined })}
        />

        <PanelSectionLabel>Financial</PanelSectionLabel>
        <PanelField
          label="Revenue"
          value={currentContact.annualRevenue}
          onSave={(value) => updateField({ annualRevenue: value || undefined })}
        />
        <PanelField
          label="Employees"
          value={currentContact.numberOfEmployees}
          onSave={(value) =>
            updateField({ numberOfEmployees: value || undefined })
          }
        />

        <PanelSectionLabel>Tags</PanelSectionLabel>
        <PanelTagInput
          tags={currentContact.tags}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />

        <PanelSectionLabel>Notes</PanelSectionLabel>
        <div className="px-2">
          <PanelNotes
            id={currentContact.id ?? ""}
            value={currentContact.notes}
            onSave={(notes) => updateField({ notes: notes || undefined })}
          />
        </div>

        <PanelSectionLabel>Activity</PanelSectionLabel>
        <PanelField
          label="Last touch"
          value={currentContact.lastInteractionDate?.slice(0, 10)}
          type="date"
          onSave={(value) =>
            updateField({ lastInteractionDate: value || undefined })
          }
        />
        <p className="px-2 pt-0.5 text-xs text-muted-foreground/70">
          {formatInteractionDate(currentContact.lastInteractionDate)}
        </p>
      </div>

      <PanelDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete contact"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-medium text-foreground">{fullName}</span> from
            your workspace. This action cannot be undone.
          </>
        }
        confirmLabel="Delete contact"
        deleting={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
