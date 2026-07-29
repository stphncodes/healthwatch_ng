// Module: Data Layer | Owner: Data Engineer / Backend Lead
// The single source every page fetches from. When Supabase is configured
// (see .env.example) each getter queries the matching table from
// supabase/schema.sql and maps snake_case rows onto the domain contracts in
// src/types/health.ts. Without Supabase, getters resolve empty so every view
// renders its empty state.

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AuditEntry,
  DataSource,
  EpiReportSummary,
  ForecastPoint,
  HighRiskLGA,
  OutbreakAlert,
  PlatformUser,
  StateRisk,
  WeeklyCaseTrend,
} from "@/types/health";

// Rows come back as loosely-typed records; each mapper narrows one table.
type Row = Record<string, unknown>;

async function fetchRows(
  table: string,
  options: { orderBy?: string; ascending?: boolean; limit?: number } = {},
): Promise<Row[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = getSupabase().from(table).select("*");
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) {
      console.error(`[data] failed to fetch ${table}:`, error.message);
      return [];
    }
    return (data ?? []) as Row[];
  } catch (err) {
    console.error(`[data] failed to fetch ${table}:`, err);
    return [];
  }
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" ? v : 0);

export async function getStateRisks(): Promise<StateRisk[]> {
  const rows = await fetchRows("state_risks", { orderBy: "name" });
  return rows.map((r) => ({
    id: str(r.id),
    name: str(r.name),
    code: str(r.code),
    risk: str(r.risk) as StateRisk["risk"],
    activeCases: num(r.active_cases),
    dominantDisease: str(r.dominant_disease) as StateRisk["dominantDisease"],
  }));
}

export async function getOutbreakAlerts(): Promise<OutbreakAlert[]> {
  const rows = await fetchRows("outbreak_alerts", {
    orderBy: "triggered_at",
    ascending: false,
  });
  return rows.map((r) => ({
    id: str(r.id),
    disease: str(r.disease) as OutbreakAlert["disease"],
    lga: str(r.lga),
    state: str(r.state),
    risk: str(r.risk) as OutbreakAlert["risk"],
    caseCount: num(r.case_count),
    triggeredAt: str(r.triggered_at),
    status: str(r.status) as OutbreakAlert["status"],
    description: str(r.description),
    reportedBy: str(r.reported_by),
    contactsTraced: num(r.contacts_traced),
    fatalities: num(r.fatalities),
    detectionTimeHrs: num(r.detection_time_hrs),
  }));
}

export async function getWeeklyCaseTrends(): Promise<WeeklyCaseTrend[]> {
  const rows = await fetchRows("weekly_case_trends", { orderBy: "week" });
  return rows.map((r) => ({
    week: str(r.week),
    lassaFever: num(r.lassa_fever),
    cholera: num(r.cholera),
    meningitis: num(r.meningitis),
  }));
}

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  const rows = await fetchRows("profiles", { orderBy: "name" });
  return rows.map((r) => ({
    id: str(r.id),
    name: str(r.name),
    email: str(r.email),
    role: str(r.role) as PlatformUser["role"],
    state: str(r.state),
    phone: typeof r.phone === "string" ? r.phone : undefined,
    active: Boolean(r.active),
    approvalStatus: (str(r.approval_status) ||
      "approved") as PlatformUser["approvalStatus"],
    lastActive: str(r.last_active),
  }));
}

export async function getDataSources(): Promise<DataSource[]> {
  const rows = await fetchRows("data_sources", { orderBy: "name" });
  return rows.map((r) => ({
    id: str(r.id),
    name: str(r.name),
    description: str(r.description),
    status: str(r.status) as DataSource["status"],
    lastSync: str(r.last_sync),
    recordCount: num(r.record_count),
  }));
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const rows = await fetchRows("audit_log", {
    orderBy: "timestamp",
    ascending: false,
    limit: 200,
  });
  return rows.map((r) => ({
    id: str(r.id),
    user: str(r.user_name),
    action: str(r.action),
    resource: str(r.resource),
    timestamp: str(r.timestamp),
    category: str(r.category) as AuditEntry["category"],
  }));
}

export async function getCholeraForecast(): Promise<ForecastPoint[]> {
  const rows = await fetchRows("forecast_points", { orderBy: "week" });
  return rows.map((r) => ({
    week: str(r.week),
    actual: typeof r.actual === "number" ? r.actual : null,
    predicted: num(r.predicted),
    lower: num(r.lower),
    upper: num(r.upper),
  }));
}

export async function getHighRiskLGAs(): Promise<HighRiskLGA[]> {
  const rows = await fetchRows("high_risk_lgas", {
    orderBy: "predicted_cases",
    ascending: false,
    limit: 5,
  });
  return rows.map((r) => ({
    id: str(r.id),
    lga: str(r.lga),
    state: str(r.state),
    disease: str(r.disease) as HighRiskLGA["disease"],
    predictedCases: num(r.predicted_cases),
    trend: r.trend === "down" ? "down" : "up",
    changePct: num(r.change_pct),
  }));
}

/** The most recent weekly epi report, or null when none has been published. */
export async function getEpiReport(): Promise<EpiReportSummary | null> {
  const rows = await fetchRows("epi_reports", {
    orderBy: "epi_week",
    ascending: false,
    limit: 1,
  });
  const r = rows[0];
  if (!r) return null;
  return {
    epiWeek: str(r.epi_week),
    periodLabel: str(r.period_label),
    totalCasesReported: num(r.total_cases_reported),
    newOutbreaks: num(r.new_outbreaks),
    underInvestigation: num(r.under_investigation),
    statesReporting: num(r.states_reporting),
    recoveryRate: num(r.recovery_rate),
    caseFatalityRate: num(r.case_fatality_rate),
  };
}
