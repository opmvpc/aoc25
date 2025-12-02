#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Publish Day Script
 *
 * Copie les données d'un jour depuis core/data vers tous les agents
 * ET met à jour les réponses attendues dans la base de données
 *
 * Usage: npm run publish-day -- <day>
 */

import { mkdir, copyFile, readdir, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import Database from "better-sqlite3";

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

async function updateDatabase(day: number): Promise<void> {
  const dayStr = day.toString().padStart(2, "0");
  const dbPath = join(ROOT, "core", "dashboard", "data", "aoc25.db");

  if (!existsSync(dbPath)) {
    console.log("  ⚠️  Database not found, skipping DB update");
    return;
  }

  // Read answers.json
  const answersPath = join(
    ROOT,
    "core",
    "data",
    `day${dayStr}`,
    "answers.json"
  );
  let answers = { part1: null, part2: null };
  try {
    const content = await readFile(answersPath, "utf-8");
    answers = JSON.parse(content);
  } catch {
    console.log("  ⚠️  No answers.json found");
  }

  // Read sample.expected.json
  const sampleExpectedPath = join(
    ROOT,
    "core",
    "data",
    `day${dayStr}`,
    "sample.expected.json"
  );
  let sampleExpected = { part1: null, part2: null };
  try {
    const content = await readFile(sampleExpectedPath, "utf-8");
    sampleExpected = JSON.parse(content);
  } catch {
    console.log("  ⚠️  No sample.expected.json found");
  }

  const db = new Database(dbPath);

  // Update day with answers and mark as published
  db.prepare(
    `
    UPDATE days SET
      answer_p1 = ?,
      answer_p2 = ?,
      sample_expected_p1 = ?,
      sample_expected_p2 = ?,
      published_at = COALESCE(published_at, datetime('now'))
    WHERE id = ?
  `
  ).run(
    answers.part1,
    answers.part2,
    sampleExpected.part1,
    sampleExpected.part2,
    day
  );

  db.close();

  console.log(`  📊 Database updated:`);
  if (answers.part1) console.log(`     Part 1: ${answers.part1}`);
  if (answers.part2) console.log(`     Part 2: ${answers.part2}`);
  if (sampleExpected.part1)
    console.log(`     Sample P1: ${sampleExpected.part1}`);
  if (sampleExpected.part2)
    console.log(`     Sample P2: ${sampleExpected.part2}`);
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

  // Update database with answers
  console.log(`\n📊 Updating database...`);
  await updateDatabase(day);
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
