/**
 * GET /api/days/:id - Détail d'un jour
 */

import { getDb, sqliteBool } from "~/server/utils/db";

interface DayRow {
  id: number;
  puzzle1_md: string | null;
  puzzle2_md: string | null;
  sample_input: string | null;
  sample_expected_p1: string | null;
  sample_expected_p2: string | null;
  final_input: string | null;
  answer_p1: string | null;
  answer_p2: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RunRow {
  id: number;
  agent: string;
  day: number;
  part: number;
  language: string;
  answer: string | null;
  time_ms: number;
  is_correct: number | null;
  is_sample: number;
  error: string | null;
  created_at: string;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const dayId = parseInt(id!, 10);

  if (isNaN(dayId) || dayId < 1 || dayId > 25) {
    throw createError({
      statusCode: 400,
      message: "Invalid day ID (must be 1-25)",
    });
  }

  const db = getDb();

  // Get day
  const day = db.prepare("SELECT * FROM days WHERE id = ?").get(dayId) as DayRow | undefined;

  if (!day) {
    throw createError({
      statusCode: 404,
      message: "Day not found",
    });
  }

  // Get all runs for this day (last 100)
  const runs = db.prepare(`
    SELECT * FROM runs WHERE day = ? ORDER BY created_at DESC LIMIT 100
  `).all(dayId) as RunRow[];

  // Get benchmarks for this day
  const benchmarks = db.prepare(`
    SELECT * FROM benchmark_sessions WHERE day = ? ORDER BY created_at DESC LIMIT 20
  `).all(dayId);

  return {
    ...day,
    runs: runs.map((run) => ({
      ...run,
      is_correct: sqliteBool(run.is_correct),
      is_sample: run.is_sample === 1,
    })),
    benchmarks,
  };
});
