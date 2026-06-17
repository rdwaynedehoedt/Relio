"use client";

import { useEffect, useState } from "react";
import {
  DrawerFormField,
  drawerErrorClassName,
  drawerInputClassName,
  drawerTextareaClassName,
} from "@/components/crm-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePreferences } from "@/context/PreferencesContext";
import {
  contactToFormValues,
  emptyContactForm,
  type ContactFormValues,
} from "@/lib/contact-utils";
import type { Contact } from "@/lib/types";

interface ContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  contact?: Contact | null;
  onSubmit: (
    values: ContactFormValues,
    mode: "add" | "edit",
    contact?: Contact | null,
  ) => Promise<void>;
}

export default function ContactDrawer({
  open,
  onOpenChange,
  mode,
  contact,
  onSubmit,
}: ContactDrawerProps) {
  const { preferences } = usePreferences();
  const [values, setValues] = useState<ContactFormValues>(emptyContactForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(
      mode === "edit" && contact
        ? contactToFormValues(contact)
        : {
            ...emptyContactForm,
            country: preferences.defaultCountry ?? "",
          },
    );
    setError(null);
  }, [open, mode, contact, preferences.defaultCountry]);

  function updateField<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setSaving(true);

    try {
      await onSubmit(values, mode, contact);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save contact.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto border-border/50 bg-background p-0 sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/40 px-6 py-5">
            <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
              {mode === "add" ? "New contact" : "Edit contact"}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground">
              {mode === "add"
                ? "Add someone to your workspace."
                : "Update contact details."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerFormField label="First name">
                <Input
                  value={values.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  className={drawerInputClassName}
                  required
                />
              </DrawerFormField>
              <DrawerFormField label="Last name">
                <Input
                  value={values.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  className={drawerInputClassName}
                  required
                />
              </DrawerFormField>
            </div>

            <DrawerFormField label="Email">
              <Input
                type="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={drawerInputClassName}
                required
              />
            </DrawerFormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerFormField label="Phone">
                <Input
                  value={values.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={drawerInputClassName}
                />
              </DrawerFormField>
              <DrawerFormField label="Role">
                <Input
                  value={values.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  className={drawerInputClassName}
                />
              </DrawerFormField>
            </div>

            <DrawerFormField label="Company">
              <Input
                value={values.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
                className={drawerInputClassName}
              />
            </DrawerFormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerFormField label="Country">
                <Input
                  value={values.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  className={drawerInputClassName}
                />
              </DrawerFormField>
              <DrawerFormField label="City">
                <Input
                  value={values.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className={drawerInputClassName}
                />
              </DrawerFormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerFormField label="LinkedIn">
                <Input
                  value={values.linkedInUrl}
                  onChange={(event) =>
                    updateField("linkedInUrl", event.target.value)
                  }
                  className={drawerInputClassName}
                  placeholder="linkedin.com/in/..."
                />
              </DrawerFormField>
              <DrawerFormField label="Twitter">
                <Input
                  value={values.twitterUrl}
                  onChange={(event) =>
                    updateField("twitterUrl", event.target.value)
                  }
                  className={drawerInputClassName}
                  placeholder="x.com/..."
                />
              </DrawerFormField>
            </div>

            <DrawerFormField label="Tags">
              <Input
                value={values.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                className={drawerInputClassName}
                placeholder="VIP, Enterprise"
              />
            </DrawerFormField>

            <DrawerFormField label="Last activity">
              <Input
                type="date"
                value={values.lastInteractionDate}
                onChange={(event) =>
                  updateField("lastInteractionDate", event.target.value)
                }
                className={drawerInputClassName}
              />
            </DrawerFormField>

            <DrawerFormField label="Notes">
              <textarea
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={4}
                className={drawerTextareaClassName}
              />
            </DrawerFormField>

            {error ? <p className={drawerErrorClassName}>{error}</p> : null}
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-9" disabled={saving}>
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Add contact"
                  : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
