// Module: Dashboard Route-Group Layout | Owner: Frontend Lead
// Wraps every authenticated dashboard page (/dashboard, /alerts, /admin,
// /portal) in the auth guard and the shared sidebar + top navbar shell.
import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { getOutbreakAlerts } from "@/lib/data";

// Data is fetched per-request so Supabase-backed views stay live.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const alerts = await getOutbreakAlerts();
  const unread = alerts.filter(
    (a) => a.status === "Active" || a.status === "Investigating",
  );

  return (
    <AuthGuard>
      <AppShell unreadCount={unread.length} unreadAlerts={unread.slice(0, 6)}>
        {children}
      </AppShell>
    </AuthGuard>
  );
}
