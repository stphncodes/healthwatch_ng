import { config } from "dotenv";
import { fetchCholeraSnapshot } from "./ingest/sources/whoCholera";
import { buildDataset } from "./ingest/transform";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });
config();

async function main() {
  const snapshot = await fetchCholeraSnapshot();

  const { dataset } = buildDataset(
    snapshot,
    new Date()
  );

  const rows = dataset.weekly_case_trends;

  const header =
    "week,cholera,lassa_fever,meningitis\n";

  const csv =
    header +
    rows
      .map(
        (r) =>
          `${r.week},${r.cholera},${r.lassa_fever},${r.meningitis}`
      )
      .join("\n");

  const outputPath = path.join(
    process.cwd(),
    "ml",
    "data",
    "cholera_dataset.csv"
  );

  fs.mkdirSync(
    path.dirname(outputPath),
    { recursive: true }
  );

  fs.writeFileSync(outputPath, csv);

  console.log(
    `✓ ML dataset exported: ${outputPath}`
  );
}

main();