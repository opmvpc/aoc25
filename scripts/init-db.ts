#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Initialize Database
 *
 * Creates/resets the SQLite database with the correct schema.
 * Can be run standalone or as part of scaffold.
 *
 * Usage: npm run init-db [--reset]
 *   --reset: Delete existing DB and create fresh
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const DB_PATH = join(ROOT, "core", "dashboard", "data", "aoc25.db");
const SCHEMA_PATH = join(ROOT, "core", "db", "schema.sql");

const DAYS = 12; // Competition days (1-12), plus day 0 for testing

function initDb(reset = false): void {
  console.log("🗄️  AoC 2025 Battle Royale - Database Init\n");
  console.log("═".repeat(50));

  // Handle reset flag
  if (reset && existsSync(DB_PATH)) {
    console.log(`\n🗑️  Deleting existing database: ${DB_PATH}`);
    unlinkSync(DB_PATH);
    // Also delete WAL files if they exist
    if (existsSync(DB_PATH + "-wal")) unlinkSync(DB_PATH + "-wal");
    if (existsSync(DB_PATH + "-shm")) unlinkSync(DB_PATH + "-shm");
  }

  // Ensure directory exists
  const dbDir = dirname(DB_PATH);
  if (!existsSync(dbDir)) {
    console.log(`\n📁 Creating directory: ${dbDir}`);
    mkdirSync(dbDir, { recursive: true });
  }

  // Create database
  console.log(`\n📝 Opening database: ${DB_PATH}`);
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Apply schema
  if (existsSync(SCHEMA_PATH)) {
    console.log(`\n📜 Applying schema from: ${SCHEMA_PATH}`);
    const schema = readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);
  } else {
    console.error(`\n❌ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  // Initialize days 0-12
  console.log(`\n🎄 Initializing days 0-${DAYS}...`);
  const insertDay = db.prepare("INSERT OR IGNORE INTO days (id) VALUES (?)");

  const insertMany = db.transaction((days: number[]) => {
    for (const day of days) {
      insertDay.run(day);
    }
  });

  const dayIds = Array.from({ length: DAYS + 1 }, (_, i) => i);
  insertMany(dayIds);

  // Verify
  const count = db.prepare("SELECT COUNT(*) as count FROM days").get() as { count: number };
  console.log(`\n✅ Database initialized with ${count.count} days`);

  // Show summary
  const summary = db
    .prepare("SELECT id, published_at FROM days ORDER BY id")
    .all() as { id: number; published_at: string | null }[];

  console.log("\n📅 Days in database:");
  for (const day of summary) {
    const status = day.published_at ? "📤 Published" : "⏳ Not published";
    const label = day.id === 0 ? "(Test Day)" : "";
    console.log(`   Day ${day.id.toString().padStart(2, "0")} ${label} - ${status}`);
  }

  db.close();

  console.log("\n" + "═".repeat(50));
  console.log("✨ Database ready!");
}

// CLI
const args = process.argv.slice(2);
const reset = args.includes("--reset") || args.includes("-r");

initDb(reset);
