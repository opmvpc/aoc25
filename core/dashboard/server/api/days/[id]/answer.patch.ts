/**
 * PATCH /api/days/:id/answer - Ajouter réponse finale
 * Saves to BOTH database AND files
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "~/server/utils/db";

interface SetAnswerBody {
  part: 1 | 2;
  answer: string;
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

  const body = await readBody<SetAnswerBody>(event);

  if (body.part !== 1 && body.part !== 2) {
    throw createError({
      statusCode: 400,
      message: "Invalid part (must be 1 or 2)",
    });
  }

  if (typeof body.answer !== "string") {
    throw createError({
      statusCode: 400,
      message: "Answer must be a string",
    });
  }

  const db = getDb();
  const column = body.part === 1 ? "answer_p1" : "answer_p2";

  db.prepare(`UPDATE days SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(body.answer, dayId);

  // Also write to answers.json file
  const dayStr = dayId.toString().padStart(2, "0");
  const rootDir = join(process.cwd(), "..", "..");
  const dataDir = join(rootDir, "core", "data", `day${dayStr}`);
  const answersPath = join(dataDir, "answers.json");

  // Ensure directory exists
  await mkdir(dataDir, { recursive: true });

  // Read current answers or create new
  let answers: { part1: string | null; part2: string | null } = { part1: null, part2: null };
  try {
    const content = await readFile(answersPath, "utf-8");
    answers = JSON.parse(content);
  } catch {
    // File doesn't exist or is invalid, use defaults
  }

  // Update the appropriate part
  if (body.part === 1) {
    answers.part1 = body.answer;
  } else {
    answers.part2 = body.answer;
  }

  await writeFile(answersPath, JSON.stringify(answers, null, 2), "utf-8");

  // Return updated day
  const day = db.prepare("SELECT * FROM days WHERE id = ?").get(dayId);

  return day;
});
