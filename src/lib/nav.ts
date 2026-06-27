// Module: Navigation Config | Owner: Frontend Lead
// Single declaration of the dashboard's routes, shared by the sidebar (active
// link highlighting) and the top navbar (page title resolution).

import {
  Activity,
  BellRing,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Short label shown in the sidebar. */
  label: string;
  /** Full page title shown in the top navbar. */
  title: string;
  /** One-line description shown under the page title. */
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Surveillance",
    title: "Disease Surveillance Dashboard",
    description: "National outbreak monitoring at a glance",
    icon: Activity,
  },
  {
    href: "/alerts",
    label: "Outbreak Alerts",
    title: "Outbreak Alert Management",
    description: "Triage, investigate and acknowledge active alerts",
    icon: BellRing,
  },
  {
    href: "/admin",
    label: "Admin Panel",
    title: "Admin Panel",
    description: "Users, data sources and the system audit trail",
    icon: ShieldCheck,
  },
  {
    href: "/portal",
    label: "Officer Portal",
    title: "Public Health Officer Portal",
    description: "Forecasts, hotspots and weekly epi reporting",
    icon: ClipboardList,
  },
];

/** Resolve the active nav item for a given pathname. */
export function resolveNavItem(pathname: string): NavItem {
  return (
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? NAV_ITEMS[0]
  );
}
