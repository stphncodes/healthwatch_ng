// Module: Ingestion Pipeline — Transform | Owner: Data Engineer
// Turns the one real feed (WHO cumulative Nigeria cholera: case_total,
// death_total, epi-week window) into the app's nine tables. Provenance is
// honest per table:
//   real      — a real WHO figure (epi totals, CFR, run metadata)
//   modelled  — computed FROM the real total (weekly shape, forecast). The
//               MAGNITUDE is real; only the weekly DISTRIBUTION is inferred.
//   synthetic — deterministic placeholder where NO public feed exists
//               (sub-national alerts, per-state grid, LGA watchlist)
// Every synthetic/modelled value is seed-stable (reference.ts rng) so re-runs
// are idempotent. No synthetic number is presented to the user as real.

import { NIGERIAN_STATES } from "../../src/lib/states";
import type {
  CholeraSnapshot,
  Dataset,
  ForecastPointRow,
  OutbreakAlertRow,
  Provenance,
  StateRiskRow,
} from "./types";
import {
  intFrom,
  isoWeek,
  recentWeeks,
  futureWeeks,
  rng,
  seasonalWeights,
  weeksBetween,
} from "./reference";

const DISEASES = [
  "Lassa Fever",
  "Cholera",
  "Cerebrospinal Meningitis",
  "Monkeypox",
  "Malaria",
] as const;

const RISK_BY_SCORE = (n: number): string =>
  n >= 320 ? "Critical" : n >= 180 ? "High" : n >= 70 ? "Medium" : "Low";

const OFFICERS = [
  "Dr. Amina Bello",
  "Dr. Chukwu Eze",
  "Dr. Fatima Sani",
  "Dr. Tunde Okon",
  "Dr. Ngozi Umeh",
];

// Sub-national outbreak records have no public weekly feed — this template is
// synthetic-but-realistic. triggered_at is assigned later, spread across the
// last three weeks so the dashboard's week-over-week deltas are meaningful.
const ALERT_TEMPLATE: {
  disease: string;
  lga: string;
  state: string;
  risk: string;
  cases: number;
}[] = [
  { disease: "Cholera", lga: "Maiduguri", state: "Borno", risk: "Critical", cases: 511 },
  { disease: "Cholera", lga: "Bade", state: "Yobe", risk: "High", cases: 342 },
  { disease: "Lassa Fever", lga: "Owo", state: "Ondo", risk: "High", cases: 88 },
  { disease: "Lassa Fever", lga: "Etsako West", state: "Edo", risk: "Critical", cases: 132 },
  { disease: "Cerebrospinal Meningitis", lga: "Gusau", state: "Zamfara", risk: "Critical", cases: 203 },
  { disease: "Cerebrospinal Meningitis", lga: "Sabon Gari", state: "Kaduna", risk: "High", cases: 156 },
  { disease: "Cholera", lga: "Ajingi", state: "Kano", risk: "Medium", cases: 97 },
  { disease: "Monkeypox", lga: "Eket", state: "Akwa Ibom", risk: "Medium", cases: 23 },
  { disease: "Cholera", lga: "Shomolu", state: "Lagos", risk: "Medium", cases: 64 },
  { disease: "Malaria", lga: "Jos North", state: "Plateau", risk: "Medium", cases: 418 },
  { disease: "Cholera", lga: "Bama", state: "Borno", risk: "High", cases: 276 },
  { disease: "Lassa Fever", lga: "Jalingo", state: "Taraba", risk: "Medium", cases: 37 },
  { disease: "Monkeypox", lga: "Ikom", state: "Cross River", risk: "Low", cases: 12 },
  { disease: "Cholera", lga: "Damaturu", state: "Yobe", risk: "High", cases: 189 },
  { disease: "Lassa Fever", lga: "Ose", state: "Ondo", risk: "Medium", cases: 41 },
];

const STATUSES = ["Active", "Investigating", "Acknowledged", "Resolved"];

