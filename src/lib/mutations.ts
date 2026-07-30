// Module: Data Mutations | Owner: Backend / Platform Engineer
// The write counterpart to the read-only getters in src/lib/data.ts. These run
// client-side through the browser Supabase client, which carries the signed-in
// user's JWT, so the `to authenticated` RLS policies in supabase/schema.sql
// apply. In local demo mode (Supabase not configured) they no-op successfully
// so the optimistic in-session UI still works.

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export interface MutationResult {
  ok: boolean;
  error?: string;
}

function fail(err: unknown): MutationResult {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

/** Persist an alert acknowledgement (status → "Acknowledged"). Goes through
 * the acknowledge_alert() RPC: direct alert writes are Admin-only by RLS,
 * but any signed-in officer may acknowledge. */
export async function acknowledgeAlert(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase().rpc("acknowledge_alert", {
      alert_id: id,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/** Persist a platform user's active state (admin-only per RLS). */
export async function setUserActive(
  id: string,
  active: boolean,
): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase()
      .from("profiles")
      .update({ active })
      .eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    return fail(err);
  }
}
