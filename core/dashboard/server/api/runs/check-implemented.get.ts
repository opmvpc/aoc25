/**
 * GET /api/runs/check-implemented - Vérifie quels fichiers sont implémentés
 *
 * Retourne une map agent/day/part/lang -> boolean (implémenté ou non)
 * Un fichier est considéré non implémenté s'il contient "NOT_IMPLEMENTED" ou "TODO: Implement"
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

interface ImplementedMap {
  [key: string]: boolean; // "agent-day-part-lang" -> true/false
}

const NOT_IMPLEMENTED_MARKERS = [
  "NOT_IMPLEMENTED",
  "TODO: Implement solution",
  'return "NOT_IMPLEMENTED"',
];

async function isFileImplemented(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const content = await readFile(filePath, "utf-8");

    // Check for not-implemented markers
    for (const marker of NOT_IMPLEMENTED_MARKERS) {
      if (content.includes(marker)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export default defineEventHandler(async () => {
  const rootDir = join(process.cwd(), "..", "..");
  const agents = ["claude", "codex", "gemini"] as const;
  const languages = ["ts", "c"] as const;
  const parts = [1, 2] as const;
  const days = Array.from({ length: 13 }, (_, i) => i); // 0-12

  const implemented: ImplementedMap = {};

  const checks: Promise<void>[] = [];

  for (const agent of agents) {
    for (const day of days) {
      for (const part of parts) {
        for (const lang of languages) {
          const key = `${agent}-${day}-${part}-${lang}`;

          // Day 12 Part 2 is a free star - always "implemented"
          if (day === 12 && part === 2) {
            implemented[key] = true;
            continue;
          }

          const dayStr = day.toString().padStart(2, "0");
          const ext = lang === "ts" ? "ts" : "c";
          const filePath = join(
            rootDir,
            "agents",
            agent,
            lang,
            `day${dayStr}`,
            `part${part}.${ext}`
          );

          checks.push(
            isFileImplemented(filePath).then((isImpl) => {
              implemented[key] = isImpl;
            })
          );
        }
      }
    }
  }

  await Promise.all(checks);

  return implemented;
});
