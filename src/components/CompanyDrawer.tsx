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
import {
  companyToFormValues,
  emptyCompanyForm,
  type CompanyFormValues,
} from "@/lib/company-utils";
import type { Company } from "@/lib/types";

interface CompanyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  company?: Company | null;
  onSubmit: (
    values: CompanyFormValues,
    mode: "add" | "edit",
    company?: Company | null,
  ) => Promise<void>;
}

export default function CompanyDrawer({
  open,
  onOpenChange,
  mode,
  company,
  onSubmit,
}: CompanyDrawerProps) {
  const [values, setValues] = useState<CompanyFormValues>(emptyCompanyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(
      mode === "edit" && company
        ? companyToFormValues(company)
        : emptyCompanyForm,
    );
    setError(null);
  }, [open, mode, company]);

  function updateField<K extends keyof CompanyFormValues>(
    key: K,
    value: CompanyFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Company name is required.");
      return;
    }

    setSaving(true);

    try {
      await onSubmit(values, mode, company);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save company.",
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
              {mode === "add" ? "New company" : "Edit company"}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground">
              {mode === "add"
                ? "Add an organization to your workspace."
                : "Update company details."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <DrawerFormField label="Company name">
              <Input
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={drawerInputClassName}
                required
              />
            </DrawerFormField>

            <DrawerFormField label="Industry">
              <Input
                value={values.industry}
                onChange={(event) => updateField("industry", event.target.value)}
                className={drawerInputClassName}
                placeholder="SaaS, Fintech..."
              />
            </DrawerFormField>

            <DrawerFormField label="Website">
              <Input
                value={values.website}
                onChange={(event) => updateField("website", event.target.value)}
                className={drawerInputClassName}
                placeholder="example.com"
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
                  ? "Add company"
                  : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
