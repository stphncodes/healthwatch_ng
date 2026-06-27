// Module: Outbreak Alert Management — Detail Drawer | Owner: Backend / Platform Engineer
"use client";

import { useEffect, type ReactNode } from "react";
import {
  CheckCircle2,
  CalendarClock,
  MapPin,
  Skull,
  Timer,
  Users,
  X,
} from "lucide-react";
import type { OutbreakAlert } from "@/types/health";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDateTime, formatNumber } from "@/lib/utils";

interface AlertDrawerProps {
  alert: OutbreakAlert | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}

function Field({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function AlertDrawer({ alert, onClose, onAcknowledge }: AlertDrawerProps) {
  const open = alert !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canAcknowledge =
    alert?.status === "Active" || alert?.status === "Investigating";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Alert details"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {alert && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={alert.risk} />
                  <StatusBadge status={alert.status} />
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {alert.disease}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {alert.lga}, {alert.state} · {alert.id}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 scrollbar-thin">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Situation summary
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {alert.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Reported cases"
                  value={formatNumber(alert.caseCount)}
                />
                <Field
                  icon={<Skull className="h-3.5 w-3.5" />}
                  label="Fatalities"
                  value={formatNumber(alert.fatalities)}
                />
                <Field
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Contacts traced"
                  value={formatNumber(alert.contactsTraced)}
                />
                <Field
                  icon={<Timer className="h-3.5 w-3.5" />}
                  label="Detection time"
                  value={`${alert.detectionTimeHrs}h`}
                />
                <Field
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Reported by"
                  value={alert.reportedBy}
                />
                <Field
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label="Triggered"
                  value={formatDateTime(alert.triggeredAt)}
                />
              </div>
            </div>

            {/* Footer action */}
            <div className="border-t border-slate-200 px-6 py-4">
              {canAcknowledge ? (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledge alert
                </button>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {alert.status === "Acknowledged"
                    ? "Alert acknowledged"
                    : "Alert resolved — no action needed"}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
