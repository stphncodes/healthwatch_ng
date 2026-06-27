// Module: Mock Surveillance Dataset | Owner: Data Engineer / Data Scientist
// Deterministic, realistic stand-in data for the HealthWatch NG demo. Every
// timestamp is generated relative to module-load time so the UI always reads as
// "fresh" regardless of when the app is run, while staying hydration-stable
// (server and client both express ages as the same baked-in offset).

import type {
  AuditEntry,
  DataSource,
  EpiReportSummary,
  ForecastPoint,
  HighRiskLGA,
  OutbreakAlert,
  PlatformUser,
  StateRisk,
  SummaryStat,
  WeeklyCaseTrend,
} from "@/types/health";

const REFERENCE_NOW = new Date();
const minutesAgo = (m: number): string =>
  new Date(REFERENCE_NOW.getTime() - m * 60_000).toISOString();
const hoursAgo = (h: number): string => minutesAgo(h * 60);
const daysAgo = (d: number): string => minutesAgo(d * 60 * 24);

/* -------------------------------------------------------------------------- */
/* States — all 36 + FCT                                                       */
/* -------------------------------------------------------------------------- */

export const STATE_RISKS: StateRisk[] = [
  { id: "AB", name: "Abia", code: "AB", risk: "Low", activeCases: 64, dominantDisease: "Malaria" },
  { id: "AD", name: "Adamawa", code: "AD", risk: "Medium", activeCases: 188, dominantDisease: "Cholera" },
  { id: "AK", name: "Akwa Ibom", code: "AK", risk: "Low", activeCases: 78, dominantDisease: "Malaria" },
  { id: "AN", name: "Anambra", code: "AN", risk: "Medium", activeCases: 244, dominantDisease: "Cholera" },
  { id: "BA", name: "Bauchi", code: "BA", risk: "High", activeCases: 540, dominantDisease: "Lassa Fever" },
  { id: "BY", name: "Bayelsa", code: "BY", risk: "High", activeCases: 612, dominantDisease: "Cholera" },
  { id: "BE", name: "Benue", code: "BE", risk: "Medium", activeCases: 271, dominantDisease: "Lassa Fever" },
  { id: "BO", name: "Borno", code: "BO", risk: "Critical", activeCases: 1240, dominantDisease: "Cholera" },
  { id: "CR", name: "Cross River", code: "CR", risk: "Low", activeCases: 52, dominantDisease: "Malaria" },
  { id: "DE", name: "Delta", code: "DE", risk: "Medium", activeCases: 312, dominantDisease: "Monkeypox" },
  { id: "EB", name: "Ebonyi", code: "EB", risk: "High", activeCases: 498, dominantDisease: "Lassa Fever" },
  { id: "ED", name: "Edo", code: "ED", risk: "Critical", activeCases: 1085, dominantDisease: "Lassa Fever" },
  { id: "EK", name: "Ekiti", code: "EK", risk: "Low", activeCases: 41, dominantDisease: "Malaria" },
  { id: "EN", name: "Enugu", code: "EN", risk: "Low", activeCases: 69, dominantDisease: "Malaria" },
  { id: "GO", name: "Gombe", code: "GO", risk: "Medium", activeCases: 203, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "IM", name: "Imo", code: "IM", risk: "Low", activeCases: 73, dominantDisease: "Malaria" },
  { id: "JI", name: "Jigawa", code: "JI", risk: "High", activeCases: 387, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "KD", name: "Kaduna", code: "KD", risk: "High", activeCases: 645, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "KN", name: "Kano", code: "KN", risk: "Critical", activeCases: 1320, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "KT", name: "Katsina", code: "KT", risk: "High", activeCases: 521, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "KB", name: "Kebbi", code: "KB", risk: "High", activeCases: 412, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "KO", name: "Kogi", code: "KO", risk: "Medium", activeCases: 167, dominantDisease: "Lassa Fever" },
  { id: "KW", name: "Kwara", code: "KW", risk: "Medium", activeCases: 154, dominantDisease: "Lassa Fever" },
  { id: "LA", name: "Lagos", code: "LA", risk: "High", activeCases: 1180, dominantDisease: "Cholera" },
  { id: "NA", name: "Nasarawa", code: "NA", risk: "Medium", activeCases: 142, dominantDisease: "Malaria" },
  { id: "NI", name: "Niger", code: "NI", risk: "Medium", activeCases: 231, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "OG", name: "Ogun", code: "OG", risk: "Low", activeCases: 96, dominantDisease: "Malaria" },
  { id: "ON", name: "Ondo", code: "ON", risk: "Critical", activeCases: 968, dominantDisease: "Lassa Fever" },
  { id: "OS", name: "Osun", code: "OS", risk: "Low", activeCases: 58, dominantDisease: "Malaria" },
  { id: "OY", name: "Oyo", code: "OY", risk: "Medium", activeCases: 398, dominantDisease: "Cholera" },
  { id: "PL", name: "Plateau", code: "PL", risk: "Medium", activeCases: 276, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "RI", name: "Rivers", code: "RI", risk: "High", activeCases: 734, dominantDisease: "Monkeypox" },
  { id: "SO", name: "Sokoto", code: "SO", risk: "Critical", activeCases: 1102, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "TA", name: "Taraba", code: "TA", risk: "High", activeCases: 356, dominantDisease: "Lassa Fever" },
  { id: "YO", name: "Yobe", code: "YO", risk: "High", activeCases: 489, dominantDisease: "Cholera" },
  { id: "ZA", name: "Zamfara", code: "ZA", risk: "High", activeCases: 567, dominantDisease: "Cerebrospinal Meningitis" },
  { id: "FC", name: "FCT", code: "FCT", risk: "Medium", activeCases: 421, dominantDisease: "Cholera" },
];

