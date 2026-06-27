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
import { EPI_REPORT } from "@/lib/mockData";
import { formatNumber } from "@/lib/utils";

interface Figure {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}

const FIGURES: Figure[] = [
  {
    icon: Activity,
    label: "Total cases reported",
    value: formatNumber(EPI_REPORT.totalCasesReported),
    accent: "#006B3F",
  },
  {
    icon: Siren,
    label: "New outbreaks",
    value: String(EPI_REPORT.newOutbreaks),
    accent: "#DC2626",
  },
  {
    icon: Microscope,
    label: "Under investigation",
    value: String(EPI_REPORT.underInvestigation),
    accent: "#D97706",
  },
  {
    icon: MapPin,
    label: "States reporting",
    value: `${EPI_REPORT.statesReporting} / 37`,
    accent: "#2563EB",
  },
  {
    icon: HeartPulse,
    label: "Recovery rate",
    value: `${EPI_REPORT.recoveryRate}%`,
    accent: "#059669",
  },
  {
    icon: TriangleAlert,
    label: "Case fatality rate",
    value: `${EPI_REPORT.caseFatalityRate}%`,
    accent: "#7C3AED",
  },
];

export function EpiReportCard() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FIGURES.map((f) => {
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
