// Module: Domain Type Definitions | Owner: Data Engineer / Backend Lead
// Central, framework-agnostic type contracts shared across every HealthWatch NG module.

/** Severity classification applied to states, LGAs and individual outbreak alerts. */
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

/** Diseases under active surveillance by the platform. */
export type Disease =
  | "Lassa Fever"
  | "Cholera"
  | "Cerebrospinal Meningitis"
  | "Monkeypox"
  | "Malaria";

/** Lifecycle state of an outbreak alert as it moves through triage. */
export type AlertStatus = "Active" | "Investigating" | "Acknowledged" | "Resolved";

/** Operational role of a platform user. */
export type UserRole =
  | "System Admin"
  | "Data Engineer"
  | "Data Scientist"
  | "Health Officer"
  | "State Coordinator";

/** Connection health of an upstream data source integration. */
export type SourceStatus = "Connected" | "Degraded" | "Offline";

/** Direction of a predicted or observed trend. */
export type TrendDirection = "up" | "down";

/** A Nigerian state (or the FCT) and its current surveillance posture. */
export interface StateRisk {
  id: string;
  name: string;
  /** Two/three-letter code shown on the risk grid cards. */
  code: string;
  risk: RiskLevel;
  activeCases: number;
  dominantDisease: Disease;
}

/** A single outbreak alert raised by the detection pipeline. */
export interface OutbreakAlert {
  id: string;
  disease: Disease;
  lga: string;
  state: string;
  risk: RiskLevel;
  caseCount: number;
  /** ISO-8601 timestamp the alert was triggered. */
  triggeredAt: string;
  status: AlertStatus;
  description: string;
  reportedBy: string;
  contactsTraced: number;
  fatalities: number;
  /** Hours between first signal and confirmed detection. */
  detectionTimeHrs: number;
}

/** One week of aggregated national case counts for the trend chart. */
export interface WeeklyCaseTrend {
  week: string;
  lassaFever: number;
  cholera: number;
  meningitis: number;
}

/** A platform user account managed from the admin panel. */
export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  state: string;
  active: boolean;
  /** ISO-8601 timestamp of the user's most recent activity. */
  lastActive: string;
}

/** An upstream integration feeding surveillance data into the platform. */
export interface DataSource {
  id: string;
  name: string;
  description: string;
  status: SourceStatus;
  /** ISO-8601 timestamp of the last successful synchronisation. */
  lastSync: string;
  recordCount: number;
}

/** A single immutable system event recorded for compliance. */
export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  resource: string;
  /** ISO-8601 timestamp the event occurred. */
  timestamp: string;
  category: "Auth" | "Data" | "Config" | "Export" | "Alert";
}

/** A modelled forecast point with confidence band for the officer portal. */
export interface ForecastPoint {
  week: string;
  /** Observed value where available (historical weeks only). */
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
}

/** An LGA flagged by the model as elevated risk in the coming period. */
export interface HighRiskLGA {
  id: string;
  lga: string;
  state: string;
  disease: Disease;
  predictedCases: number;
  trend: TrendDirection;
  /** Week-over-week percentage change in predicted caseload. */
  changePct: number;
}

/** Headline figures for the weekly epidemiological report. */
export interface EpiReportSummary {
  epiWeek: string;
  periodLabel: string;
  totalCasesReported: number;
  newOutbreaks: number;
  underInvestigation: number;
  statesReporting: number;
  /** Recovery rate as a percentage (0-100). */
  recoveryRate: number;
  /** Case fatality rate as a percentage (0-100). */
  caseFatalityRate: number;
}

/** Headline metric rendered in a dashboard summary card. */
export interface SummaryStat {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: TrendDirection | "flat";
  helpText: string;
}
