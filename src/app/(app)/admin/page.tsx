// Module: Admin Panel | Owner: System Admin / Platform Engineer
import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { getAuditLog, getDataSources, getPlatformUsers } from "@/lib/data";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const [users, sources, auditLog] = await Promise.all([
    getPlatformUsers(),
    getDataSources(),
    getAuditLog(),
  ]);
  return <AdminTabs users={users} sources={sources} auditLog={auditLog} />;
}
