// Module: Design Tokens | Owner: Frontend Lead / Design Systems
// Single source of truth for the colour mappings that must be applied at runtime
// from data values (risk levels, statuses, diseases). Tailwind cannot generate
// classes from dynamic strings, so these are consumed as inline styles.

import type {
  AlertStatus,
  Disease,
  RiskLevel,
  SourceStatus,
  UserRole,
} from "@/types/health";

/** Nigerian-green brand palette. */
export const BRAND = {
  base: "#006B3F",
  dark: "#00543159",
  ink: "#003D24",
  tint: "#E6F2EC",
} as const;

interface SwatchStyle {
  /** Solid colour for dots, strokes and bold fills. */
  solid: string;
  /** Soft background tint for badges and cards. */
  bg: string;
  /** Readable text/border colour that pairs with {@link bg}. */
  fg: string;
}

/** Official risk-level palette from the HealthWatch NG design system. */
export const RISK_STYLES: Record<RiskLevel, SwatchStyle> = {
  Low: { solid: "#059669", bg: "#ECFDF5", fg: "#047857" },
  Medium: { solid: "#D97706", bg: "#FFFBEB", fg: "#B45309" },
  High: { solid: "#DC2626", bg: "#FEF2F2", fg: "#B91C1C" },
  Critical: { solid: "#7C3AED", bg: "#F5F3FF", fg: "#6D28D9" },
};

/** Ordered risk levels, ascending in severity — handy for legends and sorting. */
export const RISK_ORDER: RiskLevel[] = ["Low", "Medium", "High", "Critical"];

/** Alert lifecycle status palette. */
export const STATUS_STYLES: Record<AlertStatus, SwatchStyle> = {
  Active: { solid: "#DC2626", bg: "#FEF2F2", fg: "#B91C1C" },
  Investigating: { solid: "#D97706", bg: "#FFFBEB", fg: "#B45309" },
  Acknowledged: { solid: "#2563EB", bg: "#EFF6FF", fg: "#1D4ED8" },
  Resolved: { solid: "#059669", bg: "#ECFDF5", fg: "#047857" },
};

/** Upstream data-source connection status palette. */
export const SOURCE_STATUS_STYLES: Record<SourceStatus, SwatchStyle> = {
  Connected: { solid: "#059669", bg: "#ECFDF5", fg: "#047857" },
  Degraded: { solid: "#D97706", bg: "#FFFBEB", fg: "#B45309" },
  Offline: { solid: "#DC2626", bg: "#FEF2F2", fg: "#B91C1C" },
};

/** Role badge palette for the admin user table. */
export const ROLE_STYLES: Record<UserRole, SwatchStyle> = {
  "System Admin": { solid: "#7C3AED", bg: "#F5F3FF", fg: "#6D28D9" },
  "Data Engineer": { solid: "#2563EB", bg: "#EFF6FF", fg: "#1D4ED8" },
  "Data Scientist": { solid: "#0D9488", bg: "#F0FDFA", fg: "#0F766E" },
  "Health Officer": { solid: "#D97706", bg: "#FFFBEB", fg: "#B45309" },
  "State Coordinator": { solid: "#475569", bg: "#F1F5F9", fg: "#334155" },
};

/** Stroke colours for each disease series on the trend chart. */
export const DISEASE_COLORS: Record<Disease, string> = {
  "Lassa Fever": "#006B3F",
  Cholera: "#0EA5E9",
  "Cerebrospinal Meningitis": "#7C3AED",
  Monkeypox: "#D97706",
  Malaria: "#DC2626",
};
