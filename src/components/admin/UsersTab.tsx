// Module: Admin Panel — Users Tab | Owner: System Admin / Platform Engineer
"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { PlatformUser } from "@/types/health";
import { setUserActive } from "@/lib/mutations";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleBadge } from "./RoleBadge";

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-brand" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function UsersTab({ users: initialUsers }: { users: PlatformUser[] }) {
  const [users, setUsers] = useState<PlatformUser[]>(initialUsers);

  async function toggle(id: string) {
    const current = users.find((u) => u.id === id);
    if (!current) return;
    const next = !current.active;
    // Optimistic update, then persist; revert if the write fails.
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: next } : u)),
    );
    const result = await setUserActive(id, next);
    if (!result.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: current.active } : u)),
      );
      console.error(`[admin] failed to update ${id}: ${result.error}`);
    }
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No platform users yet"
        hint="Accounts created on the signup page will appear here once Supabase is connected."
      />
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">User</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">State</th>
            <th className="px-5 py-3 font-semibold">Last active</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </td>
              <td className="px-5 py-3.5">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-5 py-3.5 text-slate-600">{user.state}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                {timeAgo(user.lastActive)}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Toggle
                    on={user.active}
                    onClick={() => toggle(user.id)}
                    label={`Toggle ${user.name} active state`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      user.active ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