/* -------------------------------------------------------------------------- */
/* Weekly national case trends — 12 epi weeks                                  */
/* -------------------------------------------------------------------------- */

export const WEEKLY_CASE_TRENDS: WeeklyCaseTrend[] = [
  { week: "Wk 15", lassaFever: 142, cholera: 45, meningitis: 210 },
  { week: "Wk 16", lassaFever: 138, cholera: 52, meningitis: 198 },
  { week: "Wk 17", lassaFever: 131, cholera: 61, meningitis: 176 },
  { week: "Wk 18", lassaFever: 120, cholera: 73, meningitis: 150 },
  { week: "Wk 19", lassaFever: 108, cholera: 88, meningitis: 128 },
  { week: "Wk 20", lassaFever: 99, cholera: 96, meningitis: 104 },
  { week: "Wk 21", lassaFever: 91, cholera: 110, meningitis: 88 },
  { week: "Wk 22", lassaFever: 86, cholera: 128, meningitis: 72 },
  { week: "Wk 23", lassaFever: 80, cholera: 141, meningitis: 61 },
  { week: "Wk 24", lassaFever: 77, cholera: 159, meningitis: 53 },
  { week: "Wk 25", lassaFever: 73, cholera: 176, meningitis: 47 },
  { week: "Wk 26", lassaFever: 70, cholera: 190, meningitis: 42 },
];

/* -------------------------------------------------------------------------- */
/* Outbreak alerts                                                             */
/* -------------------------------------------------------------------------- */

