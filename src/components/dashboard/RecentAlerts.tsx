// Module: Disease Surveillance Dashboard — Recent Alerts | Owner: ML Engineer / Data Scientist

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OUTBREAK_ALERTS } from "@/lib/mockData";
import { RiskBadge } from "@/components/ui/Badge";
import { formatNumber, timeAgo } from "@/lib/utils";

// Newest five alerts (the dataset is ordered most-recent first).
const recent = OUTBREAK_ALERTS.slice(0, 5);

export function RecentAlerts() {
  return (
    <ul className="divide-y divide-slate-100">
      {recent.map((alert) => (
        <li
          key={alert.id}
          className="flex items-center gap-3 px-5 py-3.5 first:pt-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-800">
                {alert.disease}
              </p>
              <RiskBadge risk={alert.risk} />
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {alert.lga}, {alert.state} · {formatNumber(alert.caseCount)} cases
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">
            {timeAgo(alert.triggeredAt)}
          </span>
        </li>
      ))}
      <li className="px-5 py-3">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          View all alerts
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </li>
    </ul>
  );
}
