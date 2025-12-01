/**
 * POST /api/days/:id - Update énoncés/inputs
 * Saves to BOTH database AND files
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "~/server/utils/db";

interface UpdateDayBody {
  puzzle1_md?: string | null;
  puzzle2_md?: string | null;
  sample_input?: string | null;
  sample_expected_p1?: string | null;
  sample_expected_p2?: string | null;
  final_input?: string | null;
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

  const body = await readBody<UpdateDayBody>(event);

  const db = getDb();

  // Build update query dynamically
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowedFields = [
    "puzzle1_md",
    "puzzle2_md",
    "sample_input",
    "sample_expected_p1",
    "sample_expected_p2",
    "final_input",
  ];

  for (const field of allowedFields) {
    const value = body[field as keyof UpdateDayBody];
    if (value !== undefined) {
      fields.push(`${field} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No fields to update",
    });
  }

  values.push(dayId);

  db.prepare(`UPDATE days SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

  // Also write to files in core/data/dayXX
  const dayStr = dayId.toString().padStart(2, "0");
  const rootDir = join(process.cwd(), "..", "..");
  const dataDir = join(rootDir, "core", "data", `day${dayStr}`);

  // Ensure directory exists
  await mkdir(dataDir, { recursive: true });

  // Write each file if provided and not null
  if (body.puzzle1_md) {
    await writeFile(join(dataDir, "puzzle1.md"), body.puzzle1_md, "utf-8");
  }

  if (body.puzzle2_md) {
    await writeFile(join(dataDir, "puzzle2.md"), body.puzzle2_md, "utf-8");
  }

  if (body.sample_input) {
    await writeFile(join(dataDir, "sample.txt"), body.sample_input, "utf-8");
  }

  if (body.final_input) {
    await writeFile(join(dataDir, "input.txt"), body.final_input, "utf-8");
  }

  // Write sample.expected.json if either expected value is provided
  if (body.sample_expected_p1 || body.sample_expected_p2) {
    // Read current expected from DB
    const day = db.prepare("SELECT sample_expected_p1, sample_expected_p2 FROM days WHERE id = ?").get(dayId) as {
      sample_expected_p1: string | null;
      sample_expected_p2: string | null;
    };

    const expected = {
      part1: day.sample_expected_p1,
      part2: day.sample_expected_p2,
    };

    await writeFile(join(dataDir, "sample.expected.json"), JSON.stringify(expected, null, 2), "utf-8");
  }

  // Return updated day
  const day = db.prepare("SELECT * FROM days WHERE id = ?").get(dayId);

  return day;
});
