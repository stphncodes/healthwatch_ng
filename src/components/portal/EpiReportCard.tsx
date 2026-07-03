// Module: Public Health Officer Portal — Weekly Epi Report | Owner: Health Officer / Epidemiologist

import {
  Activity,
  HeartPulse,
  Microscope,
  Siren,
  TriangleAlert,
  MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EpiReportSummary } from "@/types/health";
import { formatNumber } from "@/lib/utils";

interface Figure {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}

function buildFigures(report: EpiReportSummary): Figure[] {
  return [
    {
      icon: Activity,
      label: "Total cases reported",
      value: formatNumber(report.totalCasesReported),
      accent: "#006B3F",
    },
    {
      icon: Siren,
      label: "New outbreaks",
      value: String(report.newOutbreaks),
      accent: "#DC2626",
    },
    {
      icon: Microscope,
      label: "Under investigation",
      value: String(report.underInvestigation),
      accent: "#D97706",
    },
    {
      icon: MapPin,
      label: "States reporting",
      value: `${report.statesReporting} / 37`,
      accent: "#2563EB",
    },
    {
      icon: HeartPulse,
      label: "Recovery rate",
      value: `${report.recoveryRate}%`,
      accent: "#059669",
    },
    {
      icon: TriangleAlert,
      label: "Case fatality rate",
      value: `${report.caseFatalityRate}%`,
      accent: "#7C3AED",
    },
  ];
}

export function EpiReportCard({ report }: { report: EpiReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {buildFigures(report).map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${f.accent}1a`, color: f.accent }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {f.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {f.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
