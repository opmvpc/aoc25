#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Publish Day Script
 *
 * Copie les données d'un jour depuis core/data vers tous les agents
 *
 * Usage: npm run publish-day -- <day>
 */

import { mkdir, copyFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
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
      console.log(`  📄 ${entry.name}`);
    }
  }
}

async function publishDay(day: number): Promise<void> {
  const dayStr = day.toString().padStart(2, "0");
  const sourceDir = join(ROOT, "core", "data", `day${dayStr}`);

  // Check if source exists
  try {
    const srcStat = await stat(sourceDir);
    if (!srcStat.isDirectory()) {
      console.error(`❌ core/data/day${dayStr} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`❌ core/data/day${dayStr} does not exist`);
    process.exit(1);
  }

  console.log(`\n📦 Publishing Day ${dayStr} to all agents...\n`);

  for (const agent of AGENTS) {
    const destDir = join(ROOT, "agents", agent, "data", `day${dayStr}`);
    console.log(`\n🤖 ${agent}:`);

    try {
      await copyDir(sourceDir, destDir);
      console.log(`  ✅ Done`);
    } catch (err) {
      console.error(
        `  ❌ Failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  console.log(`\n✨ Day ${dayStr} published to all agents!`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npm run publish-day -- <day>");
    console.error("Example: npm run publish-day -- 1");
    process.exit(1);
  }

  const day = parseInt(args[0]!, 10);

  if (isNaN(day) || day < 0 || day > 25) {
    console.error(`❌ Invalid day: ${args[0]} (must be 0-25)`);
    process.exit(1);
  }

  await publishDay(day);
}

main().catch((err) => {
  console.error("❌ Publish failed:", err);
  process.exit(1);
});
