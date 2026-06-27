// Module: Shared Layout — Top Navbar | Owner: Frontend Lead
"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { resolveNavItem } from "@/lib/nav";
import { OUTBREAK_ALERTS, PLATFORM_USERS } from "@/lib/mockData";
import { BRAND } from "@/lib/theme";

interface TopbarProps {
  onMenuClick: () => void;
}

// Unread = alerts that still need attention (not yet acknowledged or resolved).
const unreadCount = OUTBREAK_ALERTS.filter(
  (a) => a.status === "Active" || a.status === "Investigating",
).length;

// The signed-in user for this demo session.
const currentUser = PLATFORM_USERS[0];

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const nav = resolveNavItem(pathname);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
          {nav.title}
        </h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">
          {nav.description}
        </p>
      </div>

      {/* Notification bell */}
      <button
        type="button"
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        aria-label={`${unreadCount} unread alerts`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: BRAND.base }}
        >
          {initials(currentUser.name)}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {currentUser.name}
          </p>
          <p className="text-xs text-slate-500">{currentUser.role}</p>
        </div>
      </div>
    </header>
  );
}
