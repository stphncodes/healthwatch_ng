// Module: Shared Layout — Top Navbar | Owner: Frontend Lead
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Bell, LogOut, Menu } from "lucide-react";
import type { OutbreakAlert } from "@/types/health";
import { useAuth } from "@/components/auth/AuthProvider";
import { RiskBadge } from "@/components/ui/Badge";
import { resolveNavItem } from "@/lib/nav";
import { BRAND } from "@/lib/theme";
import { timeAgo } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
  /** Alerts that still need attention (not yet acknowledged or resolved). */
  unreadCount: number;
  /** Newest few unread alerts, shown in the notification dropdown. */
  unreadAlerts: OutbreakAlert[];
}

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  onMenuClick,
  unreadCount,
  unreadAlerts,
}: TopbarProps) {
  const pathname = usePathname();
  const nav = resolveNavItem(pathname);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close the notification dropdown on outside-click or Escape.
  useEffect(() => {
    if (!bellOpen) return;
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBellOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  function handleSignOut() {
    logout();
    router.replace("/login");
  }

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

      {/* Notification bell + dropdown */}
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={() => setBellOpen((o) => !o)}
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
          aria-label={`${unreadCount} unread alerts`}
          aria-haspopup="true"
          aria-expanded={bellOpen}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Unread alerts
              </p>
              <span className="text-xs font-medium text-slate-400">
                {unreadCount} needing attention
              </span>
            </div>

            {unreadAlerts.length > 0 ? (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto scrollbar-thin">
                {unreadAlerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href="/alerts"
                      onClick={() => setBellOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {alert.disease}
                          </p>
                          <RiskBadge risk={alert.risk} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {alert.lga}, {alert.state}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-400">
                        {timeAgo(alert.triggeredAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                No unread alerts
              </p>
            )}

            <Link
              href="/alerts"
              onClick={() => setBellOpen(false)}
              className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-brand hover:bg-slate-50"
            >
              View all alerts
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Signed-in user + sign out */}
      {user && (
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: BRAND.base }}
          >
            {initials(user.name)}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
