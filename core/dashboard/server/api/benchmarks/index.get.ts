/**
 * GET /api/benchmarks - Historique benchmarks
 */

import { getDb, sqliteBool } from "~/server/utils/db";

interface BenchmarkRow {
  id: number;
  agent: string;
  day: number;
  part: number;
  language: string;
  num_runs: number;
  answer: string | null;
  is_correct: number | null;
  avg_time_ms: number | null;
  min_time_ms: number | null;
  max_time_ms: number | null;
  std_dev_ms: number | null;
  p50_time_ms: number | null;
  p95_time_ms: number | null;
  p99_time_ms: number | null;
  created_at: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = parseInt(query.limit as string) || 50;
  const day = query.day ? parseInt(query.day as string) : null;
  const agent = query.agent as string | null;

  const db = getDb();

  let sql = "SELECT * FROM benchmark_sessions WHERE 1=1";
  const params: unknown[] = [];

  if (day !== null) {
    sql += " AND day = ?";
    params.push(day);
  }

  if (agent) {
    sql += " AND agent = ?";
    params.push(agent);
  }

  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const benchmarks = db.prepare(sql).all(...params) as BenchmarkRow[];

  return benchmarks.map((b) => ({
    ...b,
    is_correct: sqliteBool(b.is_correct),
  }));
});