export const OUTBREAK_ALERTS: OutbreakAlert[] = [
  {
    id: "ALT-26-0001",
    disease: "Lassa Fever",
    lga: "Owo",
    state: "Ondo",
    risk: "Critical",
    caseCount: 87,
    triggeredAt: hoursAgo(4),
    status: "Active",
    description:
      "Sharp cluster of suspected Lassa Fever at the Federal Medical Centre Owo. Rodent control and contact tracing initiated across three wards.",
    reportedBy: "FMC Owo Surveillance Unit",
    contactsTraced: 142,
    fatalities: 9,
    detectionTimeHrs: 18,
  },
  {
    id: "ALT-26-0002",
    disease: "Cholera",
    lga: "Jere",
    state: "Borno",
    risk: "Critical",
    caseCount: 156,
    triggeredAt: hoursAgo(7),
    status: "Investigating",
    description:
      "Acute watery diarrhoea spike in IDP settlements. Water source contamination suspected; RDTs dispatched to two camps.",
    reportedBy: "Borno SMOH RRT",
    contactsTraced: 310,
    fatalities: 12,
    detectionTimeHrs: 22,
  },
  {
    id: "ALT-26-0003",
    disease: "Cerebrospinal Meningitis",
    lga: "Gusau",
    state: "Zamfara",
    risk: "High",
    caseCount: 64,
    triggeredAt: hoursAgo(11),
    status: "Active",
    description:
      "Suspected meningococcal cluster crossing the weekly epidemic threshold. Reactive vaccination assessment under way.",
    reportedBy: "Zamfara DSNO",
    contactsTraced: 88,
    fatalities: 6,
    detectionTimeHrs: 30,
  },
  {
    id: "ALT-26-0004",
    disease: "Lassa Fever",
    lga: "Esan West",
    state: "Edo",
    risk: "Critical",
    caseCount: 73,
    triggeredAt: daysAgo(1),
    status: "Investigating",
    description:
      "Confirmed Lassa cases linked to ISTH referral chain. Two health workers among contacts placed under daily monitoring.",
    reportedBy: "ISTH Infection Control",
    contactsTraced: 121,
    fatalities: 7,
    detectionTimeHrs: 26,
  },
  {
    id: "ALT-26-0005",
    disease: "Cholera",
    lga: "Yenagoa",
    state: "Bayelsa",
    risk: "High",
    caseCount: 92,
    triggeredAt: daysAgo(1),
    status: "Active",
    description:
      "Flood-related cholera transmission across riverine communities. ORP points established at four primary health centres.",
    reportedBy: "Bayelsa SEOC",
    contactsTraced: 176,
    fatalities: 4,
    detectionTimeHrs: 19,
  },
  {
    id: "ALT-26-0006",
    disease: "Monkeypox",
    lga: "Port Harcourt",
    state: "Rivers",
    risk: "High",
    caseCount: 38,
    triggeredAt: daysAgo(2),
    status: "Investigating",
    description:
      "Mpox case cluster with vesicular rash presentations. Samples sent to NRL Abuja for confirmatory PCR.",
    reportedBy: "Rivers SMOH",
    contactsTraced: 64,
    fatalities: 1,
    detectionTimeHrs: 41,
  },
  {
    id: "ALT-26-0007",
    disease: "Cerebrospinal Meningitis",
    lga: "Kano Municipal",
    state: "Kano",
    risk: "Critical",
    caseCount: 118,
    triggeredAt: daysAgo(2),
    status: "Active",
    description:
      "Meningitis outbreak declared after threshold breach in two adjoining wards. Vaccine request submitted to NCDC.",
    reportedBy: "Kano SEOC",
    contactsTraced: 240,
    fatalities: 11,
    detectionTimeHrs: 28,
  },
  {
    id: "ALT-26-0008",
    disease: "Cholera",
    lga: "Ikorodu",
    state: "Lagos",
    risk: "High",
    caseCount: 67,
    triggeredAt: daysAgo(2),
    status: "Acknowledged",
    description:
      "Cholera transmission tied to a contaminated borehole. Public advisory issued; water sampling completed.",
    reportedBy: "Lagos SMOH DSU",
    contactsTraced: 98,
    fatalities: 3,
    detectionTimeHrs: 24,
  },
  {
    id: "ALT-26-0009",
    disease: "Lassa Fever",
    lga: "Abakaliki",
    state: "Ebonyi",
    risk: "High",
    caseCount: 54,
    triggeredAt: daysAgo(3),
    status: "Investigating",
    description:
      "Lassa Fever cases confirmed at AE-FUTHA. Ribavirin stock verified; community sensitisation ongoing.",
    reportedBy: "AE-FUTHA VHF Team",
    contactsTraced: 87,
    fatalities: 5,
    detectionTimeHrs: 33,
  },
  {
    id: "ALT-26-0010",
    disease: "Cerebrospinal Meningitis",
    lga: "Sokoto North",
    state: "Sokoto",
    risk: "Critical",
    caseCount: 102,
    triggeredAt: daysAgo(3),
    status: "Active",
    description:
      "Sustained meningitis transmission in the metropolis. Case-based surveillance intensified across all wards.",
    reportedBy: "Sokoto DSNO",
    contactsTraced: 198,
    fatalities: 9,
    detectionTimeHrs: 27,
  },
  {
    id: "ALT-26-0011",
    disease: "Malaria",
    lga: "Oshimili North",
    state: "Delta",
    risk: "Medium",
    caseCount: 214,
    triggeredAt: daysAgo(3),
    status: "Acknowledged",
    description:
      "Seasonal malaria surge above expected baseline. RDT and ACT resupply requested for affected PHCs.",
    reportedBy: "Delta SMOH",
    contactsTraced: 0,
    fatalities: 2,
    detectionTimeHrs: 36,
  },
  {
    id: "ALT-26-0012",
    disease: "Cholera",
    lga: "Damaturu",
    state: "Yobe",
    risk: "High",
    caseCount: 81,
    triggeredAt: daysAgo(4),
    status: "Investigating",
    description:
      "Cholera cases reported across three settlements. Rapid response team deployed with cholera kits.",
    reportedBy: "Yobe SEOC",
    contactsTraced: 152,
    fatalities: 6,
    detectionTimeHrs: 21,
  },
  {
    id: "ALT-26-0013",
    disease: "Lassa Fever",
    lga: "Bauchi",
    state: "Bauchi",
    risk: "High",
    caseCount: 49,
    triggeredAt: daysAgo(4),
    status: "Acknowledged",
    description:
      "Confirmed Lassa cases at ATBUTH. Contacts enrolled in 21-day follow-up; environmental measures advised.",
    reportedBy: "ATBUTH Surveillance",
    contactsTraced: 76,
    fatalities: 4,
    detectionTimeHrs: 35,
  },
  {
    id: "ALT-26-0014",
    disease: "Monkeypox",
    lga: "Eleme",
    state: "Rivers",
    risk: "Medium",
    caseCount: 22,
    triggeredAt: daysAgo(5),
    status: "Resolved",
    description:
      "Mpox cluster contained after contact follow-up. All confirmed cases recovered; outbreak closed.",
    reportedBy: "Rivers SMOH",
    contactsTraced: 31,
    fatalities: 0,
    detectionTimeHrs: 48,
  },
  {
    id: "ALT-26-0015",
    disease: "Cerebrospinal Meningitis",
    lga: "Dutse",
    state: "Jigawa",
    risk: "High",
    caseCount: 58,
    triggeredAt: daysAgo(5),
    status: "Active",
    description:
      "Meningitis cluster exceeding alert threshold. Lumbar puncture samples forwarded for serogroup confirmation.",
    reportedBy: "Jigawa DSNO",
    contactsTraced: 84,
    fatalities: 5,
    detectionTimeHrs: 29,
  },
  {
    id: "ALT-26-0016",
    disease: "Cholera",
    lga: "Ibadan North",
    state: "Oyo",
    risk: "Medium",
    caseCount: 45,
    triggeredAt: daysAgo(6),
    status: "Acknowledged",
    description:
      "Localised cholera transmission near a market cluster. Sanitation inspection and chlorination ordered.",
    reportedBy: "Oyo SMOH DSU",
    contactsTraced: 67,
    fatalities: 1,
    detectionTimeHrs: 38,
  },
  {
    id: "ALT-26-0017",
    disease: "Cerebrospinal Meningitis",
    lga: "Birnin Kebbi",
    state: "Kebbi",
    risk: "High",
    caseCount: 47,
    triggeredAt: daysAgo(6),
    status: "Investigating",
    description:
      "Suspected meningitis cases under investigation. Line-list compiled; reactive vaccination assessment requested.",
    reportedBy: "Kebbi DSNO",
    contactsTraced: 72,
    fatalities: 4,
    detectionTimeHrs: 31,
  },
  {
    id: "ALT-26-0018",
    disease: "Lassa Fever",
    lga: "Jalingo",
    state: "Taraba",
    risk: "High",
    caseCount: 41,
    triggeredAt: daysAgo(7),
    status: "Acknowledged",
    description:
      "Lassa Fever confirmed at FMC Jalingo. Health-worker contacts under monitoring; PPE resupply completed.",
    reportedBy: "FMC Jalingo",
    contactsTraced: 58,
    fatalities: 3,
    detectionTimeHrs: 34,
  },
  {
    id: "ALT-26-0019",
    disease: "Cholera",
    lga: "Lokoja",
    state: "Kogi",
    risk: "Medium",
    caseCount: 36,
    triggeredAt: daysAgo(8),
    status: "Resolved",
    description:
      "Cholera transmission halted after WASH intervention. No new cases for 14 days; outbreak declared over.",
    reportedBy: "Kogi SMOH",
    contactsTraced: 49,
    fatalities: 1,
    detectionTimeHrs: 40,
  },
  {
    id: "ALT-26-0020",
    disease: "Cerebrospinal Meningitis",
    lga: "Zaria",
    state: "Kaduna",
    risk: "High",
    caseCount: 69,
    triggeredAt: daysAgo(9),
    status: "Acknowledged",
    description:
      "Meningitis outbreak in Zaria with sustained transmission. Reactive vaccination campaign approved.",
    reportedBy: "Kaduna SEOC",
    contactsTraced: 110,
    fatalities: 6,
    detectionTimeHrs: 26,
  },
  {
    id: "ALT-26-0021",
    disease: "Malaria",
    lga: "Makurdi",
    state: "Benue",
    risk: "Medium",
    caseCount: 188,
    triggeredAt: daysAgo(10),
    status: "Resolved",
    description:
      "Malaria caseload returned to seasonal baseline after net distribution and ACT resupply.",
    reportedBy: "Benue SMOH",
    contactsTraced: 0,
    fatalities: 2,
    detectionTimeHrs: 44,
  },
  {
    id: "ALT-26-0022",
    disease: "Monkeypox",
    lga: "Ethiope East",
    state: "Delta",
    risk: "Medium",
    caseCount: 19,
    triggeredAt: daysAgo(12),
    status: "Resolved",
    description:
      "Isolated Mpox cases recovered fully. Contact follow-up completed with no secondary transmission.",
    reportedBy: "Delta SMOH",
    contactsTraced: 24,
    fatalities: 0,
    detectionTimeHrs: 52,
  },
];

