/**
 * POST /api/publish/:day - Publier vers agents
 */

import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getDb } from "~/server/utils/db";

const AGENTS = ["claude", "codex", "gemini"] as const;

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

export default defineEventHandler(async (event) => {
  const dayParam = getRouterParam(event, "day");
  const dayId = parseInt(dayParam!, 10);

  if (isNaN(dayId) || dayId < 1 || dayId > 25) {
    throw createError({
      statusCode: 400,
      message: "Invalid day (must be 1-25)",
    });
  }

  const dayStr = dayId.toString().padStart(2, "0");

  // Paths - relative to dashboard cwd (core/dashboard)
  const rootDir = join(process.cwd(), "..", "..");
  const sourceDir = join(rootDir, "core", "data", `day${dayStr}`);

  if (!existsSync(sourceDir)) {
    throw createError({
      statusCode: 404,
      message: `Source directory not found: core/data/day${dayStr}`,
    });
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const agent of AGENTS) {
    const destDir = join(rootDir, "agents", agent, "data", `day${dayStr}`);

    try {
      await copyDir(sourceDir, destDir);
      results[agent] = { success: true };
    } catch (err) {
      results[agent] = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Update published_at in database
  const db = getDb();
  db.prepare("UPDATE days SET published_at = CURRENT_TIMESTAMP WHERE id = ?").run(dayId);

  return {
    day: dayId,
    published: true,
    results,
  };
});
