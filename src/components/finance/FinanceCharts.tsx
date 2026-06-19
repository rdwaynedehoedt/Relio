"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import type {
  CategoryChartDatum,
  DailySpendingDatum,
} from "@/lib/finance-utils";
import { formatLkr } from "@/lib/finance-utils";

interface FinanceChartsProps {
  categoryData: CategoryChartDatum[];
  dailyData: DailySpendingDatum[];
  periodLabel?: string;
}

export default function FinanceCharts({
  categoryData,
  dailyData,
  periodLabel = "This month",
}: FinanceChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Spending by category
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>

        {categoryData.length > 0 ? (
          <ChartContainer className="mt-4" height={256}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatLkr(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="mt-4 flex h-64 items-center justify-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
            No spending data for {periodLabel.toLowerCase()}
          </div>
        )}

        {categoryData.length > 0 ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {categoryData.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
                <span className="ml-auto font-medium text-foreground">
                  {formatLkr(item.value)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Daily spending
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">This week</p>

        {dailyData.some((item) => item.amount > 0) ? (
          <ChartContainer className="mt-4" height={256}>
            <BarChart data={dailyData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                }
              />
              <Tooltip
                formatter={(value) => formatLkr(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Bar
                dataKey="amount"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="mt-4 flex h-64 items-center justify-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
            No spending data this week
          </div>
        )}
      </div>
    </div>
  );
}
