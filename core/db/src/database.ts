/**
 * 🏆 AoC 2025 Battle Royale - Database Class
 */

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Day,
  Run,
  BenchmarkSession,
  BenchmarkRun,
  CreateRunInput,
  UpdateDayInput,
  CreateBenchmarkInput,
  BenchmarkStats,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function computeStats(times: number[]): BenchmarkStats {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const avg = times.reduce((a, b) => a + b, 0) / n;
  const min = sorted[0]!;
  const max = sorted[n - 1]!;

  const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(n - 1, idx))]!;
  };

  return {
    avg,
    min,
    max,
    stdDev,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
  };
}

export class AocDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.init();
  }

  private init(): void {
    // Read and execute schema
    const schemaPath = join(__dirname, "..", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    this.db.exec(schema);

    // Initialize days 1-25 if not exist
    const insertDay = this.db.prepare(`
      INSERT OR IGNORE INTO days (id) VALUES (?)
    `);

    for (let i = 1; i <= 25; i++) {
      insertDay.run(i);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Days
  // ═══════════════════════════════════════════════════════════════

  getAllDays(): Day[] {
    return this.db.prepare("SELECT * FROM days ORDER BY id").all() as Day[];
  }

  getDay(id: number): Day | undefined {
    return this.db.prepare("SELECT * FROM days WHERE id = ?").get(id) as Day | undefined;
  }

  updateDay(id: number, data: UpdateDayInput): void {
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    this.db.prepare(`UPDATE days SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  setDayAnswer(id: number, part: 1 | 2, answer: string): void {
    const column = part === 1 ? "answer_p1" : "answer_p2";
    this.db.prepare(`UPDATE days SET ${column} = ? WHERE id = ?`).run(answer, id);
  }

  publishDay(id: number): void {
    this.db.prepare("UPDATE days SET published_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // Runs
  // ═══════════════════════════════════════════════════════════════

  createRun(input: CreateRunInput): number {
    const result = this.db.prepare(`
      INSERT INTO runs (agent, day, part, language, answer, time_ms, is_correct, is_sample, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.agent,
      input.day,
      input.part,
      input.language,
      input.answer ?? null,
      input.time_ms,
      input.is_correct === undefined ? null : input.is_correct ? 1 : 0,
      input.is_sample ? 1 : 0,
      input.error ?? null
    );

    return Number(result.lastInsertRowid);
  }

  getRun(id: number): Run | undefined {
    const row = this.db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as {
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      answer: string | null;
      time_ms: number;
      is_correct: number | null;
      is_sample: number;
      error: string | null;
      created_at: string;
    } | undefined;

    if (!row) return undefined;

    return {
      ...row,
      agent: row.agent as Run["agent"],
      part: row.part as Run["part"],
      language: row.language as Run["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
      is_sample: row.is_sample === 1,
    };
  }

  getRunsForDay(day: number): Run[] {
    const rows = this.db.prepare(`
      SELECT * FROM runs WHERE day = ? ORDER BY created_at DESC
    `).all(day) as Array<{
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      answer: string | null;
      time_ms: number;
      is_correct: number | null;
      is_sample: number;
      error: string | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      ...row,
      agent: row.agent as Run["agent"],
      part: row.part as Run["part"],
      language: row.language as Run["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
      is_sample: row.is_sample === 1,
    }));
  }

  getLatestRuns(limit = 50): Run[] {
    const rows = this.db.prepare(`
      SELECT * FROM runs ORDER BY created_at DESC LIMIT ?
    `).all(limit) as Array<{
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      answer: string | null;
      time_ms: number;
      is_correct: number | null;
      is_sample: number;
      error: string | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      ...row,
      agent: row.agent as Run["agent"],
      part: row.part as Run["part"],
      language: row.language as Run["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
      is_sample: row.is_sample === 1,
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // Benchmarks
  // ═══════════════════════════════════════════════════════════════

  createBenchmark(input: CreateBenchmarkInput): number {
    const stats = computeStats(input.times);

    const result = this.db.prepare(`
      INSERT INTO benchmark_sessions (
        agent, day, part, language, num_runs, answer, is_correct,
        avg_time_ms, min_time_ms, max_time_ms, std_dev_ms,
        p50_time_ms, p95_time_ms, p99_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.agent,
      input.day,
      input.part,
      input.language,
      input.num_runs,
      input.answer ?? null,
      input.is_correct === undefined ? null : input.is_correct ? 1 : 0,
      stats.avg,
      stats.min,
      stats.max,
      stats.stdDev,
      stats.p50,
      stats.p95,
      stats.p99
    );

    const sessionId = Number(result.lastInsertRowid);

    // Insert individual runs
    const insertRun = this.db.prepare(`
      INSERT INTO benchmark_runs (session_id, run_index, time_ms)
      VALUES (?, ?, ?)
    `);

    const insertMany = this.db.transaction((times: number[]) => {
      times.forEach((time, index) => {
        insertRun.run(sessionId, index, time);
      });
    });

    insertMany(input.times);

    return sessionId;
  }

  getBenchmarkSession(id: number): BenchmarkSession | undefined {
    const row = this.db.prepare("SELECT * FROM benchmark_sessions WHERE id = ?").get(id) as {
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      num_runs: number;
      answer: string | null;
      is_correct: number | null;
      avg_time_ms: number | null;
      min_time_ms: number | null;
      max_time_ms: number | null;
      std_dev_ms: number | null;
      p50_time_ms: number | null;
      p95_time_ms: number | null;
      p99_time_ms: number | null;
      created_at: string;
    } | undefined;

    if (!row) return undefined;

    return {
      ...row,
      agent: row.agent as BenchmarkSession["agent"],
      part: row.part as BenchmarkSession["part"],
      language: row.language as BenchmarkSession["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
    };
  }

  getBenchmarkRuns(sessionId: number): BenchmarkRun[] {
    return this.db.prepare(`
      SELECT * FROM benchmark_runs WHERE session_id = ? ORDER BY run_index
    `).all(sessionId) as BenchmarkRun[];
  }

  getLatestBenchmarks(limit = 20): BenchmarkSession[] {
    const rows = this.db.prepare(`
      SELECT * FROM benchmark_sessions ORDER BY created_at DESC LIMIT ?
    `).all(limit) as Array<{
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      num_runs: number;
      answer: string | null;
      is_correct: number | null;
      avg_time_ms: number | null;
      min_time_ms: number | null;
      max_time_ms: number | null;
      std_dev_ms: number | null;
      p50_time_ms: number | null;
      p95_time_ms: number | null;
      p99_time_ms: number | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      ...row,
      agent: row.agent as BenchmarkSession["agent"],
      part: row.part as BenchmarkSession["part"],
      language: row.language as BenchmarkSession["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
    }));
  }

  getBenchmarksForDay(day: number): BenchmarkSession[] {
    const rows = this.db.prepare(`
      SELECT * FROM benchmark_sessions WHERE day = ? ORDER BY created_at DESC
    `).all(day) as Array<{
      id: number;
      agent: string;
      day: number;
      part: number;
      language: string;
      num_runs: number;
      answer: string | null;
      is_correct: number | null;
      avg_time_ms: number | null;
      min_time_ms: number | null;
      max_time_ms: number | null;
      std_dev_ms: number | null;
      p50_time_ms: number | null;
      p95_time_ms: number | null;
      p99_time_ms: number | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      ...row,
      agent: row.agent as BenchmarkSession["agent"],
      part: row.part as BenchmarkSession["part"],
      language: row.language as BenchmarkSession["language"],
      is_correct: row.is_correct === null ? null : row.is_correct === 1,
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // Utils
  // ═══════════════════════════════════════════════════════════════

  close(): void {
    this.db.close();
  }
}
