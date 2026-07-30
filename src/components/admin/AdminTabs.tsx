// Module: Admin Panel — Tab Switcher | Owner: Platform Engineer
"use client";

import { useState } from "react";
import {
  Database,
  Map,
  ScrollText,
  Siren,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AuditEntry,
  DataSource,
  OutbreakAlert,
  PlatformUser,
  StateRisk,
} from "@/types/health";
import { Card } from "@/components/ui/Card";
import { UsersTab } from "./UsersTab";
import { DataSourcesTab } from "./DataSourcesTab";
import { AuditLogTab } from "./AuditLogTab";
import { PendingApprovalsTab } from "./PendingApprovalsTab";
import { AlertsAdminTab } from "./AlertsAdminTab";
import { StateRisksAdminTab } from "./StateRisksAdminTab";

type TabId = "approvals" | "users" | "alerts" | "risks" | "sources" | "audit";

// Everyone past the AdminConsole gate is THE admin — every tab is visible.
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "approvals", label: "Pending Approvals", icon: UserCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "alerts", label: "Alerts", icon: Siren },
  { id: "risks", label: "State Risks", icon: Map },
  { id: "sources", label: "Data Sources", icon: Database },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

interface AdminTabsProps {
  users: PlatformUser[];
  alerts: OutbreakAlert[];
  risks: StateRisk[];
  sources: DataSource[];
  auditLog: AuditEntry[];
}

export function AdminTabs({
  users,
  alerts,
  risks,
  sources,
  auditLog,
}: AdminTabsProps) {
  const [active, setActive] = useState<TabId>("approvals");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-thin">
        {TABS.map((tab) => {
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

      {active === "approvals" && (
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
      {active === "alerts" && (
        <Card>
          <AlertsAdminTab alerts={alerts} />
        </Card>
      )}
      {active === "risks" && (
        <Card>
          <StateRisksAdminTab risks={risks} />
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