/* -------------------------------------------------------------------------- */
/* Platform users                                                              */
/* -------------------------------------------------------------------------- */

export const PLATFORM_USERS: PlatformUser[] = [
  { id: "U-001", name: "Dr. Amina Bello", email: "amina.bello@ncdc.gov.ng", role: "System Admin", state: "FCT", active: true, lastActive: minutesAgo(8) },
  { id: "U-002", name: "Chidi Okeke", email: "chidi.okeke@ncdc.gov.ng", role: "Data Engineer", state: "Lagos", active: true, lastActive: minutesAgo(42) },
  { id: "U-003", name: "Dr. Funke Adeyemi", email: "funke.adeyemi@ncdc.gov.ng", role: "Data Scientist", state: "Oyo", active: true, lastActive: hoursAgo(2) },
  { id: "U-004", name: "Ibrahim Sani", email: "ibrahim.sani@kano.gov.ng", role: "Health Officer", state: "Kano", active: true, lastActive: hoursAgo(5) },
  { id: "U-005", name: "Grace Effiong", email: "grace.effiong@crossriver.gov.ng", role: "State Coordinator", state: "Cross River", active: false, lastActive: daysAgo(9) },
  { id: "U-006", name: "Musa Abdullahi", email: "musa.abdullahi@sokoto.gov.ng", role: "Health Officer", state: "Sokoto", active: true, lastActive: hoursAgo(1) },
  { id: "U-007", name: "Ngozi Eze", email: "ngozi.eze@ncdc.gov.ng", role: "Data Scientist", state: "Enugu", active: true, lastActive: hoursAgo(7) },
  { id: "U-008", name: "Tunde Bakare", email: "tunde.bakare@ondo.gov.ng", role: "State Coordinator", state: "Ondo", active: false, lastActive: daysAgo(21) },
];

