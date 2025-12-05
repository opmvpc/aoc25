/**
 * GET /api/stars - Get total star count
 * 
 * A star is earned when any agent has at least one correct solution
 * for a day/part combination (on final input, not sample).
 * 
 * Max stars = 12 days × 2 parts × 3 agents = 72
 */

import { getDb } from "~/server/utils/db";

export default defineEventHandler(() => {
  const db = getDb();

  // Count unique (agent, day, part) combinations with at least one correct run
  // Only count final input (is_sample = 0), only days 1-12 (not day 0)
  const result = db
    .prepare(
      `
      SELECT COUNT(*) as stars FROM (
        SELECT DISTINCT agent, day, part
        FROM runs
        WHERE is_correct = 1
          AND is_sample = 0
          AND day >= 1
          AND day <= 12
      )
    `
    )
    .get() as { stars: number };

  // Also get breakdown by agent
  const byAgent = db
    .prepare(
      `
      SELECT agent, COUNT(*) as stars FROM (
        SELECT DISTINCT agent, day, part
        FROM runs
        WHERE is_correct = 1
          AND is_sample = 0
          AND day >= 1
          AND day <= 12
      )
      GROUP BY agent
    `
    )
    .all() as { agent: string; stars: number }[];

  const agentStars: Record<string, number> = {
    claude: 0,
    codex: 0,
    gemini: 0,
  };

  for (const row of byAgent) {
    agentStars[row.agent] = row.stars;
  }

  return {
    total: result.stars,
    max: 72, // 12 days × 2 parts × 3 agents
    byAgent: agentStars,
  };
});
