"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import CompanyDetail from "@/components/CompanyDetail";
import CompanyDrawer from "@/components/CompanyDrawer";
import CompanyLogo from "@/components/CompanyLogo";
import { PanelDeleteDialog } from "@/components/crm-panel";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  formValuesToCompany,
  getContactCountForCompany,
  matchesCompanySearch,
  type CompanyFormValues,
} from "@/lib/company-utils";
import {
  addCompany,
  deleteCompany,
  getCompanies,
  getContacts,
  syncCompaniesFromContacts,
  updateCompany,
} from "@/lib/firestore";
import type { Company, Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadData() {
      try {
        const [companyData, contactData] = await Promise.all([
          getCompanies(userId),
          getContacts(userId),
        ]);

        let nextCompanies = companyData;
        if (companyData.length === 0 && contactData.length > 0) {
          nextCompanies = await syncCompaniesFromContacts(
            userId,
            contactData,
            companyData,
          );
        }

        setCompanies(nextCompanies);
        setContacts(contactData);
      } catch (error) {
        console.error("Failed to load companies:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const selectedCompany =
    companies.find((company) => company.id === selectedId) ?? null;

  const uniqueCountries = useMemo(
    () =>
      Array.from(
        new Set(
          companies
            .map((company) => company.country?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [companies],
  );

  const uniqueIndustries = useMemo(
    () =>
      Array.from(
        new Set(
          companies
            .map((company) => company.industry?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (!matchesCompanySearch(company, search)) return false;
      if (countryFilter && company.country !== countryFilter) return false;
      if (industryFilter && company.industry !== industryFilter) return false;
      return true;
    });
  }, [companies, search, countryFilter, industryFilter]);

  const filteredCompanyIds = filteredCompanies
    .map((company) => company.id)
    .filter((id): id is string => Boolean(id));

  const allFilteredChecked =
    filteredCompanyIds.length > 0 &&
    filteredCompanyIds.every((id) => checkedIds.has(id));

  const someFilteredChecked = filteredCompanyIds.some((id) =>
    checkedIds.has(id),
  );

  function openAddDrawer() {
    setDrawerMode("add");
    setDrawerOpen(true);
  }

  function openEditDrawer() {
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

  async function handleDrawerSubmit(
    values: CompanyFormValues,
    mode: "add" | "edit",
    company?: Company | null,
  ) {
    if (!user) return;

    if (mode === "add") {
      const payload = formValuesToCompany(values, user.uid);
      const optimistic: Company = {
        id: `temp-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCompanies((current) => [optimistic, ...current]);
      setSelectedId(optimistic.id!);

      try {
        const saved = await addCompany(payload);
        setCompanies((current) =>
          current.map((item) => (item.id === optimistic.id ? saved : item)),
        );
        setSelectedId(saved.id!);
      } catch (error) {
        setCompanies((current) =>
          current.filter((item) => item.id !== optimistic.id),
        );
        throw error;
      }

      return;
    }

    if (!company?.id) return;

    const updates = formValuesToCompany(values, user.uid);
    const previous = company;

    setCompanies((current) =>
      current.map((item) =>
        item.id === company.id
          ? {
              ...item,
              ...updates,
              id: company.id,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    try {
      await updateCompany(company.id, updates);
    } catch (error) {
      setCompanies((current) =>
        current.map((item) => (item.id === company.id ? previous : item)),
      );
      throw error;
    }
  }

  async function handleInlineUpdate(id: string, data: Partial<Company>) {
    const previous = companies.find((company) => company.id === id);
    if (!previous) return;

    setCompanies((current) =>
      current.map((company) =>
        company.id === id
          ? { ...company, ...data, updatedAt: new Date().toISOString() }
          : company,
      ),
    );

    try {
      await updateCompany(id, data);
    } catch (error) {
      setCompanies((current) =>
        current.map((company) => (company.id === id ? previous : company)),
      );
      throw error;
    }
  }

  async function handleDelete(id: string) {
    const previous = companies;
    const nextCompanies = companies.filter((company) => company.id !== id);

    setCompanies(nextCompanies);
    if (selectedId === id) {
      setSelectedId(null);
    }

    try {
      await deleteCompany(id);
    } catch (error) {
      setCompanies(previous);
      setSelectedId(id);
      throw error;
    }
  }

  function closeCompanyPanel() {
    setSelectedId(null);
  }

  function toggleSelectAll() {
    setCheckedIds((current) => {
      if (allFilteredChecked) {
        return new Set();
      }
      return new Set(filteredCompanyIds);
    });
  }

  function toggleCompanyCheck(id: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearChecked() {
    setCheckedIds(new Set());
  }

  async function handleBulkDelete() {
    const ids = [...checkedIds];
    if (ids.length === 0) return;

    const previous = companies;
    setBulkDeleting(true);

    try {
      const deletingSelected = ids.includes(selectedId ?? "");

      setCompanies((current) =>
        current.filter((company) => !company.id || !ids.includes(company.id)),
      );
      if (deletingSelected) {
        setSelectedId(null);
      }

      await Promise.all(ids.map((id) => deleteCompany(id)));
      clearChecked();
      setBulkDeleteOpen(false);
    } catch (error) {
      setCompanies(previous);
      console.error("Bulk delete failed:", error);
    } finally {
      setBulkDeleting(false);
    }
  }

  function handleLeftPanelClick(event: React.MouseEvent<HTMLElement>) {
    if (!selectedCompany) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(
        "tbody tr, button, a, input, textarea, select, [role='menu'], [role='dialog']",
      )
    ) {
      return;
    }

    closeCompanyPanel();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="h-screen overflow-hidden pl-72">
          <div className="flex h-full min-h-0 overflow-hidden">
            <section
              className={cn(
                "flex h-full min-h-0 flex-col bg-background transition-all duration-300 ease-out",
                selectedCompany ? "w-[58%] border-r border-border/50" : "w-full",
              )}
              onClick={handleLeftPanelClick}
            >
              <div className="px-6 pt-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-foreground"
                  >
                    Companies
                    <ChevronDown className="size-4 text-muted-foreground/70" />
                  </button>
                  <Button size="sm" className="h-8" onClick={openAddDrawer}>
                    New Company
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-6 py-2">
                <div className="relative max-w-sm flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search companies..."
                    className="h-8 border-0 bg-muted/50 pl-8 text-[13px] shadow-none ring-0 placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filter
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ArrowUpDown className="size-3.5" />
                  Sort
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 px-6 pb-2">
                <FilterPill
                  label="Industry"
                  value={industryFilter}
                  options={uniqueIndustries}
                  onChange={setIndustryFilter}
                  onClear={() => setIndustryFilter("")}
                />
                <FilterPill
                  label="Country"
                  value={countryFilter}
                  options={uniqueCountries}
                  onChange={setCountryFilter}
                  onClear={() => setCountryFilter("")}
                />
              </div>

              {checkedIds.size > 0 ? (
                <div
                  className="flex items-center justify-between border-y border-border/40 bg-muted/20 px-6 py-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="text-xs text-muted-foreground">
                    {checkedIds.size} selected
                    {!allFilteredChecked && someFilteredChecked
                      ? ` · ${filteredCompanyIds.length} total`
                      : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    {!allFilteredChecked ? (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Select all {filteredCompanyIds.length} companies
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setBulkDeleteOpen(true)}
                      className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={clearChecked}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
                  </div>
                ) : companies.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                      <Building2 className="size-6 text-muted-foreground" />
                    </div>
                    <h2 className="mt-5 text-base font-semibold text-foreground">
                      No companies yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add your first company or link contacts with a company name.
                    </p>
                    <Button
                      className="mt-6"
                      onClick={openAddDrawer}
                    >
                      New Company
                    </Button>
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No companies match your filters
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[860px] text-[13px]">
                    <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur-md">
                      <tr className="border-b border-border/40 text-left">
                        <th className="w-9 px-6 py-2">
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-border/60 accent-foreground"
                            checked={allFilteredChecked}
                            ref={(element) => {
                              if (element) {
                                element.indeterminate =
                                  someFilteredChecked && !allFilteredChecked;
                              }
                            }}
                            onChange={toggleSelectAll}
                            aria-label="Select all companies"
                          />
                        </th>
                        <th className="min-w-[220px] px-6 py-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                          Company
                        </th>
                        <th className="min-w-[160px] px-6 py-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                          Location
                        </th>
                        <th className="min-w-[100px] px-6 py-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                          Contacts
                        </th>
                        <th className="min-w-[200px] px-6 py-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                          Tags
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((company) => {
                        const isSelected = company.id === selectedId;
                        const isChecked = company.id
                          ? checkedIds.has(company.id)
                          : false;
                        const location = [company.city, company.country]
                          .filter(Boolean)
                          .join(", ");
                        const contactCount = getContactCountForCompany(
                          contacts,
                          company.name,
                        );

                        return (
                          <tr
                            key={company.id}
                            onClick={() =>
                              setSelectedId(isSelected ? null : company.id!)
                            }
                            className={cn(
                              "group cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/25",
                              isSelected && "bg-muted/40",
                              isChecked && "bg-muted/25",
                            )}
                          >
                            <td
                              className="px-6 py-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className={cn(
                                  "size-3.5 rounded border-border/60 accent-foreground transition-opacity",
                                  !isChecked && "opacity-0 group-hover:opacity-100",
                                )}
                                checked={isChecked}
                                onChange={() =>
                                  company.id && toggleCompanyCheck(company.id)
                                }
                                aria-label={`Select ${company.name}`}
                              />
                            </td>
                            <td className="px-6 py-2">
                              <div className="flex items-center gap-2.5">
                                <CompanyLogo
                                  name={company.name}
                                  logoUrl={company.logoUrl}
                                  size={28}
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {company.name}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {company.industry || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-2 text-muted-foreground">
                              {location || (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-6 py-2 text-muted-foreground">
                              {contactCount}
                            </td>
                            <td className="px-6 py-2">
                              <div className="flex flex-wrap gap-1">
                                {company.tags?.length ? (
                                  company.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-border/40 px-6 py-2.5 text-xs text-muted-foreground">
                <span>{filteredCompanies.length} companies</span>
              </div>
            </section>

            {selectedCompany ? (
              <section className="min-w-0 flex-1 animate-in slide-in-from-right-4 border-l border-border/50 bg-background duration-300">
                <CompanyDetail
                  company={selectedCompany}
                  contacts={contacts}
                  onUpdate={handleInlineUpdate}
                  onDelete={handleDelete}
                  onEdit={openEditDrawer}
                  onClose={closeCompanyPanel}
                />
              </section>
            ) : null}
          </div>
        </main>
      </div>

      <CompanyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        company={drawerMode === "edit" ? selectedCompany : null}
        onSubmit={handleDrawerSubmit}
      />

      <PanelDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={checkedIds.size}
        title={
          checkedIds.size === 1
            ? "Delete company"
            : `Delete ${checkedIds.size} companies`
        }
        description={
          checkedIds.size === 1
            ? "This will permanently remove 1 company from your workspace. This cannot be undone."
            : `This will permanently remove ${checkedIds.size} companies from your workspace. This cannot be undone.`
        }
        confirmLabel={
          checkedIds.size === 1
            ? "Delete company"
            : `Delete ${checkedIds.size} companies`
        }
        deleting={bulkDeleting}
        onConfirm={() => void handleBulkDelete()}
      />
    </AuthGuard>
  );
}

function FilterPill({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-full bg-muted/50 px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground",
          value && "bg-muted font-medium text-foreground",
        )}
      >
        {value ? `${label}: ${value}` : label}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-44">
        <DropdownMenuItem onClick={onClear}>
          All {label.toLowerCase()}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onChange(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
