/**
 * 🧪 Tests - Sync Tools Script
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import {
  mkdir,
  rm,
  readdir,
  writeFile,
  readFile,
  access,
  copyFile,
} from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  syncToAgent,
  buildRunner,
  syncTools,
  AGENTS,
} from "../scripts/lib/sync-tools.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-sync-tools");
const REAL_ROOT = process.cwd();

describe("sync-tools", () => {
  beforeEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
    await mkdir(TEST_ROOT, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  describe("AGENTS constant", () => {
    it("should have all three agents", () => {
      expect(AGENTS).toEqual(["claude", "codex", "gemini"]);
    });
  });

  describe("syncToAgent", () => {
    beforeEach(async () => {
      // Copy the real runner dist to test root
      const realRunnerDist = join(REAL_ROOT, "core", "runner", "dist");
      const testRunnerDir = join(TEST_ROOT, "core", "runner");
      const testRunnerDist = join(testRunnerDir, "dist");

      await mkdir(testRunnerDist, { recursive: true });

      // Copy key files
      const files = await readdir(realRunnerDist);
      for (const file of files) {
        const src = join(realRunnerDist, file);
        const dest = join(testRunnerDist, file);
        await copyFile(src, dest);
      }

      // Copy package.json
      await copyFile(
        join(REAL_ROOT, "core", "runner", "package.json"),
        join(testRunnerDir, "package.json")
      );

      // Copy C header
      const cDir = join(testRunnerDir, "c");
      await mkdir(cDir, { recursive: true });
      await copyFile(
        join(REAL_ROOT, "core", "runner", "c", "common.h"),
        join(cDir, "common.h")
      );

      // Create agent directories
      for (const agent of ["claude", "codex", "gemini"]) {
        await mkdir(join(TEST_ROOT, "agents", agent), { recursive: true });
      }
    });

    it("should sync runner to agent tools directory", async () => {
      const result = await syncToAgent(TEST_ROOT, "claude", true);

      expect(result.success).toBe(true);

      // Check runner was copied
      const toolsDir = join(TEST_ROOT, "agents", "claude", "tools");
      const runnerDir = join(toolsDir, "runner");

      await access(join(runnerDir, "dist"));
      await access(join(runnerDir, "package.json"));
      await access(join(runnerDir, "types.js"));
    });

    it("should create shell wrapper", async () => {
      await syncToAgent(TEST_ROOT, "claude", true);

      const wrapperPath = join(TEST_ROOT, "agents", "claude", "tools", "aoc");
      const content = await readFile(wrapperPath, "utf-8");

      expect(content).toContain("#!/bin/bash");
      expect(content).toContain("AOC_AGENT_DIR");
      expect(content).toContain("cli.js");
    });

    it("should create Windows batch wrapper", async () => {
      await syncToAgent(TEST_ROOT, "claude", true);

      const wrapperPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "tools",
        "aoc.bat"
      );
      const content = await readFile(wrapperPath, "utf-8");

      expect(content).toContain("@echo off");
      expect(content).toContain("cli.js");
    });

    it("should create PowerShell wrapper", async () => {
      await syncToAgent(TEST_ROOT, "claude", true);

      const wrapperPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "tools",
        "aoc.ps1"
      );
      const content = await readFile(wrapperPath, "utf-8");

      expect(content).toContain("$ScriptDir");
    });

    it("should copy C common header", async () => {
      await syncToAgent(TEST_ROOT, "claude", true);

      const headerPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "tools",
        "runner",
        "c",
        "common.h"
      );
      const content = await readFile(headerPath, "utf-8");

      expect(content).toContain("AOC_COMMON_H");
      expect(content).toContain("aoc_read_input");
    });

    it("should create types.js re-export", async () => {
      await syncToAgent(TEST_ROOT, "claude", true);

      const typesPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "tools",
        "runner",
        "types.js"
      );
      const content = await readFile(typesPath, "utf-8");

      expect(content).toContain("export *");
      expect(content).toContain("dist/types.js");
    });

    it("should clean existing runner before sync", async () => {
      // Create some old files
      const oldRunnerDir = join(
        TEST_ROOT,
        "agents",
        "claude",
        "tools",
        "runner"
      );
      await mkdir(oldRunnerDir, { recursive: true });
      await writeFile(join(oldRunnerDir, "old-file.txt"), "old content");

      await syncToAgent(TEST_ROOT, "claude", true);

      // Old file should be gone
      expect(existsSync(join(oldRunnerDir, "old-file.txt"))).toBe(false);
    });

    it("should fail if dist not found", async () => {
      // Remove dist
      await rm(join(TEST_ROOT, "core", "runner", "dist"), { recursive: true });

      const result = await syncToAgent(TEST_ROOT, "codex", true);

      expect(result.success).toBe(false);
      expect(result.error).toContain("dist");
    });

    it("should sync to multiple agents", async () => {
      for (const agent of ["claude", "codex", "gemini"]) {
        const result = await syncToAgent(TEST_ROOT, agent, true);
        expect(result.success).toBe(true);
      }

      // Verify all have runner
      for (const agent of ["claude", "codex", "gemini"]) {
        await access(
          join(TEST_ROOT, "agents", agent, "tools", "runner", "dist")
        );
      }
    });

    it("should work without C header if not present", async () => {
      // Remove C header
      await rm(join(TEST_ROOT, "core", "runner", "c"), { recursive: true });

      const result = await syncToAgent(TEST_ROOT, "claude", true);

      expect(result.success).toBe(true);
      // C header dir should not exist
      expect(
        existsSync(join(TEST_ROOT, "agents", "claude", "tools", "runner", "c"))
      ).toBe(false);
    });
  });

  describe("buildRunner", () => {
    it("should fail for non-existent directory", async () => {
      const result = await buildRunner(join(TEST_ROOT, "nonexistent"), true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    // Note: We don't test successful build here as it requires full npm setup
    // That's covered by the integration tests
  });

  describe("syncTools", () => {
    beforeEach(async () => {
      // Copy the real runner dist to test root
      const realRunnerDist = join(REAL_ROOT, "core", "runner", "dist");
      const testRunnerDir = join(TEST_ROOT, "core", "runner");
      const testRunnerDist = join(testRunnerDir, "dist");

      await mkdir(testRunnerDist, { recursive: true });

      // Copy key files
      const files = await readdir(realRunnerDist);
      for (const file of files) {
        const src = join(realRunnerDist, file);
        const dest = join(testRunnerDist, file);
        await copyFile(src, dest);
      }

      // Copy package.json
      await copyFile(
        join(REAL_ROOT, "core", "runner", "package.json"),
        join(testRunnerDir, "package.json")
      );

      // Copy C header
      const cDir = join(testRunnerDir, "c");
      await mkdir(cDir, { recursive: true });
      await copyFile(
        join(REAL_ROOT, "core", "runner", "c", "common.h"),
        join(cDir, "common.h")
      );

      // Create agent directories
      for (const agent of ["claude", "codex", "gemini"]) {
        await mkdir(join(TEST_ROOT, "agents", agent), { recursive: true });
      }
    });

    it("should sync to all agents by default", async () => {
      const result = await syncTools({
        root: TEST_ROOT,
        silent: true,
        skipBuild: true, // Skip build since we copied dist
      });

      expect(result.success).toBe(true);
      expect(result.syncedAgents).toEqual(["claude", "codex", "gemini"]);
      expect(result.errors).toHaveLength(0);
      expect(result.builtRunner).toBe(false);
    });

    it("should sync to specific agents", async () => {
      const result = await syncTools({
        root: TEST_ROOT,
        agents: ["claude", "gemini"],
        silent: true,
        skipBuild: true,
      });

      expect(result.success).toBe(true);
      expect(result.syncedAgents).toEqual(["claude", "gemini"]);
    });

    it("should fail if build fails and not skipped", async () => {
      const result = await syncTools({
        root: join(TEST_ROOT, "nonexistent"),
        silent: true,
        skipBuild: false,
      });

      expect(result.success).toBe(false);
      expect(result.builtRunner).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should collect errors from failed syncs", async () => {
      // Remove dist to cause sync failure
      await rm(join(TEST_ROOT, "core", "runner", "dist"), { recursive: true });

      const result = await syncTools({
        root: TEST_ROOT,
        silent: true,
        skipBuild: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(3); // One for each agent
      expect(result.syncedAgents).toHaveLength(0);
    });

    it("should return partial success", async () => {
      // Sync first agent successfully
      const firstResult = await syncToAgent(TEST_ROOT, "claude", true);
      expect(firstResult.success).toBe(true);

      // Remove dist after first sync
      await rm(join(TEST_ROOT, "core", "runner", "dist"), { recursive: true });

      // Now sync all - only codex and gemini should fail
      const result = await syncTools({
        root: TEST_ROOT,
        silent: true,
        skipBuild: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(3); // All three will fail since dist is gone
    });
  });
});
