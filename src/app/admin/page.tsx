// Module: Admin Console Route | Owner: System Admin / Platform Engineer
// Standalone admin area OUTSIDE the (app) route group: it has its own sign-in
// screen (AdminConsole) instead of the shared AppShell + AuthGuard, so
// administrators go straight to /admin and authenticate there.
import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { getAuditLog, getDataSources, getPlatformUsers } from "@/lib/data";

// Data is fetched per-request so Supabase-backed views stay live.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Console" };

export default async function AdminPage() {
  const [users, sources, auditLog] = await Promise.all([
    getPlatformUsers(),
    getDataSources(),
    getAuditLog(),
  ]);
  return <AdminConsole users={users} sources={sources} auditLog={auditLog} />;
}
