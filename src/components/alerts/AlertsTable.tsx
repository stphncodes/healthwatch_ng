// Module: Outbreak Alert Management — Alerts Table | Owner: Backend / Platform Engineer
"use client";

import { Inbox } from "lucide-react";
import type { OutbreakAlert } from "@/types/health";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDateTime, formatNumber } from "@/lib/utils";

interface AlertsTableProps {
  alerts: OutbreakAlert[];
  selectedId: string | null;
  onSelect: (alert: OutbreakAlert) => void;
}

export function AlertsTable({ alerts, selectedId, onSelect }: AlertsTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">
          No alerts match the current filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">Disease</th>
            <th className="px-5 py-3 font-semibold">LGA</th>
            <th className="px-5 py-3 font-semibold">State</th>
            <th className="px-5 py-3 font-semibold">Risk</th>
            <th className="px-5 py-3 text-right font-semibold">Cases</th>
            <th className="px-5 py-3 font-semibold">Triggered</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              onClick={() => onSelect(alert)}
              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                selectedId === alert.id ? "bg-brand-tint/60" : ""
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-slate-800">
                {alert.disease}
              </td>
              <td className="px-5 py-3.5 text-slate-600">{alert.lga}</td>
              <td className="px-5 py-3.5 text-slate-600">{alert.state}</td>
              <td className="px-5 py-3.5">
                <RiskBadge risk={alert.risk} />
              </td>
              <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-800">
                {formatNumber(alert.caseCount)}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                {formatDateTime(alert.triggeredAt)}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={alert.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
