// Module: Ingestion Pipeline — WHO Cholera Connector | Owner: Data Engineer
// The one genuinely real, current, reachable feed the app is built on: the WHO
// Global Cholera & AWD dashboard, published on HDX. It is a country-level
// cumulative table for the current epi-year (one row per country: case_total,
// death_total, first/last epi-week). We resolve the resource URL dynamically
// from the HDX CKAN API (the file is served from ArcGIS and — despite HDX
// labelling it XLSX — is actually CSV, so we parse it format-agnostically).

import { parse } from "csv-parse/sync";
import type { CholeraSnapshot, CountryCholera } from "../types";

const PACKAGE_ID = "world-health-organization-who-cholera-data";
const CKAN_PACKAGE = `https://data.humdata.org/api/3/action/package_show?id=${PACKAGE_ID}`;

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (compatible; HealthWatchNG-ingest/1.0; +https://ncdc.gov.ng)",
  Accept: "text/csv, application/json, */*",
};

interface CkanResource {
  format?: string;
  url?: string;
}
interface CkanPackageResponse {
  result?: { resources?: CkanResource[] };
}

/** fetch with a couple of retries — undici occasionally drops the first TLS
 * connection to these hosts, which shouldn't push us onto the baseline. */
async function fetchRetry(url: string, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Find the header whose lower-cased name contains any needle. */
function col(headers: string[], needles: string[]): string | undefined {
  return headers.find((h) => needles.some((n) => h.toLowerCase().includes(n)));
}

function toNum(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetch and parse the WHO cholera snapshot for Nigeria. Throws on any failure
 * (network, no resource, unparseable body, no Nigeria row) so the orchestrator
 * can fall back to the offline baseline.
 */
export async function fetchCholeraSnapshot(): Promise<CholeraSnapshot> {
  const pkgRes = await fetchRetry(CKAN_PACKAGE);
  const pkg = (await pkgRes.json()) as CkanPackageResponse;
  const url = pkg.result?.resources?.find((r) => typeof r.url === "string")?.url;
  if (!url) throw new Error("HDX: no resource URL on the dataset");

  const res = await fetchRetry(url);
  const text = await res.text();

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];
  if (records.length === 0) throw new Error("WHO cholera: empty table");

  const headers = Object.keys(records[0]);
  const nameCol = col(headers, ["adm0", "country", "name"]);
  const isoCol = col(headers, ["iso", "code"]);
  const casesCol = col(headers, ["case_total", "case", "total_case"]);
  const deathsCol = col(headers, ["death_total", "death"]);
  const firstCol = col(headers, ["first_epiwk", "first", "start"]);
  const lastCol = col(headers, ["last_epiwk", "last", "end"]);
  if (!nameCol || !casesCol) {
    throw new Error("WHO cholera: expected country/case columns not found");
  }

  const regional: CountryCholera[] = records.map((r) => ({
    country: r[nameCol] ?? "",
    iso3: isoCol ? (r[isoCol] ?? "") : "",
    cases: toNum(r[casesCol]),
    deaths: deathsCol ? toNum(r[deathsCol]) : 0,
  }));

  const ng = records.find((r) => /nigeria/i.test(r[nameCol] ?? ""));
  if (!ng) throw new Error("WHO cholera: no Nigeria row");

  return {
    caseTotal: toNum(ng[casesCol]),
    deathTotal: deathsCol ? toNum(ng[deathsCol]) : 0,
    firstEpiWeek: firstCol ? (ng[firstCol] ?? "") : "",
    lastEpiWeek: lastCol ? (ng[lastCol] ?? "") : "",
    regional,
    source: "WHO Global Cholera & AWD dashboard (HDX)",
    live: true,
    recordCount: regional.length,
  };
}
