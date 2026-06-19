"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import CompanyMeetings from "@/components/calendar/CompanyMeetings";
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
  formatWebsiteUrl,
  getContactCountForCompany,
} from "@/lib/company-utils";
import { formatSocialUrl, getInitials } from "@/lib/contact-utils";
import type { Company, Contact } from "@/lib/types";

interface CompanyDetailProps {
  company: Company | null;
  contacts: Contact[];
  onUpdate: (id: string, data: Partial<Company>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
  onClose: () => void;
}

export default function CompanyDetail({
  company,
  contacts,
  onUpdate,
  onDelete,
  onEdit,
  onClose,
}: CompanyDetailProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  if (!company || !company.id) {
    return null;
  }

  const currentCompany = company;
  const companyId = currentCompany.id!;
  const websiteUrl = formatWebsiteUrl(currentCompany.website);
  const companyContacts = contacts.filter(
    (contact) =>
      contact.companyName?.trim().toLowerCase() ===
      currentCompany.name.trim().toLowerCase(),
  );
  const contactCount = getContactCountForCompany(contacts, currentCompany.name);
  const location = [currentCompany.city, currentCompany.country]
    .filter(Boolean)
    .join(", ");

  async function updateField(data: Partial<Company>) {
    await onUpdate(companyId, data);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(companyId);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function addTag() {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    const tags = Array.from(
      new Set([...(currentCompany.tags ?? []), nextTag]),
    );
    await updateField({ tags });
    setTagInput("");
  }

  async function removeTag(tag: string) {
    const tags = currentCompany.tags?.filter((item) => item !== tag) ?? [];
    await updateField({ tags });
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo
            name={currentCompany.name}
            logoUrl={currentCompany.logoUrl}
            size={36}
            rounded="md"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {currentCompany.name}
            </h1>
            {currentCompany.industry ? (
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {currentCompany.industry}
              </p>
            ) : null}
            {location ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                {location}
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
            aria-label="Close company panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <PanelSectionLabel>Company info</PanelSectionLabel>
        <PanelField
          label="Industry"
          value={currentCompany.industry}
          onSave={(value) => updateField({ industry: value || undefined })}
        />
        <PanelField
          label="Type"
          value={currentCompany.type}
          onSave={(value) => updateField({ type: value || undefined })}
        />
        <PanelField
          label="Domain"
          value={currentCompany.domain}
          onSave={(value) => updateField({ domain: value || undefined })}
        />
        <PanelField
          label="Website"
          value={currentCompany.website}
          href={websiteUrl}
          onSave={(value) => updateField({ website: value || undefined })}
        />
        <PanelField
          label="Description"
          value={currentCompany.description}
          onSave={(value) => updateField({ description: value || undefined })}
        />
        <PanelField
          label="About"
          value={currentCompany.aboutUs}
          onSave={(value) => updateField({ aboutUs: value || undefined })}
        />

        <PanelSectionLabel>Contact details</PanelSectionLabel>
        <PanelField
          label="Phone"
          value={currentCompany.phone}
          onSave={(value) => updateField({ phone: value || undefined })}
        />
        <PanelField
          label="Address"
          value={currentCompany.address}
          onSave={(value) => updateField({ address: value || undefined })}
        />
        <PanelField
          label="City"
          value={currentCompany.city}
          onSave={(value) => updateField({ city: value || undefined })}
        />
        <PanelField
          label="State"
          value={currentCompany.state}
          onSave={(value) => updateField({ state: value || undefined })}
        />
        <PanelField
          label="Country"
          value={currentCompany.country}
          onSave={(value) => updateField({ country: value || undefined })}
        />
        <PanelField
          label="Zip"
          value={currentCompany.zip}
          onSave={(value) => updateField({ zip: value || undefined })}
        />
        <PanelField
          label="Timezone"
          value={currentCompany.timezone}
          onSave={(value) => updateField({ timezone: value || undefined })}
        />

        <PanelSectionLabel>Financials</PanelSectionLabel>
        <PanelField
          label="Revenue"
          value={currentCompany.annualRevenue}
          onSave={(value) => updateField({ annualRevenue: value || undefined })}
        />
        <PanelField
          label="Employees"
          value={currentCompany.numberOfEmployees}
          onSave={(value) =>
            updateField({ numberOfEmployees: value || undefined })
          }
        />
        <PanelField
          label="Founded"
          value={currentCompany.foundedYear}
          onSave={(value) => updateField({ foundedYear: value || undefined })}
        />

        <PanelSectionLabel>Social links</PanelSectionLabel>
        <PanelField
          label="LinkedIn"
          value={currentCompany.linkedinUrl}
          href={formatSocialUrl("linkedin", currentCompany.linkedinUrl)}
          onSave={(value) => updateField({ linkedinUrl: value || undefined })}
        />
        <PanelField
          label="Twitter"
          value={currentCompany.twitterHandle}
          href={formatSocialUrl("twitter", currentCompany.twitterHandle)}
          onSave={(value) => updateField({ twitterHandle: value || undefined })}
        />
        <PanelField
          label="Facebook"
          value={currentCompany.facebookUrl}
          href={currentCompany.facebookUrl}
          onSave={(value) => updateField({ facebookUrl: value || undefined })}
        />

        <PanelSectionLabel>Tags</PanelSectionLabel>
        <PanelTagInput
          tags={currentCompany.tags}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />

        <PanelSectionLabel>Notes</PanelSectionLabel>
        <div className="px-2">
          <PanelNotes
            id={currentCompany.id ?? ""}
            value={currentCompany.notes}
            onSave={(notes) => updateField({ notes: notes || undefined })}
          />
        </div>

        <PanelSectionLabel>Contacts · {contactCount}</PanelSectionLabel>
        {companyContacts.length === 0 ? (
          <p className="px-2 text-[13px] text-muted-foreground/70">
            No contacts linked yet.
          </p>
        ) : (
          <div className="space-y-0.5 px-1">
            {companyContacts.map((contact) => {
              const fullName = `${contact.firstName} ${contact.lastName}`;

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => router.push(`/contacts?id=${contact.id}`)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/25"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-[10px] font-medium text-muted-foreground">
                    {getInitials(contact.firstName, contact.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {contact.role || contact.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <CompanyMeetings company={currentCompany} />
      </div>

      <PanelDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete company"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-medium text-foreground">
              {currentCompany.name}
            </span>{" "}
            from your workspace. Contacts linked to this company will not be
            deleted.
          </>
        }
        confirmLabel="Delete company"
        deleting={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
