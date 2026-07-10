// Module: Ingestion Pipeline — Orchestrator | Owner: Data Engineer
// Refreshable pipeline: `npm run ingest`.
//   1. fetch real weekly Nigeria cholera from HDX (fall back to an offline
//      baseline so the run always produces a populated dataset),
//   2. transform → the app's nine tables (see transform.ts for provenance),
//   3. always write supabase/seed.sql (committed, network-free fallback),
//   4. if SUPABASE_SERVICE_ROLE_KEY is set, upsert into Supabase.
// Idempotent: safe to re-run on a schedule to refresh the data.

import { config } from "dotenv";
import { fetchCholeraSnapshot } from "./ingest/sources/whoCholera";
import { buildDataset } from "./ingest/transform";
import { writeSeedSql } from "./ingest/seedWriter";
import { loadDataset } from "./ingest/load";
import type { CholeraSnapshot, Dataset, Provenance } from "./ingest/types";

// Load .env.local first (Next's convention), then .env as a fallback.
config({ path: ".env.local" });
config();

// Offline baseline (illustrative — NOT real). Only used when the WHO fetch
// fails, so `npm run ingest` still produces a populated dataset with no
// network. Shaped after a plausible Nigerian cholera epi-year.
function baselineSnapshot(): CholeraSnapshot {
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

async function resolveSnapshot(): Promise<CholeraSnapshot> {
  try {
    const snapshot = await fetchCholeraSnapshot();
    console.log(
      `✓ Fetched WHO cholera snapshot from ${snapshot.source} — ` +
        `Nigeria ${snapshot.caseTotal.toLocaleString()} cases / ` +
        `${snapshot.deathTotal} deaths (${snapshot.recordCount} countries).`,
    );
    return snapshot;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠ WHO fetch failed (${msg}). Falling back to offline baseline.`);
    return baselineSnapshot();
  }
}

function printSummary(
  dataset: Dataset,
  provenance: Record<keyof Dataset, Provenance>,
): void {
  console.log("\nProvenance summary");
  console.log("─".repeat(52));
  (Object.keys(dataset) as (keyof Dataset)[]).forEach((t) => {
    const rows = dataset[t] as unknown[];
    console.log(
      `  ${t.padEnd(22)} ${String(rows.length).padStart(4)} rows   ${provenance[t]}`,
    );
  });
  console.log("─".repeat(52));
}

async function main(): Promise<void> {
  const snapshot = await resolveSnapshot();
  const now = new Date();
  const { dataset, provenance } = buildDataset(snapshot, now);

  const seedPath = writeSeedSql(dataset, provenance, {
    source: snapshot.source,
    live: snapshot.live,
    generatedAt: now.toISOString(),
  });
  console.log(`✓ Wrote seed snapshot → ${seedPath}`);

  printSummary(dataset, provenance);

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log(
      "\nℹ No SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY set — skipped the upsert.\n" +
        "  Seed the DB by running supabase/seed.sql, or set both vars and re-run.",
    );
    return;
  }

  console.log("\nUpserting into Supabase…");
  const results = await loadDataset(url, serviceKey, dataset);
  let failed = 0;
  for (const r of results) {
    if (r.error) {
      failed++;
      console.error(`  ✗ ${r.table}: ${r.error}`);
    } else {
      console.log(`  ✓ ${r.table}: ${r.count} rows upserted`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} table(s) failed to load.`);
    process.exitCode = 1;
  } else {
    console.log("\n✓ Ingest complete.");
  }
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exitCode = 1;
});
