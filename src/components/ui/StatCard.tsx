// Module: UI Primitives — Stat Card | Owner: Frontend Lead
// Headline metric card used across the dashboard summary row.

import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";
import type { SummaryStat } from "@/types/health";
import { BRAND } from "@/lib/theme";
import { Card } from "./Card";

const TREND_META = {
  up: { Icon: TrendingUp, color: "#B91C1C" },
  down: { Icon: TrendingDown, color: "#047857" },
  flat: { Icon: Minus, color: "#64748B" },
} as const;

export function StatCard({
  stat,
  icon: Icon,
}: {
  stat: SummaryStat;
  icon: LucideIcon;
}) {
  const trend = TREND_META[stat.trend];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: BRAND.tint, color: BRAND.base }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {stat.value}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <trend.Icon className="h-4 w-4" style={{ color: trend.color }} />
        <span className="text-xs font-semibold" style={{ color: trend.color }}>
          {stat.delta}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{stat.helpText}</p>
    </Card>
  );
}
