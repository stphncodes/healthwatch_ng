// Module: Admin API — Live Data Refresh | Owner: Data Engineer / Backend Lead
// POST /api/admin/refresh-data — runs the WHO/HDX ingest pipeline server-side
// with the service-role key. The server has no cookie session (reads are
// anonymous), so the browser forwards its access token in the Authorization
// header; the caller must resolve to an approved, active Admin profile before
// anything runs. The seed-file writer stays CLI-only (routes cannot write to
// the repo in production).

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchCholeraSnapshot } from "../../../../../scripts/ingest/sources/whoCholera";
import { baselineSnapshot } from "../../../../../scripts/ingest/baseline";
import { buildDataset } from "../../../../../scripts/ingest/transform";
import { loadDataset } from "../../../../../scripts/ingest/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The WHO fetch retries can take tens of seconds.
export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Live refresh is not configured — set SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing access token." },
      { status: 401 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session." },
      { status: 401 },
    );
  }

  // The profile row is the source of truth for the role — the service client
  // bypasses RLS, so this check is the real gate.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, approval_status, active")
    .eq("id", userData.user.id)
    .maybeSingle<{
      role: string | null;
      approval_status: string | null;
      active: boolean | null;
    }>();
  if (
    !profile ||
    profile.role !== "Admin" ||
    profile.approval_status !== "approved" ||
    profile.active === false
  ) {
    return NextResponse.json(
      { ok: false, error: "Only the administrator may refresh live data." },
      { status: 403 },
    );
  }

  try {
    let snapshot;
    try {
      snapshot = await fetchCholeraSnapshot();
    } catch {
      snapshot = baselineSnapshot();
    }
    const now = new Date();
    const { dataset } = buildDataset(snapshot, now);
    const results = await loadDataset(url, serviceKey, dataset);
    const failed = results.filter((r) => r.error);
    return NextResponse.json({
      ok: failed.length === 0,
      live: snapshot.live,
      source: snapshot.source,
      generatedAt: now.toISOString(),
      results,
      ...(failed.length > 0 && {
        error: `${failed.length} table(s) failed to load.`,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Ingest failed.",
      },
      { status: 500 },
    );
  }
}
