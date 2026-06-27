// Module: Public Health Officer Portal — Report Download | Owner: Health Officer
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { EPI_REPORT } from "@/lib/mockData";

export function DownloadReportButton() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowToast(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
      >
        <Download className="h-4 w-4" />
        Download Report
      </button>

      {/* Mock toast notification */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg transition-all duration-300 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-800">
            Report generated
          </p>
          <p className="text-xs text-slate-500">
            HealthWatch NG · Weekly Bulletin {EPI_REPORT.epiWeek} (PDF)
          </p>
        </div>
      </div>
    </>
  );
}
