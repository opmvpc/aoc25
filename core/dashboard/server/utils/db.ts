/**
 * 🏆 AoC 2025 Battle Royale - Database Utilities
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// Singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const config = useRuntimeConfig();
  const dbPath = config.dbPath || "./data/aoc25.db";

  // Ensure directory exists
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Initialize schema
  initSchema(db);

  return db;
}

function initSchema(database: Database.Database): void {
  const schemaPath = join(process.cwd(), "..", "db", "schema.sql");

  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, "utf-8");
    database.exec(schema);
  } else {
    // Inline schema if file not found
    database.exec(`
      CREATE TABLE IF NOT EXISTS days (
        id INTEGER PRIMARY KEY,
        puzzle1_md TEXT,
        puzzle2_md TEXT,
        sample_input TEXT,
        sample_expected_p1 TEXT,
        sample_expected_p2 TEXT,
        final_input TEXT,
        answer_p1 TEXT,
        answer_p2 TEXT,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL CHECK (agent IN ('claude', 'codex', 'gemini')),
        day INTEGER NOT NULL,
        part INTEGER NOT NULL CHECK (part IN (1, 2)),
        language TEXT NOT NULL CHECK (language IN ('ts', 'c')),
        answer TEXT,
        time_ms REAL NOT NULL,
        is_correct INTEGER,
        is_sample INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS benchmark_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL CHECK (agent IN ('claude', 'codex', 'gemini')),
        day INTEGER NOT NULL,
        part INTEGER NOT NULL CHECK (part IN (1, 2)),
        language TEXT NOT NULL CHECK (language IN ('ts', 'c')),
        num_runs INTEGER NOT NULL DEFAULT 100,
        answer TEXT,
        is_correct INTEGER,
        avg_time_ms REAL,
        min_time_ms REAL,
        max_time_ms REAL,
        std_dev_ms REAL,
        p50_time_ms REAL,
        p95_time_ms REAL,
        p99_time_ms REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS benchmark_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        run_index INTEGER NOT NULL,
        time_ms REAL NOT NULL,
        FOREIGN KEY (session_id) REFERENCES benchmark_sessions(id) ON DELETE CASCADE
      );
    `);
  }

  // Initialize days 0-12 (Day 0 is test day, Days 1-12 are competition days)
  const insertDay = database.prepare("INSERT OR IGNORE INTO days (id) VALUES (?)");
  for (let i = 0; i <= 12; i++) {
    insertDay.run(i);
  }
}

// Helper to convert SQLite booleans
export function sqliteBool(val: number | null): boolean | null {
  if (val === null) return null;
  return val === 1;
}
