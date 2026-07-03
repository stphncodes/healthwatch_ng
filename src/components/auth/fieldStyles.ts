// Module: Auth — Shared Field Styles | Owner: Frontend Lead
// One source for the text-input/select look on the login and signup forms.
import { cn } from "@/lib/utils";

export function fieldClasses(invalid: boolean, extra?: string): string {
  return cn(
    "mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:ring-2",
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-300 focus:border-brand focus:ring-brand/15",
    extra,
  );
}
