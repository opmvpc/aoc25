/**
 * 🧪 Tests - Runner Utils
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  detectAgent,
  getCoreDataDir,
  loadExpected,
  formatTime,
  formatResult,
} from "../core/runner/src/utils.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp");

describe("utils", () => {
  describe("detectAgent", () => {
    // Clean up env after each test
    const originalEnv = process.env.AOC_AGENT_DIR;

    afterEach(() => {
      if (originalEnv) {
        process.env.AOC_AGENT_DIR = originalEnv;
      } else {
        delete process.env.AOC_AGENT_DIR;
      }
    });

    it("should detect claude agent from agent directory", () => {
      delete process.env.AOC_AGENT_DIR;
      const result = detectAgent("/home/user/aoc25/agents/claude");
      expect(result).toEqual({
        agent: "claude",
        agentDir: "/home/user/aoc25/agents/claude",
      });
    });

    it("should detect codex agent from subdirectory", () => {
      delete process.env.AOC_AGENT_DIR;
      const result = detectAgent("/home/user/aoc25/agents/codex/ts/day01");
      expect(result).toEqual({
        agent: "codex",
        agentDir: "/home/user/aoc25/agents/codex",
      });
    });

    it("should detect gemini agent", () => {
      delete process.env.AOC_AGENT_DIR;
      const result = detectAgent("/some/path/agents/gemini/notes");
      expect(result).toEqual({
        agent: "gemini",
        agentDir: "/some/path/agents/gemini",
      });
    });

    it("should return null for non-agent directory", () => {
      delete process.env.AOC_AGENT_DIR;
      expect(detectAgent("/home/user/aoc25/core/runner")).toBeNull();
      expect(detectAgent("/home/user/random/path")).toBeNull();
    });

    it("should return null for invalid agent name", () => {
      delete process.env.AOC_AGENT_DIR;
      expect(detectAgent("/path/agents/unknown")).toBeNull();
    });

    it("should return null when agents is at end of path", () => {
      delete process.env.AOC_AGENT_DIR;
      expect(detectAgent("/path/to/agents")).toBeNull();
    });

    it("should use AOC_AGENT_DIR env variable when set", () => {
      process.env.AOC_AGENT_DIR = "/custom/path/agents/claude";

      const result = detectAgent("/some/other/path");
      expect(result).toEqual({
        agent: "claude",
        agentDir: "/custom/path/agents/claude",
      });
    });

    it("should fallback to CWD detection if env var has invalid agent", () => {
      process.env.AOC_AGENT_DIR = "/path/to/invalid";

      const result = detectAgent("/real/agents/codex/test");
      expect(result).toEqual({
        agent: "codex",
        agentDir: "/real/agents/codex",
      });
    });
  });

  describe("getCoreDataDir", () => {
    it("should return correct path for day 1", () => {
      const result = getCoreDataDir("/home/user/aoc25/agents/claude", 1);
      expect(result).toBe("/home/user/aoc25/core/data/day01");
    });

    it("should return correct path for day 12", () => {
      const result = getCoreDataDir("/path/to/agents/gemini", 12);
      expect(result).toBe("/path/to/core/data/day12");
    });

    it("should pad single digit days with zero", () => {
      const result = getCoreDataDir("/agents/codex", 5);
      expect(result).toContain("day05");
    });
  });

  describe("loadExpected", () => {
    const testAgentDir = join(
      TEST_ROOT,
      "load-expected",
      "agents",
      "test-agent"
    );
    const testCoreDir = join(TEST_ROOT, "load-expected", "core", "data");

    beforeAll(async () => {
      // Create test structure for sample
      await mkdir(join(testAgentDir, "data", "day01"), { recursive: true });
      await writeFile(
        join(testAgentDir, "data", "day01", "sample.expected.json"),
        JSON.stringify({ part1: "42", part2: "100" })
      );

      // Create test structure for final answers
      await mkdir(join(testCoreDir, "day02"), { recursive: true });
      await writeFile(
        join(testCoreDir, "day02", "answers.json"),
        JSON.stringify({ part1: "999", part2: "1000" })
      );
    });

    afterAll(async () => {
      await rm(join(TEST_ROOT, "load-expected"), {
        recursive: true,
        force: true,
      });
    });

    it("should load sample expected values", async () => {
      const result = await loadExpected(testAgentDir, 1, true);
      expect(result).toEqual({ part1: "42", part2: "100" });
    });

    it("should load final answers from core/data", async () => {
      const result = await loadExpected(testAgentDir, 2, false);
      expect(result).toEqual({ part1: "999", part2: "1000" });
    });

    it("should return nulls for non-existent sample file", async () => {
      const result = await loadExpected(testAgentDir, 99, true);
      expect(result).toEqual({ part1: null, part2: null });
    });

    it("should return nulls for non-existent final answers file", async () => {
      const result = await loadExpected(testAgentDir, 99, false);
      expect(result).toEqual({ part1: null, part2: null });
    });
  });

  describe("formatTime", () => {
    it("should format microseconds", () => {
      expect(formatTime(0.5)).toBe("500µs");
      expect(formatTime(0.001)).toBe("1µs");
    });

    it("should format milliseconds", () => {
      expect(formatTime(1.5)).toBe("1.50ms");
      expect(formatTime(100)).toBe("100.00ms");
      expect(formatTime(999.99)).toBe("999.99ms");
    });

    it("should format seconds", () => {
      expect(formatTime(1000)).toBe("1.00s");
      expect(formatTime(5500)).toBe("5.50s");
    });
  });

  describe("formatResult", () => {
    it("should format correct answer", () => {
      const result = formatResult("42", 1.5, true, "42");
      expect(result).toContain("✅");
      expect(result).toContain("42");
      expect(result).toContain("1.50ms");
    });

    it("should format incorrect answer", () => {
      const result = formatResult("41", 2.0, false, "42");
      expect(result).toContain("❌");
      expect(result).toContain("41");
      expect(result).toContain("Expected: 42");
    });

    it("should format pending answer", () => {
      const result = formatResult("42", 1.0, null, null);
      expect(result).toContain("⏳");
      expect(result).toContain("42");
    });

    it("should format error", () => {
      const result = formatResult("", 0, null, null, "Something broke");
      expect(result).toContain("❌ Error:");
      expect(result).toContain("Something broke");
    });
  });
});
