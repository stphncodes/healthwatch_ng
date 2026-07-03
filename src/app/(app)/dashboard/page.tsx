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
import { formatNumber } from "@/lib/utils";
import type { SummaryStat } from "@/types/health";

export const metadata: Metadata = { title: "Surveillance Dashboard" };

const STAT_ICONS: Record<string, LucideIcon> = {
  "active-cases": Activity,
  "active-outbreaks": Siren,
  "states-affected": MapPin,
  "detection-time": Clock,
};

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

  const stats: SummaryStat[] = [
    {
      id: "active-cases",
      label: "Active cases",
      value: formatNumber(activeCases),
      delta: "",
      trend: "flat",
      helpText: "Across all reporting states",
    },
    {
      id: "active-outbreaks",
      label: "Active outbreaks",
      value: String(activeOutbreaks),
      delta: "",
      trend: "flat",
      helpText: "Alerts under active response",
    },
    {
      id: "states-affected",
      label: "States affected",
      value: String(statesAffected),
      delta: "",
      trend: "flat",
      helpText: "States with open alerts",
    },
    {
      id: "detection-time",
      label: "Mean detection time",
      value: alerts.length > 0 ? `${meanDetection} hrs` : "—",
      delta: "",
      trend: "flat",
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
