// Module: Shared Layout — Sidebar | Owner: Frontend Lead
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ShieldCheck, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Whether the mobile drawer is open. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-white transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundColor: BRAND.ink }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg shadow-inner"
              style={{ backgroundColor: BRAND.base }}
            >
              <Activity className="h-5 w-5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight">
                HealthWatch NG
              </span>
              <span className="block text-[11px] font-medium text-emerald-200/80">
                Disease Surveillance Platform
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-emerald-100/80 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-emerald-100/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-white" : "text-emerald-200/70",
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* NDPR compliance badge */}
        <div className="px-3 pb-5 pt-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <div className="leading-tight">
              <p className="text-xs font-semibold text-white">
                NDPR 2019 Compliant
              </p>
              <p className="text-[11px] text-emerald-200/80">
                Data handled under NG regulation
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
