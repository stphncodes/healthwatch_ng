// Module: Ingestion Pipeline — Row Contracts | Owner: Data Engineer
// snake_case row shapes that mirror the tables in supabase/schema.sql exactly,
// so both the Supabase upsert and the seed.sql writer emit identical data.

/** Where a table's data came from, surfaced in the run's provenance summary. */
export type Provenance = "real" | "modelled" | "synthetic";

export interface StateRiskRow {
  id: string;
  name: string;
  code: string;
  risk: string;
  active_cases: number;
  dominant_disease: string;
}

export interface OutbreakAlertRow {
  id: string;
  disease: string;
  lga: string;
  state: string;
  risk: string;
  case_count: number;
  triggered_at: string;
  status: string;
  description: string;
  reported_by: string;
  contacts_traced: number;
  fatalities: number;
  detection_time_hrs: number;
}

export interface WeeklyCaseTrendRow {
  week: string;
  lassa_fever: number;
  cholera: number;
  meningitis: number;
}

export interface DataSourceRow {
  id: string;
  name: string;
  description: string;
  status: string;
  last_sync: string;
  record_count: number;
}

export interface AuditLogRow {
  id: string;
  user_name: string;
  action: string;
  resource: string;
  timestamp: string;
  category: string;
}

export interface ForecastPointRow {
  week: string;
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
}

export interface HighRiskLGARow {
  id: string;
  lga: string;
  state: string;
  disease: string;
  predicted_cases: number;
  trend: string;
  change_pct: number;
}

export interface EpiReportRow {
  epi_week: string;
  period_label: string;
  total_cases_reported: number;
  new_outbreaks: number;
  under_investigation: number;
  states_reporting: number;
  recovery_rate: number;
  case_fatality_rate: number;
}

/** Every table the pipeline populates, keyed by its Postgres table name. */
export interface Dataset {
  state_risks: StateRiskRow[];
  outbreak_alerts: OutbreakAlertRow[];
  weekly_case_trends: WeeklyCaseTrendRow[];
  data_sources: DataSourceRow[];
  audit_log: AuditLogRow[];
  forecast_points: ForecastPointRow[];
  high_risk_lgas: HighRiskLGARow[];
  epi_reports: EpiReportRow[];
}

/** One country's cumulative cholera burden for the current epi-year. */
export interface CountryCholera {
  country: string;
  iso3: string;
  cases: number;
  deaths: number;
}

/**
 * A real cholera snapshot from the WHO Global Cholera & AWD dashboard (via
 * HDX): Nigeria's cumulative case/death totals for a reporting window, plus
 * the regional table for context. This is the app's one genuinely real,
 * current feed. Everything else is modelled from it or synthetic.
 */
export interface CholeraSnapshot {
  /** Nigeria cumulative cases across the reporting window. */
  caseTotal: number;
  /** Nigeria cumulative deaths across the reporting window. */
  deathTotal: number;
  /** ISO date of the first reported epi-week, e.g. "2025-12-29". */
  firstEpiWeek: string;
  /** ISO date of the last reported epi-week, e.g. "2026-06-08". */
  lastEpiWeek: string;
  /** All countries in the source table (for regional context / ranking). */
  regional: CountryCholera[];
  /** Human-readable origin. */
  source: string;
  /** True when a real remote fetch succeeded; false for the offline baseline. */
  live: boolean;
  /** Number of source rows read (0 for the baseline). */
  recordCount: number;
}
