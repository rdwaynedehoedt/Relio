"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ContactDetail from "@/components/ContactDetail";
import ContactDrawer from "@/components/ContactDrawer";
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
  type ContactFormValues,
  type ContactSortOption,
  type CustomFilter,
  type CustomFilterField,
  getInitials,
  getUniqueTags,
  getUniqueValues,
  matchesFilters,
  sortContacts,
  formValuesToContact,
} from "@/lib/contact-utils";
import {
  addContact,
  deleteContact,
  getContacts,
  getHubSpotToken,
  updateContact,
} from "@/lib/firestore";
import { syncHubSpotData } from "@/lib/hubspot-sync";
import {
  ADD_FILTER_FIELDS,
  type AddFilterField,
  CONTACT_COLUMNS,
  type ContactColumnId,
  DEFAULT_VISIBLE_COLUMNS,
  getContactColumnValue,
  loadPageSize,
  loadVisibleColumns,
  PAGE_SIZE_OPTIONS,
  PAGE_SIZE_STORAGE_KEY,
  type PageSizeOption,
} from "@/lib/contacts-table-config";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

const filterFieldLabels: Record<CustomFilterField, string> = {
  role: "Role",
  city: "City",
  state: "State",
  source: "Source",
  industry: "Industry",
  lifecycleStage: "Lifecycle Stage",
  leadStatus: "Lead Status",
  annualRevenue: "Annual Revenue",
};

const sortOptions: { value: ContactSortOption; label: string }[] = [
  { value: "activity_desc", label: "Last activity (newest)" },
  { value: "activity_asc", label: "Last activity (oldest)" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "company_asc", label: "Company A → Z" },
];

function ContactsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [lifecycleStageFilter, setLifecycleStageFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<ContactSortOption>("activity_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const [visibleColumns, setVisibleColumns] = useState<ContactColumnId[]>(
    DEFAULT_VISIBLE_COLUMNS,
  );
  const [hubspotToken, setHubspotToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
    setPageSize(loadPageSize());
  }, []);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadContacts() {
      try {
        const data = await getContacts(userId);
        setContacts(data);
      } catch (error) {
        console.error("Failed to load contacts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadHubSpotToken() {
      try {
        const integration = await getHubSpotToken(userId);
        setHubspotToken(integration?.token ?? "");
      } catch (error) {
        console.error("Failed to load HubSpot token:", error);
      }
    }

    loadHubSpotToken();
  }, [user]);

  useEffect(() => {
    const contactId = searchParams.get("id");
    if (contactId) {
      setSelectedId(contactId);
    }
  }, [searchParams]);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedId) ?? null;

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (activeTab === "mine" && contact.source === "hubspot") {
        return false;
      }

      if (
        !matchesFilters(contact, {
          search,
          tagFilter,
          countryFilter,
          industryFilter,
          lifecycleStageFilter,
          leadStatusFilter,
          customFilters,
        })
      ) {
        return false;
      }

      return true;
    });
  }, [
    contacts,
    search,
    tagFilter,
    countryFilter,
    industryFilter,
    lifecycleStageFilter,
    leadStatusFilter,
    customFilters,
    activeTab,
  ]);

  const sortedContacts = useMemo(
    () => sortContacts(filteredContacts, sortBy),
    [filteredContacts, sortBy],
  );

  const totalPages = Math.max(1, Math.ceil(sortedContacts.length / pageSize));

  const paginatedContacts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedContacts.slice(start, start + pageSize);
  }, [sortedContacts, page, pageSize]);

  const orderedVisibleColumns = useMemo(
    () =>
      CONTACT_COLUMNS.filter((column) => visibleColumns.includes(column.id)),
    [visibleColumns],
  );

  function changePageSize(size: PageSizeOption) {
    setPageSize(size);
    setPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
  }

  useEffect(() => {
    setPage(1);
  }, [search, tagFilter, countryFilter, industryFilter, lifecycleStageFilter, leadStatusFilter, customFilters, activeTab, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const validIds = new Set(
      contacts.map((contact) => contact.id).filter((id): id is string => Boolean(id)),
    );
    setCheckedIds((current) => {
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [contacts]);

  const currentSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? "Sort by";

  const pageContactIds = paginatedContacts
    .map((contact) => contact.id)
    .filter((id): id is string => Boolean(id));

  const filteredContactIds = sortedContacts
    .map((contact) => contact.id)
    .filter((id): id is string => Boolean(id));

  const allPageChecked =
    pageContactIds.length > 0 &&
    pageContactIds.every((id) => checkedIds.has(id));

  const allFilteredChecked =
    filteredContactIds.length > 0 &&
    filteredContactIds.every((id) => checkedIds.has(id));

  const somePageChecked = pageContactIds.some((id) => checkedIds.has(id));

  const showSelectAllFiltered =
    allPageChecked &&
    !allFilteredChecked &&
    filteredContactIds.length > pageContactIds.length;

  const uniqueTags = useMemo(() => getUniqueTags(contacts), [contacts]);
  const uniqueCountries = useMemo(
    () => getUniqueValues(contacts, "country"),
    [contacts],
  );
  const uniqueRoles = useMemo(
    () => getUniqueValues(contacts, "role"),
    [contacts],
  );
  const uniqueCities = useMemo(
    () => getUniqueValues(contacts, "city"),
    [contacts],
  );
  const uniqueStates = useMemo(
    () => getUniqueValues(contacts, "state"),
    [contacts],
  );
  const uniqueIndustries = useMemo(
    () => getUniqueValues(contacts, "industry"),
    [contacts],
  );
  const uniqueLifecycleStages = useMemo(
    () => getUniqueValues(contacts, "lifecycleStage"),
    [contacts],
  );
  const uniqueLeadStatuses = useMemo(
    () => getUniqueValues(contacts, "leadStatus"),
    [contacts],
  );
  const uniqueAnnualRevenues = useMemo(
    () => getUniqueValues(contacts, "annualRevenue"),
    [contacts],
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
    values: ContactFormValues,
    mode: "add" | "edit",
    contact?: Contact | null,
  ) {
    if (!user) return;

    if (mode === "add") {
      const payload = formValuesToContact(values, user.uid, "manual");
      const optimistic: Contact = {
        id: `temp-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setContacts((current) => [optimistic, ...current]);
      setSelectedId(optimistic.id!);

      try {
        const saved = await addContact(payload);
        setContacts((current) =>
          current.map((item) => (item.id === optimistic.id ? saved : item)),
        );
        setSelectedId(saved.id!);
      } catch (error) {
        setContacts((current) =>
          current.filter((item) => item.id !== optimistic.id),
        );
        throw error;
      }

      return;
    }

    if (!contact?.id) return;

    const updates = formValuesToContact(values, user.uid, contact.source);
    const previous = contact;

    setContacts((current) =>
      current.map((item) =>
        item.id === contact.id
          ? {
              ...item,
              ...updates,
              id: contact.id,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    try {
      await updateContact(contact.id, updates);
    } catch (error) {
      setContacts((current) =>
        current.map((item) => (item.id === contact.id ? previous : item)),
      );
      throw error;
    }
  }

  async function handleInlineUpdate(id: string, data: Partial<Contact>) {
    const previous = contacts.find((contact) => contact.id === id);
    if (!previous) return;

    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, ...data, updatedAt: new Date().toISOString() }
          : contact,
      ),
    );

    try {
      await updateContact(id, data);
    } catch (error) {
      setContacts((current) =>
        current.map((contact) => (contact.id === id ? previous : contact)),
      );
      throw error;
    }
  }

  async function handleDelete(id: string) {
    const previous = contacts;
    const nextContacts = contacts.filter((contact) => contact.id !== id);

    setContacts(nextContacts);
    if (selectedId === id) {
      setSelectedId(null);
    }

    try {
      await deleteContact(id);
    } catch (error) {
      setContacts(previous);
      setSelectedId(id);
      throw error;
    }
  }

  function addCustomFilter(field: CustomFilterField, value: string) {
    if (!value.trim()) return;

    const topLevelSetters: Partial<
      Record<CustomFilterField, (next: string) => void>
    > = {
      industry: setIndustryFilter,
      lifecycleStage: setLifecycleStageFilter,
      leadStatus: setLeadStatusFilter,
    };

    if (topLevelSetters[field]) {
      topLevelSetters[field]!(value);
      return;
    }

    if (
      customFilters.some(
        (filter) => filter.field === field && filter.value === value,
      )
    ) {
      return;
    }

    setCustomFilters((current) => [
      ...current,
      { id: `${field}-${value}-${Date.now()}`, field, value },
    ]);
  }

  function removeCustomFilter(id: string) {
    setCustomFilters((current) => current.filter((filter) => filter.id !== id));
  }

  function closeContactPanel() {
    setSelectedId(null);
  }

  function toggleSelectAll() {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (allPageChecked) {
        pageContactIds.forEach((id) => next.delete(id));
      } else {
        pageContactIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleContactCheck(id: string) {
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

  function selectAllFiltered() {
    setCheckedIds(new Set(filteredContactIds));
  }

  async function handleBulkDelete() {
    const ids = [...checkedIds];
    if (ids.length === 0) return;

    const previous = contacts;
    setBulkDeleting(true);

    try {
      const deletingSelected = ids.includes(selectedId ?? "");

      setContacts((current) =>
        current.filter((contact) => !contact.id || !ids.includes(contact.id)),
      );
      if (deletingSelected) {
        setSelectedId(null);
      }

      await Promise.all(ids.map((id) => deleteContact(id)));
      clearChecked();
      setBulkDeleteOpen(false);
    } catch (error) {
      setContacts(previous);
      console.error("Bulk delete failed:", error);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function reloadContacts() {
    if (!user) return;

    const data = await getContacts(user.uid);
    setContacts(data);
  }

  async function handleHubSpotSync() {
    if (!user || !hubspotToken.trim()) return;

    setSyncing(true);
    setSyncStatus("Connecting to HubSpot...");

    try {
      await syncHubSpotData(user.uid, hubspotToken, setSyncStatus);
      await reloadContacts();
    } catch (error) {
      setSyncStatus(
        error instanceof Error ? error.message : "Sync failed.",
      );
    } finally {
      setSyncing(false);
    }
  }

  function handleLeftPanelClick(event: React.MouseEvent<HTMLElement>) {
    if (!selectedContact) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(
        "tbody tr, button, a, input, textarea, select, [role='menu'], [role='dialog']",
      )
    ) {
      return;
    }

    closeContactPanel();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pl-72">
          <div className="flex h-screen">
            <section
              className={cn(
                "flex min-w-0 flex-col bg-background transition-all duration-300 ease-out",
                selectedContact ? "w-[58%] border-r border-border/50" : "w-full",
              )}
              onClick={handleLeftPanelClick}
            >
              <div className="px-6 pt-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-foreground"
                  >
                    Contacts
                    <ChevronDown className="size-4 text-muted-foreground/70" />
                  </button>
                  <div className="flex items-center gap-2">
                    {hubspotToken ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => void handleHubSpotSync()}
                        disabled={syncing}
                      >
                        {syncing ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3.5" />
                            Sync
                          </>
                        )}
                      </Button>
                    ) : (
                      <Link
                        href="/settings?section=integrations"
                        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        <RefreshCw className="size-3.5" />
                        Connect HubSpot
                      </Link>
                    )}
                    <Button size="sm" className="h-8" onClick={openAddDrawer}>
                      Add contacts
                    </Button>
                  </div>
                </div>

                {syncStatus ? (
                  <p className="mt-2 text-xs text-muted-foreground">{syncStatus}</p>
                ) : null}

                <div className="mt-4 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      activeTab === "all"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    All contacts
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("mine")}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      activeTab === "mine"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    My contacts
                  </button>
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 px-5 py-2"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative max-w-sm flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, company, role, city..."
                    className="h-8 border-0 bg-muted/50 pl-8 text-[13px] shadow-none ring-0 placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground">
                    <ArrowUpDown className="size-3.5" />
                    {currentSortLabel}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52">
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={cn(
                          sortBy === option.value && "bg-muted font-medium text-foreground",
                        )}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div
                className="flex flex-wrap items-center gap-1.5 px-5 pb-2"
                onClick={(event) => event.stopPropagation()}
              >
                <HubSpotFilterPill
                  label="Country"
                  value={countryFilter}
                  options={uniqueCountries}
                  onChange={setCountryFilter}
                  onClear={() => setCountryFilter("")}
                />
                <HubSpotFilterPill
                  label="Industry"
                  value={industryFilter}
                  options={uniqueIndustries}
                  onChange={setIndustryFilter}
                  onClear={() => setIndustryFilter("")}
                />
                <HubSpotFilterPill
                  label="Lifecycle Stage"
                  value={lifecycleStageFilter}
                  options={uniqueLifecycleStages}
                  onChange={setLifecycleStageFilter}
                  onClear={() => setLifecycleStageFilter("")}
                />
                <HubSpotFilterPill
                  label="Lead Status"
                  value={leadStatusFilter}
                  options={uniqueLeadStatuses}
                  onChange={setLeadStatusFilter}
                  onClear={() => setLeadStatusFilter("")}
                />
                <HubSpotFilterPill
                  label="Tags"
                  value={tagFilter}
                  options={uniqueTags}
                  onChange={setTagFilter}
                  onClear={() => setTagFilter("")}
                />

                {customFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => removeCustomFilter(filter.id)}
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-muted/60 px-2.5 text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    {filterFieldLabels[filter.field]}: {filter.value}
                    <X className="size-3 text-muted-foreground" />
                  </button>
                ))}

                <AddFilterMenu
                  onAdd={addCustomFilter}
                  valueLists={{
                    role: uniqueRoles,
                    city: uniqueCities,
                    state: uniqueStates,
                    annualRevenue: uniqueAnnualRevenues,
                  }}
                />
              </div>

              {checkedIds.size > 0 ? (
                <div
                  className="flex items-center justify-between border-y border-border/40 bg-muted/20 px-5 py-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-muted-foreground">
                      {checkedIds.size} selected
                    </span>
                    {showSelectAllFiltered ? (
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Select all {filteredContactIds.length} contacts
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
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
                ) : contacts.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                      <Users className="size-6 text-muted-foreground" />
                    </div>
                    <h2 className="mt-5 text-base font-semibold text-foreground">
                      No contacts yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add your first contact to start building your pipeline.
                    </p>
                    <Button
                      className="mt-6"
                      onClick={openAddDrawer}
                    >
                      Add contacts
                    </Button>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No contacts match your filters
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[960px] text-[13px]">
                    <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur-md">
                      <tr className="border-b border-border/40 text-left">
                        <th className="w-9 px-5 py-2">
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-border/60 accent-foreground"
                            checked={allPageChecked}
                            ref={(element) => {
                              if (element) {
                                element.indeterminate =
                                  somePageChecked && !allPageChecked;
                              }
                            }}
                            onChange={toggleSelectAll}
                            aria-label="Select all contacts on this page"
                          />
                        </th>
                        {orderedVisibleColumns.map((column) => (
                          <th
                            key={column.id}
                            className="px-5 py-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase"
                            style={{ minWidth: column.minWidth }}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContacts.map((contact) => {
                        const fullName = `${contact.firstName} ${contact.lastName}`;
                        const isSelected = contact.id === selectedId;
                        const isChecked = contact.id ? checkedIds.has(contact.id) : false;

                        return (
                          <tr
                            key={contact.id}
                            onClick={() =>
                              setSelectedId(isSelected ? null : contact.id!)
                            }
                            className={cn(
                              "group cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/25",
                              isSelected && "bg-muted/40",
                              isChecked && "bg-muted/25",
                            )}
                          >
                            <td className="px-5 py-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className={cn(
                                  "size-3.5 rounded border-border/60 accent-foreground transition-opacity",
                                  !isChecked && "opacity-0 group-hover:opacity-100",
                                )}
                                checked={isChecked}
                                onChange={() =>
                                  contact.id && toggleContactCheck(contact.id)
                                }
                                aria-label={`Select ${fullName}`}
                              />
                            </td>
                            {orderedVisibleColumns.map((column) => (
                              <td key={column.id} className="px-5 py-2">
                                <ContactTableCell
                                  contact={contact}
                                  columnId={column.id}
                                  fullName={fullName}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border/40 px-5 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>
                    {sortedContacts.length} contact
                    {sortedContacts.length === 1 ? "" : "s"}
                    {sortedContacts.length !== contacts.length
                      ? ` · filtered from ${contacts.length}`
                      : ""}
                  </span>
                  <span className="text-border">|</span>
                  <label className="flex items-center gap-1.5">
                    Rows
                    <select
                      value={pageSize}
                      onChange={(event) =>
                        changePageSize(Number(event.target.value) as PageSizeOption)
                      }
                      className="h-7 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground outline-none"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="transition-colors hover:text-foreground disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>
                  <span>
                    {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="transition-colors hover:text-foreground disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            {selectedContact ? (
              <section className="min-w-0 flex-1 animate-in slide-in-from-right-4 border-l border-border/50 bg-background duration-300">
                <ContactDetail
                  contact={selectedContact}
                  onUpdate={handleInlineUpdate}
                  onDelete={handleDelete}
                  onEdit={openEditDrawer}
                  onClose={closeContactPanel}
                />
              </section>
            ) : null}
          </div>
        </main>
      </div>

      <ContactDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        contact={drawerMode === "edit" ? selectedContact : null}
        onSubmit={handleDrawerSubmit}
      />

      <PanelDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={checkedIds.size}
        title={
          checkedIds.size === 1
            ? "Delete contact"
            : `Delete ${checkedIds.size} contacts`
        }
        description={
          checkedIds.size === 1
            ? "This will permanently remove 1 contact from your workspace. This cannot be undone."
            : `This will permanently remove ${checkedIds.size} contacts from your workspace. This cannot be undone.`
        }
        confirmLabel={
          checkedIds.size === 1
            ? "Delete contact"
            : `Delete ${checkedIds.size} contacts`
        }
        deleting={bulkDeleting}
        onConfirm={() => void handleBulkDelete()}
      />
    </AuthGuard>
  );
}

function ContactTableCell({
  contact,
  columnId,
  fullName,
}: {
  contact: Contact;
  columnId: ContactColumnId;
  fullName: string;
}) {
  const value = getContactColumnValue(contact, columnId);

  if (columnId === "name") {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-[10px] font-medium text-muted-foreground">
          {getInitials(contact.firstName, contact.lastName)}
        </div>
        <span className="font-medium text-foreground">{fullName}</span>
      </div>
    );
  }

  if (columnId === "email" && contact.email) {
    return (
      <a
        href={`mailto:${contact.email}`}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {contact.email}
      </a>
    );
  }

  if (columnId === "tags" && contact.tags?.length) {
    return (
      <div className="flex flex-wrap gap-1">
        {contact.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (!value) {
    return <span className="text-muted-foreground/50">—</span>;
  }

  return <span className="text-muted-foreground">{value}</span>;
}

function HubSpotFilterPill({
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
        onClick={(event) => event.stopPropagation()}
      >
        {value ? `${label}: ${value}` : label}
        {value ? (
          <button
            type="button"
            className="rounded-full p-0.5 hover:bg-background/60"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            aria-label={`Clear ${label} filter`}
          >
            <X className="size-3 text-muted-foreground" />
          </button>
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-44"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onClick={onClear}>
          All {label.toLowerCase()}
        </DropdownMenuItem>
        {options.length > 0 ? (
          options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onChange(value === option ? "" : option)}
              className="flex items-center justify-between gap-3"
            >
              <span>{option}</span>
              {value === option ? (
                <Check className="size-3.5 text-foreground" />
              ) : null}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No values yet</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddFilterMenu({
  onAdd,
  valueLists,
}: {
  onAdd: (field: CustomFilterField, value: string) => void;
  valueLists: Record<Exclude<AddFilterField, "source">, string[]>;
}) {
  const [step, setStep] = useState<AddFilterField | null>(null);

  const fieldLabels: Record<AddFilterField, string> = {
    role: "Role",
    city: "City",
    state: "State",
    annualRevenue: "Annual Revenue",
    source: "Source",
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setStep(null);
      }}
    >
      <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground">
        <Plus className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48">
        {!step ? (
          <>
            {ADD_FILTER_FIELDS.map((field) => (
              <DropdownMenuItem
                key={field}
                onClick={() => setStep(field)}
              >
                {fieldLabels[field]}
              </DropdownMenuItem>
            ))}
          </>
        ) : step === "source" ? (
          <>
            <DropdownMenuItem onClick={() => setStep(null)}>
              ← Back
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdd("source", "manual")}>
              Manual
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdd("source", "hubspot")}>
              HubSpot
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => setStep(null)}>
              ← Back
            </DropdownMenuItem>
            {valueLists[step as Exclude<AddFilterField, "source">].length > 0 ? (
              valueLists[step as Exclude<AddFilterField, "source">].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    onAdd(step, option);
                    setStep(null);
                  }}
                >
                  {option}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No {fieldLabels[step].toLowerCase()} values yet
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ContactsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      }
    >
      <ContactsPageContent />
    </Suspense>
  );
}