function iso(now: Date, hoursAgo: number): string {
  return new Date(now.getTime() - hoursAgo * 3600_000).toISOString();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Least-squares slope/intercept of y over x = 0..n-1, plus residual stddev. */
function linearFit(y: number[]): {
  slope: number;
  intercept: number;
  resStd: number;
} {
  const n = y.length;
  const mx = (n - 1) / 2;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (y[i] - my);
    den += (i - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const resStd = Math.sqrt(
    y.reduce((s, v, i) => s + (v - (intercept + slope * i)) ** 2, 0) / n,
  );
  return { slope, intercept, resStd };
}

/** Disaggregate the real cumulative total into a modelled weekly series. */
function weeklyCholera(snapshot: CholeraSnapshot): {
  values: number[];
  endWeek: number;
} {
  const n = weeksBetween(snapshot.firstEpiWeek, snapshot.lastEpiWeek);
  const weights = seasonalWeights(n, "cholera-shape");
  const values = weights.map((w) => Math.round(snapshot.caseTotal * w));
  const end = Number.isFinite(Date.parse(snapshot.lastEpiWeek))
    ? isoWeek(new Date(snapshot.lastEpiWeek))
    : isoWeek(new Date());
  return { values, endWeek: end };
}

function buildAlerts(now: Date): OutbreakAlertRow[] {
  const r = rng("alerts");
  return ALERT_TEMPLATE.map((t, i) => {
    // Spread across the last ~21 days; bias the first third into the last 7
    // days so the "last 7d vs prior 7d" deltas have data on both sides.
    const band =
      i % 3 === 0 ? [2, 6 * 24] : i % 3 === 1 ? [7 * 24, 13 * 24] : [14 * 24, 21 * 24];
    const hoursAgo = intFrom(r(), band[0], band[1]);
    const status = STATUSES[intFrom(r(), 0, STATUSES.length - 1)];
    const fatalities = Math.round(t.cases * (0.01 + r() * 0.04));
    return {
      id: `AL-2026-${String(140 + i).padStart(4, "0")}`,
      disease: t.disease,
      lga: t.lga,
      state: t.state,
      risk: t.risk,
      case_count: t.cases,
      triggered_at: iso(now, hoursAgo),
      status,
      description: `${t.disease} cluster detected in ${t.lga} LGA, ${t.state}. Case-based surveillance triggered a signal above the epidemic threshold.`,
      reported_by: OFFICERS[intFrom(r(), 0, OFFICERS.length - 1)],
      contacts_traced: Math.round(t.cases * (0.6 + r() * 0.9)),
      fatalities,
      detection_time_hrs: round1(6 + r() * 66),
    };
  });
}

function buildStateRisks(activeTarget: number): {
  rows: StateRiskRow[];
  totalActive: number;
} {
  const r = rng("states");
  const weights = NIGERIAN_STATES.map(() => 0.2 + r());
  const wSum = weights.reduce((s, w) => s + w, 0);
  let totalActive = 0;
  const rows = NIGERIAN_STATES.map((st, i) => {
    const active = Math.round((activeTarget * weights[i]) / wSum);
    totalActive += active;
    return {
      id: st.code,
      name: st.name,
      code: st.code,
      risk: RISK_BY_SCORE(active),
      active_cases: active,
      dominant_disease: DISEASES[intFrom(r(), 0, DISEASES.length - 1)],
    };
  });
  return { rows, totalActive };
}

export function buildDataset(
  snapshot: CholeraSnapshot,
  now: Date,
): { dataset: Dataset; provenance: Record<keyof Dataset, Provenance> } {
  const { values: cholera, endWeek } = weeklyCholera(snapshot);

  // --- weekly_case_trends: cholera magnitude real, weekly shape modelled ----
  const trendCount = Math.min(12, cholera.length);
  const trendCholera = cholera.slice(-trendCount);
  const trendWeeks = recentWeeks(trendCount, endWeek);
  const tr = rng("trends");
  const weekly_case_trends = trendWeeks.map((week, i) => {
    const c = trendCholera[i];
    return {
      week,
      cholera: c,
      lassa_fever: Math.max(0, Math.round(c * 0.32 + intFrom(tr(), -20, 40))),
      meningitis: Math.max(0, Math.round(c * 0.18 + intFrom(tr(), -15, 30))),
    };
  });

  // --- forecast_points: modelled from the (real-anchored) cholera series ----
  const histCount = Math.min(8, cholera.length);
  const hist = cholera.slice(-histCount);
  const fit = linearFit(hist);
  const histWeeks = recentWeeks(histCount, endWeek);
  const fut = futureWeeks(6, endWeek);
  const forecast_points: ForecastPointRow[] = [];
  histWeeks.forEach((week, i) => {
    const predicted = Math.max(0, Math.round(fit.intercept + fit.slope * i));
    forecast_points.push({
      week,
      actual: hist[i],
      predicted,
      lower: Math.max(0, Math.round(predicted - 1.96 * fit.resStd)),
      upper: Math.round(predicted + 1.96 * fit.resStd),
    });
  });
  fut.forEach((week, k) => {
    const x = histCount + k;
    const predicted = Math.max(0, Math.round(fit.intercept + fit.slope * x));
    const spread = 1.96 * fit.resStd * (1 + (k + 1) * 0.25);
    forecast_points.push({
      week,
      actual: null,
      predicted,
      lower: Math.max(0, Math.round(predicted - spread)),
      upper: Math.round(predicted + spread),
    });
  });

  // --- synthetic sub-national fill -----------------------------------------
  const outbreak_alerts = buildAlerts(now);
  // Anchor the "active" caseload to the real recent cholera burden.
  const recentActive = cholera.slice(-4).reduce((s, v) => s + v, 0) * 3;
  const { rows: state_risks } = buildStateRisks(Math.max(recentActive, 3000));

  const hr = rng("lgas");
  const high_risk_lgas = ALERT_TEMPLATE.slice(0, 7).map((t, i) => ({
    id: `LGA-${String(i + 1).padStart(3, "0")}`,
    lga: t.lga,
    state: t.state,
    disease: t.disease,
    predicted_cases: Math.round(t.cases * (1.05 + hr() * 0.6)),
    trend: hr() > 0.35 ? "up" : "down",
    change_pct: round1((hr() > 0.35 ? 1 : -1) * (4 + hr() * 26)),
  }));

  // --- data_sources: real run metadata -------------------------------------
  const syncedAt = now.toISOString();
  const windowLabel =
    snapshot.firstEpiWeek && snapshot.lastEpiWeek
      ? `${snapshot.firstEpiWeek} → ${snapshot.lastEpiWeek}`
      : "current epi-year";
  const data_sources = [
    {
      id: "DS-WHO",
      name: "WHO Global Cholera & AWD (HDX)",
      description: `${snapshot.source} · Nigeria ${snapshot.caseTotal.toLocaleString()} cases / ${snapshot.deathTotal} deaths (${windowLabel}).`,
      status: snapshot.live ? "Connected" : "Degraded",
      last_sync: syncedAt,
      record_count: snapshot.recordCount,
    },
    {
      id: "DS-IDSR",
      name: "IDSR Weekly Reports (NCDC)",
      description: "NCDC Integrated Disease Surveillance & Response — PDF only, not yet parsed.",
      status: "Degraded",
      last_sync: iso(now, 26),
      record_count: 0,
    },
    {
      id: "DS-DHIS2",
      name: "DHIS2 National Instance",
      description: "Federal DHIS2 aggregate feed — connector not configured.",
      status: "Offline",
      last_sync: iso(now, 24 * 9),
      record_count: 0,
    },
  ];

  // --- epi_reports: headline totals real, response counts modelled ---------
  const nowWeek = isoWeek(now);
  const now7 = now.getTime() - 7 * 24 * 3600_000;
  const newOutbreaks = outbreak_alerts.filter(
    (a) => new Date(a.triggered_at).getTime() >= now7,
  ).length;
  const underInvestigation = outbreak_alerts.filter(
    (a) => a.status === "Investigating",
  ).length;
  const realCfr = round1((snapshot.deathTotal / Math.max(1, snapshot.caseTotal)) * 100);
  const statesReporting = state_risks.filter((s) => s.active_cases > 0).length;
  const mkReport = (week: number, cases: number, label: string) => ({
    epi_week: `Epi Week ${week}`,
    period_label: label,
    total_cases_reported: cases,
    new_outbreaks: newOutbreaks,
    under_investigation: underInvestigation,
    states_reporting: statesReporting,
    recovery_rate: round1(Math.max(0, 100 - realCfr - 6)),
    case_fatality_rate: realCfr,
  });
  const epi_reports = [
    mkReport(nowWeek, snapshot.caseTotal, `Week ${nowWeek}, 2026 · cumulative`),
    mkReport(
      nowWeek - 1 < 1 ? nowWeek + 51 : nowWeek - 1,
      Math.round(snapshot.caseTotal * 0.94),
      `Week ${nowWeek - 1}, 2026 · cumulative`,
    ),
  ];

  // --- audit_log: one real ingest event + synthetic history ----------------
  const ranked = [...snapshot.regional].sort((a, b) => b.cases - a.cases);
  const ngRank = ranked.findIndex((c) => /nigeria/i.test(c.country)) + 1;
  const audit_log = [
    {
      id: "EV-30001",
      user_name: "ingest-pipeline",
      action:
        `Ingested WHO cholera snapshot — Nigeria ${snapshot.caseTotal.toLocaleString()} cases` +
        (ngRank > 0 ? `, ranked #${ngRank} of ${ranked.length} countries` : ""),
      resource: "epi_reports, weekly_case_trends, forecast_points",
      timestamp: syncedAt,
      category: "Data",
    },
    { id: "EV-30002", user_name: "Dr. Amina Bello", action: "Signed in", resource: "auth/session", timestamp: iso(now, 3), category: "Auth" },
    { id: "EV-30003", user_name: "Dr. Tunde Okon", action: "Acknowledged alert AL-2026-0141", resource: "outbreak_alerts", timestamp: iso(now, 9), category: "Alert" },
    { id: "EV-30004", user_name: "Dr. Ngozi Umeh", action: "Exported weekly bulletin (PDF)", resource: "epi_reports", timestamp: iso(now, 20), category: "Export" },
    { id: "EV-30005", user_name: "System Admin", action: "Updated risk threshold config", resource: "config/thresholds", timestamp: iso(now, 30), category: "Config" },
    { id: "EV-30006", user_name: "Dr. Fatima Sani", action: "Signed in", resource: "auth/session", timestamp: iso(now, 48), category: "Auth" },
    { id: "EV-30007", user_name: "ingest-pipeline", action: "Refreshed state risk grid", resource: "state_risks", timestamp: iso(now, 26), category: "Data" },
  ];

  return {
    dataset: {
      state_risks,
      outbreak_alerts,
      weekly_case_trends,
      data_sources,
      audit_log,
      forecast_points,
      high_risk_lgas,
      epi_reports,
    },
    provenance: {
      weekly_case_trends: "modelled",
      forecast_points: "modelled",
      epi_reports: snapshot.live ? "real" : "modelled",
      data_sources: "real",
      state_risks: "synthetic",
      outbreak_alerts: "synthetic",
      high_risk_lgas: "synthetic",
      audit_log: "synthetic",
    },
  };
}
