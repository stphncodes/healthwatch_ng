// Module: Disease Surveillance Dashboard | Owner: ML Engineer / Data Scientist
import type { Metadata } from "next";
import { Activity, Clock, MapPin, Siren, type LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { CaseTrendChart } from "@/components/dashboard/CaseTrendChart";
import { StateRiskGrid } from "@/components/dashboard/StateRiskGrid";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { SUMMARY_STATS } from "@/lib/mockData";

export const metadata: Metadata = { title: "Surveillance Dashboard" };

const STAT_ICONS: Record<string, LucideIcon> = {
  "active-cases": Activity,
  "active-outbreaks": Siren,
  "states-affected": MapPin,
  "detection-time": Clock,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_STATS.map((stat) => (
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
          <div className="p-5">
            <CaseTrendChart />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Alerts"
            subtitle="Latest outbreak signals"
          />
          <RecentAlerts />
        </Card>
      </section>

      {/* State risk grid */}
      <section>
        <Card>
          <CardHeader
            title="Nigeria State Risk Grid"
            subtitle="All 36 states + FCT, coloured by current risk level"
          />
          <div className="p-5">
            <StateRiskGrid />
          </div>
        </Card>
      </section>
    </div>
  );
}
