// Module: Admin Panel — State Risks Tab | Owner: Platform Engineer
// Edit-only view over the 36 states + FCT surveillance postures: risk level,
// active cases and dominant disease per row. The rows themselves are fixed
// geographic facts — no create/delete. Writes go through
// src/lib/adminContent.ts (browser client, Admin-gated by RLS).
"use client";

import { useState } from "react";
import { AlertCircle, Check, Map, Pencil, X } from "lucide-react";
import type { Disease, RiskLevel, StateRisk } from "@/types/health";
import { updateStateRisk } from "@/lib/adminContent";
import { isSupabaseConfigured } from "@/lib/supabase";
import { DISEASE_COLORS, RISK_ORDER, RISK_STYLES } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";
import { fieldClasses } from "@/components/auth/fieldStyles";
import { EmptyState } from "@/components/ui/EmptyState";

const DISEASES = Object.keys(DISEASE_COLORS) as Disease[];

export function StateRisksAdminTab({ risks: initial }: { risks: StateRisk[] }) {
  const [risks, setRisks] = useState<StateRisk[]>(initial);
  const [editing, setEditing] = useState<StateRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    const draft = editing;
    setError(null);
    setEditing(null);
    const previous = risks;
    // Optimistic update, then persist; revert if the write fails.
    setRisks((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    const result = await updateStateRisk(draft);
    if (!result.ok) {
      setRisks(previous);
      setError(`Could not update ${draft.name}: ${result.error ?? "unknown error"}`);
    }
  }

  if (risks.length === 0) {
    return (
      <EmptyState
        icon={Map}
        title="No state risk data"
        hint="Run the ingest pipeline or the seed script to populate the 36 states + FCT."
      />
    );
  }

  return (
    <div className="space-y-4 p-5">
      <p className="text-sm text-slate-500">
        Surveillance posture per state — feeds the dashboard risk grid.
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Risk level</th>
              <th className="px-4 py-3 font-semibold">Active cases</th>
              <th className="px-4 py-3 font-semibold">Dominant disease</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((risk) => {
              const isEditing = editing?.id === risk.id;
              const row = isEditing ? editing : risk;
              return (
                <tr key={risk.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{risk.name}</p>
                    <p className="text-xs text-slate-500">{risk.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={row.risk}
                        onChange={(e) =>
                          setEditing({ ...row, risk: e.target.value as RiskLevel })
                        }
                        aria-label={`${risk.name} risk level`}
                        className={fieldClasses(false, "mt-0 w-32 py-1.5")}
                      >
                        {RISK_ORDER.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: RISK_STYLES[row.risk].bg,
                          color: RISK_STYLES[row.risk].fg,
                        }}
                      >
                        {row.risk}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={row.activeCases}
                        onChange={(e) =>
                          setEditing({
                            ...row,
                            activeCases: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        aria-label={`${risk.name} active cases`}
                        className={fieldClasses(false, "mt-0 w-28 py-1.5")}
                      />
                    ) : (
                      formatNumber(row.activeCases)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {isEditing ? (
                      <select
                        value={row.dominantDisease}
                        onChange={(e) =>
                          setEditing({
                            ...row,
                            dominantDisease: e.target.value as Disease,
                          })
                        }
                        aria-label={`${risk.name} dominant disease`}
                        className={fieldClasses(false, "mt-0 w-52 py-1.5")}
                      >
                        {DISEASES.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      row.dominantDisease
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSupabaseConfigured && (
                      <div className="flex justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void save()}
                              aria-label={`Save ${risk.name}`}
                              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              aria-label={`Cancel editing ${risk.name}`}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ ...risk })}
                            aria-label={`Edit ${risk.name}`}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
