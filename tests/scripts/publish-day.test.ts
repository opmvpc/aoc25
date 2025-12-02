/**
 * 🧪 Tests - Publish Day Script
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { publishDay, validateDay } from "../scripts/lib/publish-day.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-publish-day");

describe("publish-day", () => {
  beforeEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
    await mkdir(TEST_ROOT, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  describe("validateDay", () => {
    it("should accept valid days", () => {
      expect(validateDay(0)).toEqual({ valid: true });
      expect(validateDay(1)).toEqual({ valid: true });
      expect(validateDay(12)).toEqual({ valid: true });
      expect(validateDay(25)).toEqual({ valid: true });
    });

    it("should reject invalid days", () => {
      expect(validateDay(-1).valid).toBe(false);
      expect(validateDay(26).valid).toBe(false);
      expect(validateDay(NaN).valid).toBe(false);
    });

    it("should return error message for invalid days", () => {
      const result = validateDay(99);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid day");
    });
  });

  describe("publishDay", () => {
    beforeEach(async () => {
      // Create source data
      const sourceDir = join(TEST_ROOT, "core", "data", "day01");
      await mkdir(sourceDir, { recursive: true });
      await writeFile(join(sourceDir, "puzzle1.md"), "# Day 1");
      await writeFile(join(sourceDir, "sample.txt"), "sample data");
      await writeFile(join(sourceDir, "input.txt"), "real input");
      await writeFile(
        join(sourceDir, "sample.expected.json"),
        '{"part1": "42", "part2": null}'
      );

      // Create agent directories
      for (const agent of ["claude", "codex", "gemini"]) {
        await mkdir(join(TEST_ROOT, "agents", agent), { recursive: true });
      }
    });

    it("should copy files to all agents", async () => {
      const result = await publishDay({
        root: TEST_ROOT,
        day: 1,
        silent: true,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Check files were copied
      for (const agent of ["claude", "codex", "gemini"]) {
        const files = await readdir(
          join(TEST_ROOT, "agents", agent, "data", "day01")
        );
        expect(files).toContain("puzzle1.md");
        expect(files).toContain("sample.txt");
        expect(files).toContain("input.txt");
      }
    });

    it("should preserve file contents", async () => {
      await publishDay({ root: TEST_ROOT, day: 1, silent: true });

      const content = await readFile(
        join(TEST_ROOT, "agents", "claude", "data", "day01", "puzzle1.md"),
        "utf-8"
      );
      expect(content).toBe("# Day 1");
    });

    it("should return list of copied files", async () => {
      const result = await publishDay({
        root: TEST_ROOT,
        day: 1,
        silent: true,
      });

      expect(result.copiedFiles).toContain("puzzle1.md");
      expect(result.copiedFiles).toContain("sample.txt");
      // Each file copied 3 times (once per agent)
      expect(result.copiedFiles.filter((f) => f === "puzzle1.md")).toHaveLength(
        3
      );
    });

    it("should fail for non-existent source day", async () => {
      const result = await publishDay({
        root: TEST_ROOT,
        day: 99,
        silent: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("does not exist");
    });

    it("should fail if source path is a file not a directory", async () => {
      // Create a file at the day path instead of directory
      await writeFile(
        join(TEST_ROOT, "core", "data", "day02"),
        "not a directory"
      );

      const result = await publishDay({
        root: TEST_ROOT,
        day: 2,
        silent: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain("not a directory");
    });

    it("should publish to specific agents only", async () => {
      const result = await publishDay({
        root: TEST_ROOT,
        day: 1,
        agents: ["claude"],
        silent: true,
      });

      expect(result.success).toBe(true);

      // Claude should have files
      const claudeFiles = await readdir(
        join(TEST_ROOT, "agents", "claude", "data", "day01")
      );
      expect(claudeFiles).toContain("puzzle1.md");

      // Others should not have day01 directory
      try {
        await readdir(join(TEST_ROOT, "agents", "codex", "data", "day01"));
        expect.fail("codex/data/day01 should not exist");
      } catch {
        // Expected
      }
    });

    it("should handle nested directories in source", async () => {
      // Add a nested structure
      const nestedDir = join(TEST_ROOT, "core", "data", "day01", "assets");
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, "image.txt"), "fake image");

      const result = await publishDay({
        root: TEST_ROOT,
        day: 1,
        silent: true,
      });

      expect(result.success).toBe(true);

      // Check nested file was copied
      const nestedContent = await readFile(
        join(
          TEST_ROOT,
          "agents",
          "claude",
          "data",
          "day01",
          "assets",
          "image.txt"
        ),
        "utf-8"
      );
      expect(nestedContent).toBe("fake image");
    });
  });
});
