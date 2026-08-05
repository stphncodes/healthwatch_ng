// Module: Ingestion Pipeline — Offline Baseline | Owner: Data Engineer
// Shared by the CLI (scripts/ingest.ts) and the admin refresh route
// (src/app/api/admin/refresh-data). Only used when the WHO fetch fails, so a
// refresh always produces a populated dataset with no network.

import type { CholeraSnapshot } from "./types";

/** Offline baseline (illustrative — NOT real), shaped after a plausible
 * Nigerian cholera epi-year. */
export function baselineSnapshot(): CholeraSnapshot {
  return {
    caseTotal: 10500,
    deathTotal: 105,
    firstEpiWeek: "2025-12-29",
    lastEpiWeek: "2026-06-08",
    regional: [],
    source: "offline baseline (illustrative)",
    live: false,
    recordCount: 0,
  };
}