/* -------------------------------------------------------------------------- */
/* Data source integrations                                                    */
/* -------------------------------------------------------------------------- */

export const DATA_SOURCES: DataSource[] = [
  {
    id: "DS-IDSR",
    name: "NCDC IDSR",
    description: "Integrated Disease Surveillance & Response weekly case feed",
    status: "Connected",
    lastSync: minutesAgo(6),
    recordCount: 482193,
  },
  {
    id: "DS-WHO",
    name: "WHO AFRO EHR",
    description: "WHO Africa Regional Office electronic health record exchange",
    status: "Degraded",
    lastSync: hoursAgo(9),
    recordCount: 218640,
  },
  {
    id: "DS-DHIS2",
    name: "DHIS2 Facility Registry",
    description: "District Health Information System v2 facility master list",
    status: "Connected",
    lastSync: minutesAgo(14),
    recordCount: 39512,
  },
];

/* -------------------------------------------------------------------------- */
/* Audit log                                                                   */
/* -------------------------------------------------------------------------- */

export const AUDIT_LOG: AuditEntry[] = [
  { id: "EV-3120", user: "Dr. Amina Bello", action: "Acknowledged alert", resource: "ALT-26-0008", timestamp: minutesAgo(12), category: "Alert" },
  { id: "EV-3119", user: "Chidi Okeke", action: "Triggered manual sync", resource: "NCDC IDSR", timestamp: minutesAgo(34), category: "Data" },
  { id: "EV-3118", user: "Dr. Funke Adeyemi", action: "Retrained forecast model", resource: "cholera-forecast-v7", timestamp: hoursAgo(2), category: "Config" },
  { id: "EV-3117", user: "Ibrahim Sani", action: "Exported case line-list", resource: "Kano / EW26", timestamp: hoursAgo(3), category: "Export" },
  { id: "EV-3116", user: "Musa Abdullahi", action: "Signed in", resource: "Web portal", timestamp: hoursAgo(4), category: "Auth" },
  { id: "EV-3115", user: "Dr. Amina Bello", action: "Updated user role", resource: "U-007 → Data Scientist", timestamp: hoursAgo(6), category: "Config" },
  { id: "EV-3114", user: "Ngozi Eze", action: "Published epi report", resource: "Weekly Bulletin EW25", timestamp: hoursAgo(20), category: "Export" },
  { id: "EV-3113", user: "System", action: "Auto-escalated alert", resource: "ALT-26-0001", timestamp: daysAgo(1), category: "Alert" },
  { id: "EV-3112", user: "Chidi Okeke", action: "Resolved ingestion error", resource: "WHO AFRO EHR", timestamp: daysAgo(1), category: "Data" },
  { id: "EV-3111", user: "Grace Effiong", action: "Deactivated account", resource: "U-005 (self)", timestamp: daysAgo(2), category: "Auth" },
  { id: "EV-3110", user: "Dr. Funke Adeyemi", action: "Adjusted alert threshold", resource: "Meningitis / North-West", timestamp: daysAgo(2), category: "Config" },
  { id: "EV-3109", user: "Ibrahim Sani", action: "Acknowledged alert", resource: "ALT-26-0007", timestamp: daysAgo(3), category: "Alert" },
  { id: "EV-3108", user: "System", action: "Nightly data ingest completed", resource: "DHIS2 Facility Registry", timestamp: daysAgo(3), category: "Data" },
  { id: "EV-3107", user: "Dr. Amina Bello", action: "Invited new user", resource: "tunde.bakare@ondo.gov.ng", timestamp: daysAgo(4), category: "Config" },
];

