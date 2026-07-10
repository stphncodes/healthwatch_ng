// Module: Ingestion Pipeline — Supabase Loader | Owner: Data Engineer
// Upserts each table with the SERVICE ROLE key (bypasses RLS — server-only).
// Upsert on the primary key makes the whole run idempotent: re-running
// `npm run ingest` refreshes rows in place rather than duplicating them.

import { createClient } from "@supabase/supabase-js";
import type { Dataset } from "./types";

/** Primary key column used as the upsert conflict target for each table. */
const PK: Record<keyof Dataset, string> = {
  state_risks: "id",
  outbreak_alerts: "id",
  weekly_case_trends: "week",
  data_sources: "id",
  audit_log: "id",
  forecast_points: "week",
  high_risk_lgas: "id",
  epi_reports: "epi_week",
};

export interface LoadResult {
  table: string;
  count: number;
  error?: string;
}

export async function loadDataset(
  url: string,
  serviceKey: string,
  dataset: Dataset,
): Promise<LoadResult[]> {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: LoadResult[] = [];
  for (const table of Object.keys(dataset) as (keyof Dataset)[]) {
    const rows = dataset[table] as unknown as Record<string, unknown>[];
    const { error } = await supabase
      .from(table)
      .upsert(rows, { onConflict: PK[table] });
    results.push({ table, count: rows.length, error: error?.message });
  }
  return results;
}
