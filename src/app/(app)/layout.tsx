// Module: Dashboard Route-Group Layout | Owner: Frontend Lead
// Wraps every authenticated dashboard page (/dashboard, /alerts, /admin,
// /portal) in the shared sidebar + top navbar shell.
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
