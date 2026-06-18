"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarHeart,
  LayoutGrid,
  Map,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import GoalDrawer from "@/components/GoalDrawer";
import LifeEventDrawer from "@/components/LifeEventDrawer";
import BoardView from "@/components/lifemap/BoardView";
import GoalDetailDialog from "@/components/lifemap/GoalDetailDialog";
import GoalsGrid from "@/components/lifemap/GoalsGrid";
import LifeEventDetailDialog from "@/components/lifemap/LifeEventDetailDialog";
import LifeEventsGrid from "@/components/lifemap/LifeEventsGrid";
import TimelineView from "@/components/lifemap/TimelineView";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  fetchExchangeRates,
  formatLkr,
  getCurrentMonthKey,
  getMonthlyStats,
  getNetWorthSummary,
  type ExchangeRates,
} from "@/lib/finance-utils";
import {
  filterEventsForZoom,
  filterGoalsForZoom,
  type GoalFormValues,
  type LifeEventFormValues,
  type TimelineZoom,
} from "@/lib/lifemap-utils";
import {
  addGoal,
  addLifeEvent,
  deleteGoal,
  deleteLifeEvent,
  getFixedDeposits,
  getGoals,
  getLifeEvents,
  getTransactions,
  getWallets,
  updateGoal,
  updateLifeEvent,
} from "@/lib/firestore";
import type { Goal, GoalStatus, LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_RATES: ExchangeRates = {
  USD: 0,
  GBP: 0,
  AED: 0,
  AUD: 0,
};

type LifeMapView = "timeline" | "board";

export default function LifeMapPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [wallets, setWallets] = useState<Awaited<ReturnType<typeof getWallets>>>([]);
  const [fixedDeposits, setFixedDeposits] = useState<
    Awaited<ReturnType<typeof getFixedDeposits>>
  >([]);
  const [transactions, setTransactions] = useState<
    Awaited<ReturnType<typeof getTransactions>>
  >([]);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<LifeMapView>("timeline");
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>("year");
  const [timelineAnchor, setTimelineAnchor] = useState(() => new Date());
  const [goalDrawerOpen, setGoalDrawerOpen] = useState(false);
  const [goalDrawerMode, setGoalDrawerMode] = useState<"add" | "edit">("add");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [eventDrawerOpen, setEventDrawerOpen] = useState(false);
  const [eventDrawerMode, setEventDrawerMode] = useState<"add" | "edit">("add");
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<LifeEvent | null>(null);
  const [goalDetailOpen, setGoalDetailOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);

  const reloadData = useCallback(async () => {
    if (!user) return;

    const [
      nextGoals,
      nextLifeEvents,
      nextWallets,
      nextFixedDeposits,
      nextTransactions,
    ] = await Promise.all([
      getGoals(user.uid),
      getLifeEvents(user.uid),
      getWallets(user.uid),
      getFixedDeposits(user.uid),
      getTransactions(user.uid),
    ]);

    setGoals(nextGoals);
    setLifeEvents(nextLifeEvents);
    setWallets(nextWallets);
    setFixedDeposits(nextFixedDeposits);
    setTransactions(nextTransactions);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const nextRates = await fetchExchangeRates();
        setRates(nextRates);
        await reloadData();
      } catch (error) {
        console.error("Failed to load life map data:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, reloadData]);

  const netWorth = useMemo(
    () => getNetWorthSummary(wallets, fixedDeposits, rates),
    [wallets, fixedDeposits, rates],
  );

  const monthlyStats = useMemo(
    () =>
      getMonthlyStats(transactions, wallets, rates, getCurrentMonthKey()),
    [transactions, wallets, rates],
  );

  const financeContext = useMemo(
    () => ({
      netWorthLkr: netWorth.totalLkr,
      monthlyNetLkr: monthlyStats.netLkr,
    }),
    [netWorth.totalLkr, monthlyStats.netLkr],
  );

  const activeGoalsCount = useMemo(
    () => goals.filter((goal) => goal.status === "active").length,
    [goals],
  );

  const zoomGoals = useMemo(
    () => filterGoalsForZoom(goals, timelineZoom, timelineAnchor),
    [goals, timelineZoom, timelineAnchor],
  );

  const zoomEvents = useMemo(
    () => filterEventsForZoom(lifeEvents, timelineZoom, timelineAnchor),
    [lifeEvents, timelineZoom, timelineAnchor],
  );

  function openAddGoalDrawer() {
    setGoalDrawerMode("add");
    setSelectedGoal(null);
    setGoalDrawerOpen(true);
  }

  function openEditGoalDrawer(goal: Goal) {
    setGoalDrawerMode("edit");
    setSelectedGoal(goal);
    setGoalDrawerOpen(true);
  }

  function openAddEventDrawer() {
    setEventDrawerMode("add");
    setSelectedEvent(null);
    setEventDrawerOpen(true);
  }

  function openEditEventDrawer(event: LifeEvent) {
    setEventDrawerMode("edit");
    setSelectedEvent(event);
    setEventDrawerOpen(true);
  }

  function openEventFromMap(event: LifeEvent) {
    setDetailEvent(event);
    setEventDetailOpen(true);
  }

  function openGoalFromMap(goal: Goal) {
    setDetailGoal(goal);
    setGoalDetailOpen(true);
  }

  async function handleSaveGoal(values: GoalFormValues) {
    if (!user) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      category: values.category,
      status: values.status,
      userId: user.uid,
      coverEmoji: values.coverEmoji,
      isPinned: values.isPinned,
      milestones: values.milestones,
      currency: values.currency || "LKR",
      financeLink: values.useFinanceLink,
      ...(values.targetDate ? { targetDate: values.targetDate } : {}),
      ...(values.achievedDate ? { achievedDate: values.achievedDate } : {}),
      ...(values.targetAmount
        ? { targetAmount: Number(values.targetAmount) }
        : {}),
      ...(!values.useFinanceLink && values.currentAmount
        ? { currentAmount: Number(values.currentAmount) }
        : {}),
    };

    if (goalDrawerMode === "edit" && selectedGoal?.id) {
      await updateGoal(selectedGoal.id, payload, {
        clearCurrentAmount: values.useFinanceLink,
      });
      setGoals((current) =>
        current.map((goal) =>
          goal.id === selectedGoal.id
            ? {
                ...goal,
                ...payload,
                currentAmount: values.useFinanceLink
                  ? undefined
                  : values.currentAmount
                    ? Number(values.currentAmount)
                    : goal.currentAmount,
                updatedAt: new Date().toISOString(),
              }
            : goal,
        ),
      );
      return;
    }

    const saved = await addGoal(payload);
    setGoals((current) => [saved, ...current]);
  }

  async function handleDeleteGoal(id: string) {
    await deleteGoal(id);
    setGoals((current) => current.filter((goal) => goal.id !== id));
    if (selectedGoal?.id === id) setSelectedGoal(null);
  }

  async function handleSaveEvent(values: LifeEventFormValues) {
    if (!user) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      date: values.date,
      category: values.category,
      emoji: values.emoji,
      userId: user.uid,
      ...(values.mood ? { mood: values.mood } : {}),
    };

    if (eventDrawerMode === "edit" && selectedEvent?.id) {
      await updateLifeEvent(selectedEvent.id, payload);
      setLifeEvents((current) =>
        current.map((event) =>
          event.id === selectedEvent.id ? { ...event, ...payload } : event,
        ),
      );
      return;
    }

    const saved = await addLifeEvent(payload);
    setLifeEvents((current) => [saved, ...current]);
  }

  async function handleDeleteEvent(id: string) {
    await deleteLifeEvent(id);
    setLifeEvents((current) => current.filter((event) => event.id !== id));
    if (selectedEvent?.id === id) setSelectedEvent(null);
  }

  async function handleStatusChange(goalId: string, status: GoalStatus) {
    await updateGoal(goalId, { status });
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? { ...goal, status, updatedAt: new Date().toISOString() }
          : goal,
      ),
    );
  }

  const showEmpty = !loading && goals.length === 0 && lifeEvents.length === 0;

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
                    Life Map
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your personal timeline of dreams, goals, and milestones
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl border border-border/60 bg-muted/20 p-1">
                    <button
                      type="button"
                      onClick={() => setView("timeline")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        view === "timeline"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Map className="size-3.5" />
                      Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("board")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        view === "board"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <LayoutGrid className="size-3.5" />
                      Board
                    </button>
                  </div>

                  <Button variant="outline" onClick={openAddEventDrawer}>
                    <Sparkles className="size-4" />
                    Add Life Event
                  </Button>
                  <Button onClick={openAddGoalDrawer}>
                    <Plus className="size-4" />
                    New Goal
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatChip
                  label="Net worth"
                  value={formatLkr(netWorth.totalLkr)}
                  icon={Wallet}
                />
                <StatChip
                  label="Monthly savings"
                  value={formatLkr(monthlyStats.netLkr)}
                  icon={TrendingUp}
                  tone={monthlyStats.netLkr >= 0 ? "income" : "expense"}
                />
                <StatChip
                  label="Active goals"
                  value={String(activeGoalsCount)}
                  icon={Target}
                />
                <StatChip
                  label="Life events logged"
                  value={String(lifeEvents.length)}
                  icon={CalendarHeart}
                />
              </div>

              {loading ? (
                <div className="mt-16 flex items-center justify-center py-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
                </div>
              ) : showEmpty ? (
                <div className="mt-16 flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="text-6xl">🗺️</div>
                  <h2 className="mt-6 text-lg font-semibold text-foreground">
                    Your life map is empty
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Plot your dreams, goals and milestones on your personal
                    timeline
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={openAddEventDrawer}>
                      Add life event
                    </Button>
                    <Button onClick={openAddGoalDrawer}>
                      Add your first goal
                    </Button>
                  </div>
                </div>
              ) : view === "timeline" ? (
                <div className="mt-8 space-y-2">
                  <TimelineView
                    goals={goals}
                    lifeEvents={lifeEvents}
                    zoom={timelineZoom}
                    anchorDate={timelineAnchor}
                    onZoomChange={setTimelineZoom}
                    onAnchorChange={setTimelineAnchor}
                    finance={financeContext}
                    onGoalClick={openGoalFromMap}
                    onEventClick={openEventFromMap}
                    selectedGoalId={detailGoal?.id}
                    selectedEventId={detailEvent?.id}
                  />

                  <GoalsGrid
                    goals={zoomGoals}
                    finance={financeContext}
                    onGoalClick={openEditGoalDrawer}
                  />

                  <LifeEventsGrid
                    events={zoomEvents}
                    onEventClick={openEditEventDrawer}
                  />
                </div>
              ) : (
                <div className="mt-8">
                  <BoardView
                    goals={goals}
                    finance={financeContext}
                    onGoalClick={openEditGoalDrawer}
                    onStatusChange={(goalId, status) =>
                      void handleStatusChange(goalId, status)
                    }
                  />
                </div>
              )}
            </div>
          </SidebarInset>
        </div>

        <GoalDrawer
          open={goalDrawerOpen}
          onOpenChange={setGoalDrawerOpen}
          mode={goalDrawerMode}
          goal={selectedGoal}
          finance={financeContext}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
        />

        <LifeEventDrawer
          open={eventDrawerOpen}
          onOpenChange={setEventDrawerOpen}
          mode={eventDrawerMode}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />

        <LifeEventDetailDialog
          open={eventDetailOpen}
          onOpenChange={setEventDetailOpen}
          event={detailEvent}
          onEdit={() => {
            if (detailEvent) openEditEventDrawer(detailEvent);
          }}
        />

        <GoalDetailDialog
          open={goalDetailOpen}
          onOpenChange={setGoalDetailOpen}
          goal={detailGoal}
          finance={financeContext}
          onEdit={() => {
            if (detailGoal) openEditGoalDrawer(detailGoal);
          }}
        />
      </SidebarProvider>
    </AuthGuard>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "income" | "expense";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon
          className={cn(
            "size-4",
            tone === "income" && "text-emerald-600 dark:text-emerald-400",
            tone === "expense" && "text-rose-600 dark:text-rose-400",
          )}
        />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
