/**
 * 🧪 Tests - Database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { mkdir, rm, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { AocDatabase } from "../core/db/src/database.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-db");
const DB_PATH = join(TEST_ROOT, "test.db");

describe("database", () => {
  let db: AocDatabase;

  beforeAll(async () => {
    await mkdir(TEST_ROOT, { recursive: true });
  });

  afterAll(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up old db
    try {
      await rm(DB_PATH, { force: true });
      await rm(`${DB_PATH}-journal`, { force: true });
      await rm(`${DB_PATH}-wal`, { force: true });
      await rm(`${DB_PATH}-shm`, { force: true });
    } catch {
      // Ignore
    }

    db = new AocDatabase(DB_PATH);
  });

  afterEach(() => {
    db?.close();
  });

  describe("days", () => {
    it("should initialize 25 days", () => {
      const days = db.getAllDays();
      expect(days.length).toBe(25);
      expect(days[0]?.id).toBe(1);
      expect(days[24]?.id).toBe(25);
    });

    it("should get a specific day", () => {
      const day = db.getDay(5);
      expect(day).toBeDefined();
      expect(day?.id).toBe(5);
    });

    it("should return undefined for non-existent day", () => {
      const day = db.getDay(99);
      expect(day).toBeUndefined();
    });

    it("should update a day", () => {
      db.updateDay(1, { puzzle1_md: "# Test Puzzle" });
      const day = db.getDay(1);
      expect(day?.puzzle1_md).toBe("# Test Puzzle");
    });

    it("should set day answer", () => {
      db.setDayAnswer(1, 1, "42");
      db.setDayAnswer(1, 2, "100");

      const day = db.getDay(1);
      expect(day?.answer_p1).toBe("42");
      expect(day?.answer_p2).toBe("100");
    });

    it("should publish a day", () => {
      db.publishDay(1);
      const day = db.getDay(1);
      expect(day?.published_at).not.toBeNull();
    });
  });

  describe("runs", () => {
    it("should create and retrieve a run", () => {
      const runId = db.createRun({
        agent: "claude",
        day: 1,
        part: 1,
        language: "ts",
        answer: "42",
        time_ms: 1.5,
        is_correct: true,
        is_sample: false,
      });

      expect(runId).toBeGreaterThan(0);

      const run = db.getRun(runId);
      expect(run).toBeDefined();
      expect(run?.agent).toBe("claude");
      expect(run?.answer).toBe("42");
      expect(run?.is_correct).toBe(true);
      expect(run?.is_sample).toBe(false);
    });

    it("should handle run with error", () => {
      const runId = db.createRun({
        agent: "codex",
        day: 1,
        part: 2,
        language: "c",
        time_ms: 0,
        is_sample: true,
        error: "Compilation failed",
      });

      const run = db.getRun(runId);
      expect(run?.error).toBe("Compilation failed");
      expect(run?.is_correct).toBeNull();
    });

    it("should get runs for a day", () => {
      db.createRun({
        agent: "claude",
        day: 1,
        part: 1,
        language: "ts",
        time_ms: 1.0,
        is_sample: false,
      });
      db.createRun({
        agent: "codex",
        day: 1,
        part: 1,
        language: "ts",
        time_ms: 2.0,
        is_sample: false,
      });
      db.createRun({
        agent: "claude",
        day: 2,
        part: 1,
        language: "ts",
        time_ms: 1.5,
        is_sample: false,
      });

      const day1Runs = db.getRunsForDay(1);
      expect(day1Runs.length).toBe(2);

      const day2Runs = db.getRunsForDay(2);
      expect(day2Runs.length).toBe(1);
    });

    it("should get latest runs", () => {
      for (let i = 0; i < 10; i++) {
        db.createRun({
          agent: "gemini",
          day: i + 1,
          part: 1,
          language: "ts",
          time_ms: i,
          is_sample: false,
        });
      }

      const latest = db.getLatestRuns(5);
      expect(latest.length).toBe(5);
      // Should be in reverse order (newest first)
      expect(latest[0]?.day).toBe(10);
    });
  });

  describe("benchmarks", () => {
    it("should create benchmark with computed stats", () => {
      const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      const sessionId = db.createBenchmark({
        agent: "claude",
        day: 1,
        part: 1,
        language: "ts",
        num_runs: 10,
        answer: "42",
        is_correct: true,
        times,
      });

      expect(sessionId).toBeGreaterThan(0);

      const session = db.getBenchmarkSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.num_runs).toBe(10);
      expect(session?.avg_time_ms).toBe(55); // Average of 10-100
      expect(session?.min_time_ms).toBe(10);
      expect(session?.max_time_ms).toBe(100);
    });

    it("should store individual benchmark runs", () => {
      const times = [1, 2, 3, 4, 5];

      const sessionId = db.createBenchmark({
        agent: "codex",
        day: 2,
        part: 2,
        language: "c",
        num_runs: 5,
        times,
      });

      const runs = db.getBenchmarkRuns(sessionId);
      expect(runs.length).toBe(5);
      expect(runs[0]?.time_ms).toBe(1);
      expect(runs[4]?.time_ms).toBe(5);
    });

    it("should get benchmarks for a day", () => {
      db.createBenchmark({
        agent: "claude",
        day: 3,
        part: 1,
        language: "ts",
        num_runs: 10,
        times: Array(10).fill(5),
      });

      db.createBenchmark({
        agent: "gemini",
        day: 3,
        part: 2,
        language: "c",
        num_runs: 10,
        times: Array(10).fill(3),
      });

      const benchmarks = db.getBenchmarksForDay(3);
      expect(benchmarks.length).toBe(2);
    });

    it("should get latest benchmarks with limit", () => {
      // Create several benchmarks in different sessions
      for (let i = 0; i < 5; i++) {
        db.createBenchmark({
          agent: "claude",
          day: i + 1,
          part: 1,
          language: "ts",
          num_runs: 10,
          times: Array(10).fill(i + 1),
        });
      }

      const latest = db.getLatestBenchmarks(3);
      expect(latest.length).toBe(3);
      // Should be newest first - last created has day 5
      expect(latest[0]?.day).toBe(5);
      expect(latest[1]?.day).toBe(4);
      expect(latest[2]?.day).toBe(3);
    });

    it("should get latest benchmarks with default limit", () => {
      // Create 25 benchmarks
      for (let i = 0; i < 25; i++) {
        db.createBenchmark({
          agent: "codex",
          day: (i % 12) + 1,
          part: 1,
          language: "c",
          num_runs: 5,
          times: Array(5).fill(i),
        });
      }

      const latest = db.getLatestBenchmarks();
      expect(latest.length).toBe(20); // Default limit is 20
    });

    it("should calculate percentiles correctly", () => {
      // 100 values from 1 to 100
      const times = Array.from({ length: 100 }, (_, i) => i + 1);

      const sessionId = db.createBenchmark({
        agent: "claude",
        day: 4,
        part: 1,
        language: "ts",
        num_runs: 100,
        times,
      });

      const session = db.getBenchmarkSession(sessionId);
      expect(session?.p50_time_ms).toBe(50);
      expect(session?.p95_time_ms).toBe(95);
      expect(session?.p99_time_ms).toBe(99);
    });

    it("should get benchmarks for specific day", () => {
      // Create benchmarks for different days
      db.createBenchmark({
        agent: "claude",
        day: 5,
        part: 1,
        language: "ts",
        num_runs: 10,
        times: Array(10).fill(1),
      });
      db.createBenchmark({
        agent: "codex",
        day: 5,
        part: 2,
        language: "c",
        num_runs: 10,
        times: Array(10).fill(2),
      });
      db.createBenchmark({
        agent: "gemini",
        day: 6, // Different day
        part: 1,
        language: "ts",
        num_runs: 10,
        times: Array(10).fill(3),
      });

      const day5Benchmarks = db.getBenchmarksForDay(5);
      expect(day5Benchmarks.length).toBe(2);
      expect(day5Benchmarks.every((b) => b.day === 5)).toBe(true);

      const day6Benchmarks = db.getBenchmarksForDay(6);
      expect(day6Benchmarks.length).toBe(1);
      expect(day6Benchmarks[0]?.agent).toBe("gemini");
    });

    it("should return empty array for day with no benchmarks", () => {
      const benchmarks = db.getBenchmarksForDay(99);
      expect(benchmarks).toEqual([]);
    });

    it("should return undefined for non-existent benchmark session", () => {
      const session = db.getBenchmarkSession(9999);
      expect(session).toBeUndefined();
    });

    it("should store answer and is_correct correctly", () => {
      const sessionId = db.createBenchmark({
        agent: "claude",
        day: 7,
        part: 1,
        language: "ts",
        num_runs: 5,
        times: [1, 2, 3, 4, 5],
        answer: "42",
        is_correct: true,
      });

      const session = db.getBenchmarkSession(sessionId);
      expect(session?.answer).toBe("42");
      expect(session?.is_correct).toBe(true);
    });

    it("should store is_correct as false", () => {
      const sessionId = db.createBenchmark({
        agent: "codex",
        day: 8,
        part: 1,
        language: "c",
        num_runs: 5,
        times: [1, 2, 3, 4, 5],
        answer: "wrong",
        is_correct: false,
      });

      const session = db.getBenchmarkSession(sessionId);
      expect(session?.is_correct).toBe(false);
    });

    it("should get benchmark runs for a session", () => {
      const sessionId = db.createBenchmark({
        agent: "gemini",
        day: 9,
        part: 2,
        language: "ts",
        num_runs: 5,
        times: [10, 20, 30, 40, 50],
      });

      const runs = db.getBenchmarkRuns(sessionId);
      expect(runs.length).toBe(5);
      expect(runs.map((r) => r.time_ms)).toEqual([10, 20, 30, 40, 50]);
      expect(runs.map((r) => r.run_index)).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
