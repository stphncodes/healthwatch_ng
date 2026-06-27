// Module: Admin Panel — Tab Switcher | Owner: System Admin / Platform Engineer
"use client";

import { useState } from "react";
import { Database, ScrollText, Users, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { UsersTab } from "./UsersTab";
import { DataSourcesTab } from "./DataSourcesTab";
import { AuditLogTab } from "./AuditLogTab";

type TabId = "users" | "sources" | "audit";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "sources", label: "Data Sources", icon: Database },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

export function AdminTabs() {
  const [active, setActive] = useState<TabId>("users");

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

      {active === "users" && (
        <Card>
          <UsersTab />
        </Card>
      )}
      {active === "sources" && <DataSourcesTab />}
      {active === "audit" && (
        <Card>
          <AuditLogTab />
        </Card>
      )}
    </div>
  );
}
