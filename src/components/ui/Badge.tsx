// Module: UI Primitives — Badges | Owner: Frontend Lead
// Colour-coded pills for risk levels, alert statuses and data-source health.

import type { AlertStatus, RiskLevel, SourceStatus } from "@/types/health";
import {
  RISK_STYLES,
  SOURCE_STATUS_STYLES,
  STATUS_STYLES,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

interface PillProps {
  bg: string;
  fg: string;
  solid: string;
  label: string;
  withDot?: boolean;
  className?: string;
}

function Pill({ bg, fg, solid, label, withDot, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {withDot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: solid }}
        />
      )}
      {label}
    </span>
  );
}

export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  const s = RISK_STYLES[risk];
  return <Pill {...s} label={risk} withDot className={className} />;
}

export function StatusBadge({
  status,
  className,
}: {
  status: AlertStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return <Pill {...s} label={status} withDot className={className} />;
}

export function SourceStatusBadge({
  status,
  className,
}: {
  status: SourceStatus;
  className?: string;
}) {
  const s = SOURCE_STATUS_STYLES[status];
  return <Pill {...s} label={status} withDot className={className} />;
}
