// Module: Admin Panel — Alerts Tab | Owner: Platform Engineer
// Full CRUD over outbreak alerts. Writes go through src/lib/adminContent.ts
// (browser client, Admin-gated by RLS) with optimistic updates + revert.
"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Pencil, Plus, Siren, Trash2, X } from "lucide-react";
import type {
  AlertStatus,
  Disease,
  OutbreakAlert,
  RiskLevel,
} from "@/types/health";
import { deleteAlert, upsertAlert } from "@/lib/adminContent";
import { isSupabaseConfigured } from "@/lib/supabase";
import { NIGERIAN_STATES } from "@/lib/states";
import {
  DISEASE_COLORS,
  RISK_ORDER,
  RISK_STYLES,
  STATUS_STYLES,
} from "@/lib/theme";
import { formatNumber, timeAgo } from "@/lib/utils";
import { fieldClasses } from "@/components/auth/fieldStyles";
import { EmptyState } from "@/components/ui/EmptyState";

const DISEASES = Object.keys(DISEASE_COLORS) as Disease[];
const STATUSES = Object.keys(STATUS_STYLES) as AlertStatus[];

function emptyAlert(): OutbreakAlert {
  return {
    id: `AL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    disease: "Cholera",
    lga: "",
    state: "",
    risk: "Medium",
    caseCount: 0,
    triggeredAt: new Date().toISOString(),
    status: "Active",
    description: "",
    reportedBy: "Admin Console",
    contactsTraced: 0,
    fatalities: 0,
    detectionTimeHrs: 0,
  };
}

export function AlertsAdminTab({ alerts: initial }: { alerts: OutbreakAlert[] }) {
  const [alerts, setAlerts] = useState<OutbreakAlert[]>(initial);
  const [editing, setEditing] = useState<OutbreakAlert | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setIsNew(true);
    setEditing(emptyAlert());
  }

  function startEdit(alert: OutbreakAlert) {
    setIsNew(false);
    setEditing({ ...alert });
  }

  async function save(alert: OutbreakAlert) {
    setError(null);
    const previous = alerts;
    // Optimistic insert/replace, then persist; revert if the write fails.
    setAlerts((prev) => {
      const exists = prev.some((a) => a.id === alert.id);
      return exists
        ? prev.map((a) => (a.id === alert.id ? alert : a))
        : [alert, ...prev];
    });
    setEditing(null);
    const result = await upsertAlert(alert);
    if (!result.ok) {
      setAlerts(previous);
      setError(`Could not save alert ${alert.id}: ${result.error ?? "unknown error"}`);
    }
  }

  async function remove(alert: OutbreakAlert) {
    if (
      !window.confirm(
        `Delete alert ${alert.id} (${alert.disease} — ${alert.lga})? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    const previous = alerts;
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    const result = await deleteAlert(alert.id);
    if (!result.ok) {
      setAlerts(previous);
      setError(`Could not delete alert ${alert.id}: ${result.error ?? "unknown error"}`);
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Alerts shown on the dashboard and alerts page.
        </p>
        {isSupabaseConfigured ? (
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New alert
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            Connect Supabase to manage content.
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editing && (
        <AlertForm
          alert={editing}
          isNew={isNew}
          onCancel={() => setEditing(null)}
          onSave={(alert) => void save(alert)}
        />
      )}

      {alerts.length === 0 && !editing ? (
        <EmptyState
          icon={Siren}
          title="No outbreak alerts"
          hint="Alerts created here or ingested from the live pipeline will appear on the dashboard."
        />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Alert</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold">Cases</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Triggered</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{alert.disease}</p>
                    <p className="text-xs text-slate-500">{alert.id}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {alert.lga}
                    {alert.state ? `, ${alert.state}` : ""}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: RISK_STYLES[alert.risk].bg,
                        color: RISK_STYLES[alert.risk].fg,
                      }}
                    >
                      {alert.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-600">
                    {formatNumber(alert.caseCount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: STATUS_STYLES[alert.status].bg,
                        color: STATUS_STYLES[alert.status].fg,
                      }}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {timeAgo(alert.triggeredAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    {isSupabaseConfigured && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(alert)}
                          aria-label={`Edit alert ${alert.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(alert)}
                          aria-label={`Delete alert ${alert.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AlertForm({
  alert: initial,
  isNew,
  onCancel,
  onSave,
}: {
  alert: OutbreakAlert;
  isNew: boolean;
  onCancel: () => void;
  onSave: (alert: OutbreakAlert) => void;
}) {
  const [alert, setAlert] = useState<OutbreakAlert>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  function set<K extends keyof OutbreakAlert>(key: K, value: OutbreakAlert[K]) {
    setAlert((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alert.lga.trim() || !alert.state) {
      setFormError("Enter the LGA and select the state.");
      return;
    }
    onSave({ ...alert, lga: alert.lga.trim(), description: alert.description.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          {isNew ? "New alert" : `Edit ${alert.id}`}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel editing"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {formError && (
        <p className="mt-2 text-xs text-red-600">{formError}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Disease
          <select
            value={alert.disease}
            onChange={(e) => set("disease", e.target.value as Disease)}
            className={fieldClasses(false)}
          >
            {DISEASES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          State
          <select
            value={alert.state}
            onChange={(e) => set("state", e.target.value)}
            className={fieldClasses(false, alert.state ? "" : "text-slate-400")}
          >
            <option value="" disabled>
              Select a state
            </option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state.code} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          LGA
          <input
            type="text"
            value={alert.lga}
            onChange={(e) => set("lga", e.target.value)}
            placeholder="e.g. Maiduguri"
            className={fieldClasses(false)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Risk level
          <select
            value={alert.risk}
            onChange={(e) => set("risk", e.target.value as RiskLevel)}
            className={fieldClasses(false)}
          >
            {RISK_ORDER.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            value={alert.status}
            onChange={(e) => set("status", e.target.value as AlertStatus)}
            className={fieldClasses(false)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Case count
          <input
            type="number"
            min={0}
            value={alert.caseCount}
            onChange={(e) => set("caseCount", Math.max(0, Number(e.target.value) || 0))}
            className={fieldClasses(false)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Fatalities
          <input
            type="number"
            min={0}
            value={alert.fatalities}
            onChange={(e) => set("fatalities", Math.max(0, Number(e.target.value) || 0))}
            className={fieldClasses(false)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Contacts traced
          <input
            type="number"
            min={0}
            value={alert.contactsTraced}
            onChange={(e) =>
              set("contactsTraced", Math.max(0, Number(e.target.value) || 0))
            }
            className={fieldClasses(false)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Detection time (hrs)
          <input
            type="number"
            min={0}
            value={alert.detectionTimeHrs}
            onChange={(e) =>
              set("detectionTimeHrs", Math.max(0, Number(e.target.value) || 0))
            }
            className={fieldClasses(false)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Description
        <textarea
          rows={2}
          value={alert.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Summary of the outbreak signal…"
          className={fieldClasses(false)}
        />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {isNew ? "Create alert" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
