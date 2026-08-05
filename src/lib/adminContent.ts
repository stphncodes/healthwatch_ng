// Module: Admin Content Editing (client-side) | Owner: Backend / Platform Engineer
// Write layer for the Admin Console's content tabs (alerts, state risks, data
// sources). Runs ONLY in the browser — the same documented exception to the
// server-component data flow as src/lib/approvals.ts: these writes need the
// signed-in Admin's JWT so the "Admin manage …" RLS policies in
// supabase/schema.sql apply; the server fetch path only carries the anon key.
// RLS is the enforcement — this layer is UX. In local demo mode every call
// no-ops successfully so optimistic UI still works.

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MutationResult } from "@/lib/mutations";
import type { DataSource, OutbreakAlert, StateRisk } from "@/types/health";

function fail(err: unknown): MutationResult {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

function result(error: { message: string } | null): MutationResult {
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Create or update an outbreak alert. */
export async function upsertAlert(alert: OutbreakAlert): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase().from("outbreak_alerts").upsert({
      id: alert.id,
      disease: alert.disease,
      lga: alert.lga,
      state: alert.state,
      risk: alert.risk,
      case_count: alert.caseCount,
      triggered_at: alert.triggeredAt,
      status: alert.status,
      description: alert.description,
      reported_by: alert.reportedBy,
      contacts_traced: alert.contactsTraced,
      fatalities: alert.fatalities,
      detection_time_hrs: alert.detectionTimeHrs,
    });
    return result(error);
  } catch (err) {
    return fail(err);
  }
}

/** Delete an outbreak alert. */
export async function deleteAlert(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase()
      .from("outbreak_alerts")
      .delete()
      .eq("id", id);
    return result(error);
  } catch (err) {
    return fail(err);
  }
}

/** Update a state's surveillance posture (rows are fixed — edit only). */
export async function updateStateRisk(risk: StateRisk): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase()
      .from("state_risks")
      .update({
        risk: risk.risk,
        active_cases: risk.activeCases,
        dominant_disease: risk.dominantDisease,
      })
      .eq("id", risk.id);
    return result(error);
  } catch (err) {
    return fail(err);
  }
}

/** Create or update an upstream data source entry. */
export async function upsertDataSource(
  source: DataSource,
): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase().from("data_sources").upsert({
      id: source.id,
      name: source.name,
      description: source.description,
      status: source.status,
      last_sync: source.lastSync,
      record_count: source.recordCount,
    });
    return result(error);
  } catch (err) {
    return fail(err);
  }
}

/** Delete an upstream data source entry. */
export async function deleteDataSource(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase()
      .from("data_sources")
      .delete()
      .eq("id", id);
    return result(error);
  } catch (err) {
    return fail(err);
  }
}
