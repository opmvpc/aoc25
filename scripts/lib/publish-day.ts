/**
 * 🏗️ AoC 2025 Battle Royale - Publish Day Library
 * Fonctions exportables pour publier les données vers les agents
 */

import { mkdir, copyFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export const AGENTS = ["claude", "codex", "gemini"] as const;
export type Agent = (typeof AGENTS)[number];

export interface PublishOptions {
  root: string;
  day: number;
  agents?: readonly string[];
  silent?: boolean;
}

export interface PublishResult {
  success: boolean;
  copiedFiles: string[];
  errors: string[];
}

async function copyDir(
  src: string,
  dest: string,
  copiedFiles: string[]
): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, copiedFiles);
    } else {
      await copyFile(srcPath, destPath);
      copiedFiles.push(entry.name);
    }
  }
}

export async function publishDay(
  options: PublishOptions
): Promise<PublishResult> {
  const { root, day, agents = AGENTS, silent = false } = options;
  const dayStr = day.toString().padStart(2, "0");
  const sourceDir = join(root, "core", "data", `day${dayStr}`);

  const copiedFiles: string[] = [];
  const errors: string[] = [];

  // Check if source exists
  try {
    const srcStat = await stat(sourceDir);
    if (!srcStat.isDirectory()) {
      errors.push(`core/data/day${dayStr} is not a directory`);
      return { success: false, copiedFiles, errors };
    }
  } catch {
    errors.push(`core/data/day${dayStr} does not exist`);
    return { success: false, copiedFiles, errors };
  }

  if (!silent) {
    console.log(`\n📦 Publishing Day ${dayStr} to all agents...\n`);
  }

  for (const agent of agents) {
    const destDir = join(root, "agents", agent, "data", `day${dayStr}`);

    if (!silent) console.log(`\n🤖 ${agent}:`);

    try {
      const agentCopied: string[] = [];
      await copyDir(sourceDir, destDir, agentCopied);
      copiedFiles.push(...agentCopied);
      if (!silent) {
        for (const file of agentCopied) {
          console.log(`  📄 ${file}`);
        }
        console.log(`  ✅ Done`);
      }
    } catch (err) {
      const errMsg = `Failed for ${agent}: ${
        err instanceof Error ? err.message : String(err)
      }`;
      errors.push(errMsg);
      if (!silent) console.error(`  ❌ ${errMsg}`);
    }
  }

  if (!silent && errors.length === 0) {
    console.log(`\n✨ Day ${dayStr} published to all agents!`);
  }

  return {
    success: errors.length === 0,
    copiedFiles,
    errors,
  };
}

export function validateDay(day: number): { valid: boolean; error?: string } {
  if (isNaN(day) || day < 0 || day > 25) {
    return { valid: false, error: `Invalid day: ${day} (must be 0-25)` };
  }
  return { valid: true };
}
