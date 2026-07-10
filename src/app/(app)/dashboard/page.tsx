// Module: Disease Surveillance Dashboard | Owner: ML Engineer / Data Scientist
import type { Metadata } from "next";
import {
  Activity,
  BellOff,
  Clock,
  LineChart,
  Map,
  MapPin,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { CaseTrendChart } from "@/components/dashboard/CaseTrendChart";
import { StateRiskGrid } from "@/components/dashboard/StateRiskGrid";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import {
  getOutbreakAlerts,
  getStateRisks,
  getWeeklyCaseTrends,
} from "@/lib/data";
import { formatNumber, periodDelta } from "@/lib/utils";
import type {
  OutbreakAlert,
  SummaryStat,
  WeeklyCaseTrend,
} from "@/types/health";

export const metadata: Metadata = { title: "Surveillance Dashboard" };

const STAT_ICONS: Record<string, LucideIcon> = {
  "active-cases": Activity,
  "active-outbreaks": Siren,
  "states-affected": MapPin,
  "detection-time": Clock,
};

type Delta = { delta: string; trend: SummaryStat["trend"] };

// Period-over-period deltas, derived from the time dimension already in the
// data — no fabricated figures. Active cases compare the latest two epi weeks
// of the trend series; the alert-based metrics compare the last 7 days against
// the prior 7 days using each alert's triggeredAt. Kept out of the component
// body so the per-request `Date.now()` isn't flagged as render-impure.
function deriveStatDeltas(
  alerts: OutbreakAlert[],
  trends: WeeklyCaseTrend[],
): { cases: Delta; outbreaks: Delta; states: Delta; detection: Delta } {
  const now = Date.now();
  const DAY = 86_400_000;
  const ageDays = (a: OutbreakAlert) =>
    (now - new Date(a.triggeredAt).getTime()) / DAY;
  const last7 = alerts.filter((a) => ageDays(a) <= 7);
  const prior7 = alerts.filter((a) => ageDays(a) > 7 && ageDays(a) <= 14);
  const openCount = (list: OutbreakAlert[]) =>
    list.filter((a) => a.status === "Active" || a.status === "Investigating")
      .length;
  const stateCount = (list: OutbreakAlert[]) =>
    new Set(list.map((a) => a.state)).size;
  const meanDet = (list: OutbreakAlert[]) =>
    list.length > 0
      ? list.reduce((s, a) => s + a.detectionTimeHrs, 0) / list.length
      : 0;
  const weekTotal = (t: WeeklyCaseTrend) =>
    t.lassaFever + t.cholera + t.meningitis;

  return {
    cases:
      trends.length >= 2
        ? periodDelta(
            weekTotal(trends[trends.length - 1]),
            weekTotal(trends[trends.length - 2]),
          )
        : { delta: "", trend: "flat" },
    outbreaks: periodDelta(openCount(last7), openCount(prior7)),
    states: periodDelta(stateCount(last7), stateCount(prior7)),
    detection: periodDelta(meanDet(last7), meanDet(prior7)),
  };
}

export default async function DashboardPage() {
  const [stateRisks, alerts, trends] = await Promise.all([
    getStateRisks(),
    getOutbreakAlerts(),
    getWeeklyCaseTrends(),
  ]);

  // Headline figures are derived from the live datasets.
  const activeCases = stateRisks.reduce((sum, s) => sum + s.activeCases, 0);
  const activeOutbreaks = alerts.filter(
    (a) => a.status === "Active" || a.status === "Investigating",
  ).length;
  const statesAffected = new Set(alerts.map((a) => a.state)).size;
  const meanDetection =
    alerts.length > 0
      ? Math.round(
          alerts.reduce((sum, a) => sum + a.detectionTimeHrs, 0) /
            alerts.length,
        )
      : 0;

  const d = deriveStatDeltas(alerts, trends);

  const stats: SummaryStat[] = [
    {
      id: "active-cases",
      label: "Active cases",
      value: formatNumber(activeCases),
      delta: d.cases.delta,
      trend: d.cases.trend,
      helpText: "Across all reporting states",
    },
    {
      id: "active-outbreaks",
      label: "Active outbreaks",
      value: String(activeOutbreaks),
      delta: d.outbreaks.delta,
      trend: d.outbreaks.trend,
      helpText: "Alerts under active response",
    },
    {
      id: "states-affected",
      label: "States affected",
      value: String(statesAffected),
      delta: d.states.delta,
      trend: d.states.trend,
      helpText: "States with open alerts",
    },
    {
      id: "detection-time",
      label: "Mean detection time",
      value: alerts.length > 0 ? `${meanDetection} hrs` : "—",
      delta: d.detection.delta,
      trend: d.detection.trend,
      helpText: "Signal to confirmed detection",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            stat={stat}
            icon={STAT_ICONS[stat.id] ?? Activity}
          />
        ))}
      </section>

      {/* Trend chart + recent alerts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Case Trends"
            subtitle="Confirmed + suspected cases, last 12 epi weeks"
          />
          {trends.length > 0 ? (
            <div className="p-5">
              <CaseTrendChart data={trends} />
            </div>
          ) : (
            <EmptyState
              icon={LineChart}
              title="No trend data yet"
              hint="Weekly case counts will chart here once the weekly_case_trends table has rows."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Alerts"
            subtitle="Latest outbreak signals"
          />
          {alerts.length > 0 ? (
            <RecentAlerts alerts={alerts} />
          ) : (
            <EmptyState
              icon={BellOff}
              title="No alerts yet"
              hint="Outbreak alerts raised by the detection pipeline will appear here."
            />
          )}
        </Card>
      </section>

      {/* State risk grid */}
      <section>
        <Card>
          <CardHeader
            title="Nigeria State Risk Grid"
            subtitle="All 36 states + FCT, coloured by current risk level"
          />
          {stateRisks.length > 0 ? (
            <div className="p-5">
              <StateRiskGrid states={stateRisks} />
            </div>
          ) : (
            <EmptyState
              icon={Map}
              title="No state risk data"
              hint="Populate the state_risks table to light up the national risk grid."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
