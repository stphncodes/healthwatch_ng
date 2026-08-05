// Module: Admin Console Route | Owner: Platform Engineer
// Standalone admin area OUTSIDE the (app) route group: it has its own sign-in
// screen (AdminConsole) instead of the shared AppShell + AuthGuard, so the
// administrator goes straight to /admin and authenticates there.
import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";
import {
  getAuditLog,
  getDataSources,
  getOutbreakAlerts,
  getPlatformUsers,
  getStateRisks,
} from "@/lib/data";

// Data is fetched per-request so Supabase-backed views stay live.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Console" };

export default async function AdminPage() {
  const [users, alerts, risks, sources, auditLog] = await Promise.all([
    getPlatformUsers(),
    getOutbreakAlerts(),
    getStateRisks(),
    getDataSources(),
    getAuditLog(),
  ]);
  return (
    <AdminConsole
      users={users}
      alerts={alerts}
      risks={risks}
      sources={sources}
      auditLog={auditLog}
    />
  );
}
