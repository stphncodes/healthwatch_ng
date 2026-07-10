// Module: Shared Utilities | Owner: Frontend Lead
// Small, dependency-light helpers used across the UI layer.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and de-duplicate conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators (en-NG locale). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
}

/**
 * Render a compact "time ago" string relative to {@link now}.
 * `now` is injected so the function stays pure and testable.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

/**
 * Period-over-period change as a signed percentage + direction, for the
 * dashboard stat cards. Returns an empty delta / "flat" trend when there's no
 * prior-period baseline to compare against. "up" means the metric rose (which
 * StatCard renders red — an increase in cases/outbreaks/detection time is bad).
 */
export function periodDelta(
  current: number,
  previous: number,
): { delta: string; trend: "up" | "down" | "flat" } {
  if (previous <= 0) return { delta: "", trend: "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { delta: "0%", trend: "flat" };
  return { delta: `${pct > 0 ? "+" : ""}${pct}%`, trend: pct > 0 ? "up" : "down" };
}

/** Format an ISO timestamp as a readable date, e.g. "27 Jun 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO timestamp as date + time, e.g. "27 Jun 2026, 14:32". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
