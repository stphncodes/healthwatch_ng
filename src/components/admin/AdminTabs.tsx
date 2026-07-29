// Module: Admin Panel — Tab Switcher | Owner: System Admin / Platform Engineer
"use client";

import { useState } from "react";
import {
  Database,
  ScrollText,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AuditEntry,
  DataSource,
  PlatformUser,
} from "@/types/health";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/auth/AuthProvider";
import { APPROVER_ROLES } from "@/lib/roles";
import { UsersTab } from "./UsersTab";
import { DataSourcesTab } from "./DataSourcesTab";
import { AuditLogTab } from "./AuditLogTab";
import { PendingApprovalsTab } from "./PendingApprovalsTab";

type TabId = "approvals" | "users" | "sources" | "audit";

const BASE_TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "sources", label: "Data Sources", icon: Database },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

interface AdminTabsProps {
  users: PlatformUser[];
  sources: DataSource[];
  auditLog: AuditEntry[];
}

export function AdminTabs({ users, sources, auditLog }: AdminTabsProps) {
  const { user } = useAuth();
  // Only Super Admins review registrations; System Admins keep the base tabs.
  const canReview = user !== null && APPROVER_ROLES.includes(user.role);
  const tabs = canReview
    ? [
        {
          id: "approvals" as TabId,
          label: "Pending Approvals",
          icon: UserCheck,
        },
        ...BASE_TABS,
      ]
    : BASE_TABS;
  const [active, setActive] = useState<TabId>("users");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === "approvals" && canReview && (
        <Card>
          <PendingApprovalsTab />
        </Card>
      )}
      {active === "users" && (
        <Card>
          {/* Pending users live in the approvals queue, not the users table. */}
          <UsersTab users={users.filter((u) => u.approvalStatus !== "pending")} />
        </Card>
      )}
      {active === "sources" && <DataSourcesTab sources={sources} />}
      {active === "audit" && (
        <Card>
          <AuditLogTab entries={auditLog} />
        </Card>
      )}
    </div>
  );
}
