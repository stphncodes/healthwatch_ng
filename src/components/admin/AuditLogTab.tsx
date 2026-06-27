// Module: Admin Panel — Audit Log Tab | Owner: System Admin / Compliance
"use client";

import type { AuditEntry } from "@/types/health";
import { AUDIT_LOG } from "@/lib/mockData";
import { formatDateTime } from "@/lib/utils";

const CATEGORY_STYLES: Record<AuditEntry["category"], { bg: string; fg: string }> =
  {
    Auth: { bg: "#EFF6FF", fg: "#1D4ED8" },
    Data: { bg: "#F0FDFA", fg: "#0F766E" },
    Config: { bg: "#F5F3FF", fg: "#6D28D9" },
    Export: { bg: "#FFF7ED", fg: "#C2410C" },
    Alert: { bg: "#FEF2F2", fg: "#B91C1C" },
  };

export function AuditLogTab() {
  return (
    <div className="max-h-[28rem] overflow-y-auto scrollbar-thin">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">Event</th>
            <th className="px-5 py-3 font-semibold">User</th>
            <th className="px-5 py-3 font-semibold">Action</th>
            <th className="px-5 py-3 font-semibold">Resource</th>
            <th className="px-5 py-3 font-semibold">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {AUDIT_LOG.map((entry) => {
            const c = CATEGORY_STYLES[entry.category];
            return (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: c.bg, color: c.fg }}
                    >
                      {entry.category}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {entry.id}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 font-medium text-slate-700">
                  {entry.user}
                </td>
                <td className="px-5 py-3 text-slate-600">{entry.action}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">
                  {entry.resource}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                  {formatDateTime(entry.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
