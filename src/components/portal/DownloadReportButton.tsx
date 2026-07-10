// Module: Public Health Officer Portal — Report Download | Owner: Health Officer
// Generates a real one-page PDF bulletin from the epi report figures using
// jsPDF (client-side, no server round-trip).
"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { CheckCircle2, Download } from "lucide-react";
import type { EpiReportSummary } from "@/types/health";

function buildPdf(report: EpiReportSummary): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  // Brand header bar.
  doc.setFillColor(0, 107, 63); // BRAND.base
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HealthWatch NG", margin, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Weekly Epidemiological Bulletin", margin, 66);
  y = 128;

  // Report period.
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(report.epiWeek, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(report.periodLabel, margin, y + 18);
  y += 52;

  // Figures table.
  const rows: [string, string][] = [
    ["Total cases reported", report.totalCasesReported.toLocaleString()],
    ["New outbreaks", String(report.newOutbreaks)],
    ["Under investigation", String(report.underInvestigation)],
    ["States reporting", `${report.statesReporting} / 37`],
    ["Recovery rate", `${report.recoveryRate}%`],
    ["Case fatality rate", `${report.caseFatalityRate}%`],
  ];
  doc.setFontSize(12);
  for (const [label, value] of rows) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 34;
  }

  // Footer.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated ${new Date().toLocaleString("en-GB")} · HealthWatch NG · NDPR 2019 compliant`,
    margin,
    doc.internal.pageSize.getHeight() - 40,
  );
  return doc;
}

export function DownloadReportButton({
  report,
}: {
  report: EpiReportSummary;
}) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showToast]);

  function handleDownload() {
    const doc = buildPdf(report);
    const slug = report.epiWeek.replace(/\s+/g, "-").toLowerCase();
    doc.save(`healthwatch-bulletin-${slug}.pdf`);
    setShowToast(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
      >
        <Download className="h-4 w-4" />
        Download Report
      </button>

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
            Bulletin downloaded
          </p>
          <p className="text-xs text-slate-500">
            HealthWatch NG · {report.epiWeek} (PDF)
          </p>
        </div>
      </div>
    </>
  );
}
