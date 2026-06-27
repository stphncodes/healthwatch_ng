// Module: Admin Panel — Data Sources Tab | Owner: Data Engineer
"use client";

import { Building2, Database, Globe, type LucideIcon } from "lucide-react";
import { DATA_SOURCES } from "@/lib/mockData";
import { SOURCE_STATUS_STYLES } from "@/lib/theme";
import { SourceStatusBadge } from "@/components/ui/Badge";
import { formatNumber, timeAgo } from "@/lib/utils";

const SOURCE_ICONS: Record<string, LucideIcon> = {
  "DS-IDSR": Database,
  "DS-WHO": Globe,
  "DS-DHIS2": Building2,
};

export function DataSourcesTab() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {DATA_SOURCES.map((source) => {
        const Icon = SOURCE_ICONS[source.id] ?? Database;
        const dot = SOURCE_STATUS_STYLES[source.status].solid;
        return (
          <div
            key={source.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: dot }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: dot }}
                />
              </span>
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              {source.name}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {source.description}
            </p>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Connection</span>
                <SourceStatusBadge status={source.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last sync</span>
                <span className="font-semibold text-slate-700">
                  {timeAgo(source.lastSync)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Records</span>
                <span className="font-semibold tabular-nums text-slate-700">
                  {formatNumber(source.recordCount)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
