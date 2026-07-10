// Module: Ingestion Pipeline — Deterministic Helpers | Owner: Data Engineer
// Pure, seedable helpers so a given run produces a stable dataset (idempotent
// upserts, small seed.sql diffs). No Math.random anywhere — every "random"
// value is derived from a fixed seed string.

/** FNV-1a hash of a string → uint32. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Deterministic mulberry32 PRNG seeded from a string. Returns floats in [0,1). */
export function rng(seed: string): () => number {
  let s = hash(seed);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a 0..1 float. */
export function intFrom(r: number, min: number, max: number): number {
  return Math.floor(r * (max - min + 1)) + min;
}

/** ISO-8601 week number (1–53) for a date. */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / 86400000 / 7 -
        (((firstThursday.getUTCDay() + 6) % 7) - 3) / 7,
    )
  );
}

/** `n` ascending epi-week labels ending at `end` (wraps below 1 into the 50s). */
export function recentWeeks(n: number, end: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let w = end - i;
    if (w < 1) w += 52;
    out.push(`W${w}`);
  }
  return out;
}

/** `n` ascending epi-week labels starting just after `start`. */
export function futureWeeks(n: number, start: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    let w = start + i;
    if (w > 52) w -= 52;
    out.push(`W${w}`);
  }
  return out;
}

/** Whole weeks between two ISO dates (clamped to [min, max]). */
export function weeksBetween(
  firstIso: string,
  lastIso: string,
  min = 8,
  max = 26,
): number {
  const a = Date.parse(firstIso);
  const b = Date.parse(lastIso);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 20;
  const weeks = Math.round((b - a) / (7 * 24 * 3600_000));
  return Math.min(max, Math.max(min, weeks));
}

/**
 * `n` deterministic seasonal weights that sum to 1 — a smooth wet-season hump
 * (cholera peaks mid-window) plus seeded jitter. Used to disaggregate a real
 * cumulative total into a plausible weekly shape without inventing magnitude.
 */
export function seasonalWeights(n: number, seed: string): number[] {
  const r = rng(seed);
  const raw = Array.from({ length: n }, (_, i) => {
    const hump = Math.sin((Math.PI * (i + 1)) / (n + 1)); // 0→1→0 across window
    return hump * hump + 0.15 + r() * 0.2;
  });
  const sum = raw.reduce((s, w) => s + w, 0);
  return raw.map((w) => w / sum);
}
