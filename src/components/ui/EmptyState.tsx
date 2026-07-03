// Module: UI Primitives — Empty State | Owner: Frontend Lead
// Shown wherever a dataset has no rows yet — the default for a fresh install
// until Supabase is connected and populated (see supabase/schema.sql).

import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint = "Connect Supabase and load surveillance data to populate this view.",
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </span>
      <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
      <p className="max-w-xs text-xs text-slate-500">{hint}</p>
    </div>
  );
}
