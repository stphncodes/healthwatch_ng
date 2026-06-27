// Module: Admin Panel | Owner: System Admin / Platform Engineer
import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const metadata: Metadata = { title: "Admin Panel" };

export default function AdminPage() {
  return <AdminTabs />;
}
