// Module: Outbreak Alert Management — Client Orchestrator | Owner: Backend / Platform Engineer
// Owns alert state (so acknowledgements persist in-session), filtering and the
// selected-row drawer.
"use client";

import { useMemo, useState } from "react";
import { BellOff } from "lucide-react";
import type { OutbreakAlert } from "@/types/health";
import { RISK_ORDER } from "@/lib/theme";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertFilters,
  DEFAULT_FILTERS,
  type AlertFilterState,
} from "./AlertFilters";
import { AlertsTable } from "./AlertsTable";
import { AlertDrawer } from "./AlertDrawer";

export function AlertsClient({
  initialAlerts,
}: {
  initialAlerts: OutbreakAlert[];
}) {
  const [alerts, setAlerts] = useState<OutbreakAlert[]>(initialAlerts);
  const [filters, setFilters] = useState<AlertFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filterOptions = useMemo(
    () => ({
      diseases: [...new Set(alerts.map((a) => a.disease))].sort(),
      risks: [...RISK_ORDER],
      states: [...new Set(alerts.map((a) => a.state))].sort(),
      statuses: ["Active", "Investigating", "Acknowledged", "Resolved"],
    }),
    [alerts],
  );

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (filters.disease === "All" || a.disease === filters.disease) &&
          (filters.risk === "All" || a.risk === filters.risk) &&
          (filters.state === "All" || a.state === filters.state) &&
          (filters.status === "All" || a.status === filters.status),
      ),
    [alerts, filters],
  );

  const selected = selectedId
    ? (alerts.find((a) => a.id === selectedId) ?? null)
    : null;

  function acknowledge(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" } : a)),
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Outbreak Alerts"
          subtitle="Alerts raised by the detection pipeline appear here"
        />
        <EmptyState
          icon={BellOff}
          title="No outbreak alerts"
          hint="Connect Supabase and feed the outbreak_alerts table to start triaging alerts."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <AlertFilters
        filters={filters}
        onChange={setFilters}
        options={filterOptions}
        resultCount={filtered.length}
      />

      <Card>
        <CardHeader
          title="Outbreak Alerts"
          subtitle="Select a row to view full details and respond"
        />
        <AlertsTable
          alerts={filtered}
          selectedId={selectedId}
          onSelect={(a) => setSelectedId(a.id)}
        />
      </Card>

      <AlertDrawer
        alert={selected}
        onClose={() => setSelectedId(null)}
        onAcknowledge={acknowledge}
      />
    </div>
  );
}
