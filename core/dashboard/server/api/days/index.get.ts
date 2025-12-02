/**
 * GET /api/days - Liste tous les jours avec derniers runs
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

export default defineEventHandler(async () => {
  const db = getDb();

  // Get all days
  const days = db.prepare("SELECT * FROM days ORDER BY id").all() as DayRow[];

  // Get latest runs for each day/agent/language/part combo
  const latestRuns = db.prepare(`
    SELECT r.* FROM runs r
    INNER JOIN (
      SELECT day, agent, language, part, MAX(created_at) as max_created
      FROM runs
      WHERE is_sample = 0
      GROUP BY day, agent, language, part
    ) latest ON r.day = latest.day
      AND r.agent = latest.agent
      AND r.language = latest.language
      AND r.part = latest.part
      AND r.created_at = latest.max_created
    ORDER BY r.day, r.agent, r.language, r.part
  `).all() as RunRow[];

  // Group runs by day
  const runsByDay = new Map<number, RunRow[]>();
  for (const run of latestRuns) {
    if (!runsByDay.has(run.day)) {
      runsByDay.set(run.day, []);
    }
    runsByDay.get(run.day)!.push(run);
  }

  // Build response
  return days.map((day) => {
    const dayRuns = runsByDay.get(day.id) || [];

    // Build latestRuns structure
    const latestRunsMap: Record<string, Record<string, Record<string, unknown>>> = {};

    for (const run of dayRuns) {
      if (!latestRunsMap[run.agent]) {
        latestRunsMap[run.agent] = {};
      }
      if (!latestRunsMap[run.agent]![run.language]) {
        latestRunsMap[run.agent]![run.language] = {};
      }

      const partKey = run.part === 1 ? "part1" : "part2";
      latestRunsMap[run.agent]![run.language]![partKey] = {
        id: run.id,
        agent: run.agent,
        day: run.day,
        part: run.part,
        language: run.language,
        answer: run.answer,
        time_ms: run.time_ms,
        is_correct: sqliteBool(run.is_correct),
        is_sample: run.is_sample === 1,
        error: run.error,
        created_at: run.created_at,
      };
    }

    return {
      ...day,
      latestRuns: latestRunsMap,
    };
  });
});
