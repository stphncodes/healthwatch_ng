// Module: Registration Approvals (client-side) | Owner: Backend / Platform Engineer
// Data layer for the Admin's Pending Approvals tab. Runs ONLY in the browser —
// a deliberate exception to the server-component data flow: identity documents
// are NIN PII gated to the Admin by RLS, and the server fetches with the anon
// key, so this is the one path that must use the authenticated browser client
// (whose JWT satisfies the is_admin() policies).

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { MutationResult } from "@/lib/mutations";
import { DOCUMENTS_BUCKET } from "@/lib/auth";
import type { PendingApproval, PlatformUser, UserRole } from "@/types/health";

/** Signed document URLs stay valid this long; regenerated on every fetch. */
const SIGNED_URL_TTL_SECONDS = 600;

interface PendingProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  state: string | null;
  phone: string | null;
  active: boolean | null;
  last_active: string | null;
}

interface DocumentRow {
  user_id: string;
  nin: string | null;
  id_photo_path: string | null;
  submitted_at: string | null;
}

async function signedUrl(path: string | null): Promise<string> {
  if (!path) return "";
  const { data } = await getSupabase()
    .storage.from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? "";
}

/** All registrations awaiting review, with viewable document URLs. */
export async function getPendingApprovals(): Promise<PendingApproval[]> {
  // Local demo mode auto-approves signups (there is no admin without a
  // backend), so the queue is always empty.
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabase();
  const [{ data: profiles, error: profilesError }, { data: docs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, role, state, phone, active, last_active")
        .eq("approval_status", "pending")
        .order("last_active", { ascending: true })
        .returns<PendingProfileRow[]>(),
      // RLS trims this to nothing for anyone who isn't the Admin.
      supabase
        .from("identity_documents")
        .select("user_id, nin, id_photo_path, submitted_at")
        .returns<DocumentRow[]>(),
    ]);
  if (profilesError) throw new Error(profilesError.message);

  const docsById = new Map((docs ?? []).map((d) => [d.user_id, d]));
  return Promise.all(
    (profiles ?? []).map(async (row): Promise<PendingApproval> => {
      const doc = docsById.get(row.id);
      const user: PlatformUser = {
        id: row.id,
        name: row.name ?? "",
        email: row.email ?? "",
        role: (row.role ?? "Member") as UserRole,
        state: row.state ?? "",
        phone: row.phone ?? undefined,
        active: row.active ?? true,
        approvalStatus: "pending",
        lastActive: row.last_active ?? "",
      };
      const idPhotoUrl = await signedUrl(doc?.id_photo_path ?? null);
      return {
        user,
        nin: doc?.nin ?? "",
        idPhotoUrl,
        submittedAt: doc?.submitted_at ?? user.lastActive,
      };
    }),
  );
}

/** Approve or reject a pending registration (Admin only, enforced in the DB). */
export async function reviewUser(
  id: string,
  decision: "approved" | "rejected",
): Promise<MutationResult> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const { error } = await getSupabase().rpc("review_user", {
      target_id: id,
      decision,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
