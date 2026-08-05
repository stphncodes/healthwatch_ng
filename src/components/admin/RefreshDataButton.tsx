// Module: Admin Panel — Live Data Refresh Button | Owner: Data Engineer
// Triggers the WHO/HDX ingest pipeline via POST /api/admin/refresh-data,
// forwarding the Admin's access token for server-side verification. On
// success the router refreshes so server-fetched props re-render.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

interface RefreshResponse {
  ok: boolean;
  live?: boolean;
  source?: string;
  results?: { table: string; count: number; error?: string }[];
  error?: string;
}

export function RefreshDataButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) return null;

  async function refresh() {
    setBusy(true);
    setSummary(null);
    setError(null);
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Your session has expired — sign in again.");
        return;
      }
      const response = await fetch("/api/admin/refresh-data", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await response.json()) as RefreshResponse;
      if (!response.ok || !body.ok) {
        setError(body.error ?? `Refresh failed (HTTP ${response.status}).`);
        return;
      }
      const rows = (body.results ?? []).reduce((sum, r) => sum + r.count, 0);
      const failures = (body.results ?? []).filter((r) => r.error);
      setSummary(
        `${body.live ? "Live" : "Baseline"} data loaded — ${rows} rows across ${
          body.results?.length ?? 0
        } tables${failures.length ? ` (${failures.length} table(s) failed)` : ""}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Refreshing from WHO/HDX…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Refresh live data
          </>
        )}
      </button>
      {busy && (
        <p className="text-xs text-slate-400">This can take up to a minute.</p>
      )}
      {summary && <p className="text-xs text-emerald-600">{summary}</p>}
      {error && (
        <p className="inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
