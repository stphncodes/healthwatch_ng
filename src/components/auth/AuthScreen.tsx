// Module: Auth — Shared Screen Frame | Owner: Frontend Lead
// The split layout used by both /login and /signup: brand panel on the left
// (desktop), compact brand header on mobile, and the form column on the right.
"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BellRing,
  LineChart,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { BRAND } from "@/lib/theme";

const HIGHLIGHTS = [
  {
    icon: Radar,
    title: "National surveillance",
    text: "Live risk posture for all 36 states + the FCT",
  },
  {
    icon: BellRing,
    title: "Outbreak alert triage",
    text: "Investigate and acknowledge alerts as they fire",
  },
  {
    icon: LineChart,
    title: "Forecasting & reporting",
    text: "4-week forecasts and weekly epi reports",
  },
] as const;

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel (desktop only) */}
      <div
        className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{ backgroundColor: BRAND.ink }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg shadow-inner"
            style={{ backgroundColor: BRAND.base }}
          >
            <Activity className="h-6 w-6 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              HealthWatch NG
            </span>
            <span className="block text-xs font-medium text-emerald-200/80">
              Disease Surveillance Platform
            </span>
          </span>
        </div>

        <div className="max-w-md space-y-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            One control room for the national outbreak picture.
          </h2>
          <ul className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-emerald-300" />
                </span>
                <span className="leading-snug">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-emerald-100/70">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          <div className="leading-tight">
            <p className="text-xs font-semibold">NDPR 2019 Compliant</p>
            <p className="text-[11px] text-emerald-200/80">
              Data handled under NG regulation
            </p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* Compact brand header for mobile, where the panel is hidden */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: BRAND.base }}
            >
              <Activity className="h-5 w-5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-slate-900">
                HealthWatch NG
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Disease Surveillance Platform
              </span>
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