/* -------------------------------------------------------------------------- */
/* Officer portal — forecast, high-risk LGAs, epi report                       */
/* -------------------------------------------------------------------------- */

// 4-week cholera forecast (national) with 90% confidence band. Historical weeks
// carry an `actual`; forecast weeks set it to null and widen the band.
export const CHOLERA_FORECAST: ForecastPoint[] = [
  { week: "EW22", actual: 96, predicted: 96, lower: 96, upper: 96 },
  { week: "EW23", actual: 110, predicted: 110, lower: 110, upper: 110 },
  { week: "EW24", actual: 128, predicted: 128, lower: 128, upper: 128 },
  { week: "EW25", actual: 141, predicted: 141, lower: 141, upper: 141 },
  { week: "EW26", actual: 159, predicted: 159, lower: 150, upper: 168 },
  { week: "EW27", actual: null, predicted: 178, lower: 158, upper: 199 },
  { week: "EW28", actual: null, predicted: 199, lower: 168, upper: 232 },
  { week: "EW29", actual: null, predicted: 223, lower: 181, upper: 268 },
];

export const HIGH_RISK_LGAS: HighRiskLGA[] = [
  { id: "LGA-01", lga: "Owo", state: "Ondo", disease: "Lassa Fever", predictedCases: 87, trend: "up", changePct: 18 },
  { id: "LGA-02", lga: "Maiduguri", state: "Borno", disease: "Cholera", predictedCases: 76, trend: "up", changePct: 24 },
  { id: "LGA-03", lga: "Esan West", state: "Edo", disease: "Lassa Fever", predictedCases: 64, trend: "down", changePct: -6 },
  { id: "LGA-04", lga: "Gusau", state: "Zamfara", disease: "Cerebrospinal Meningitis", predictedCases: 58, trend: "up", changePct: 12 },
  { id: "LGA-05", lga: "Yenagoa", state: "Bayelsa", disease: "Cholera", predictedCases: 49, trend: "up", changePct: 9 },
];

export const EPI_REPORT: EpiReportSummary = {
  epiWeek: "EW26",
  periodLabel: "22 – 28 June 2026",
  totalCasesReported: 1842,
  newOutbreaks: 7,
  underInvestigation: 23,
  statesReporting: 31,
  recoveryRate: 88.6,
  caseFatalityRate: 2.4,
};

/* -------------------------------------------------------------------------- */
/* Derived dashboard summary statistics                                        */
/* -------------------------------------------------------------------------- */

const totalActiveCases = STATE_RISKS.reduce((sum, s) => sum + s.activeCases, 0);
const activeOutbreaks = OUTBREAK_ALERTS.filter(
  (a) => a.status === "Active" || a.status === "Investigating",
).length;
const statesAffected = STATE_RISKS.filter((s) => s.risk !== "Low").length;
const avgDetectionHrs = Math.round(
  OUTBREAK_ALERTS.reduce((sum, a) => sum + a.detectionTimeHrs, 0) /
    OUTBREAK_ALERTS.length,
);

export const SUMMARY_STATS: SummaryStat[] = [
  {
    id: "active-cases",
    label: "Total Active Cases",
    value: new Intl.NumberFormat("en-NG").format(totalActiveCases),
    delta: "+6.2% vs last week",
    trend: "up",
    helpText: "Confirmed + suspected cases across all states",
  },
  {
    id: "active-outbreaks",
    label: "Active Outbreaks",
    value: String(activeOutbreaks),
    delta: "+3 new this week",
    trend: "up",
    helpText: "Alerts currently Active or under Investigation",
  },
  {
    id: "states-affected",
    label: "States Affected",
    value: `${statesAffected} / 37`,
    delta: "+2 vs last week",
    trend: "up",
    helpText: "States at Medium risk or above",
  },
  {
    id: "detection-time",
    label: "Avg Detection Time",
    value: `${avgDetectionHrs}h`,
    delta: "-12% vs last week",
    trend: "down",
    helpText: "Mean time from first signal to confirmed detection",
  },
];
