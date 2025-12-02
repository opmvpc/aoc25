/**
 * 🧪 Tests - Scaffold Script
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readdir, readFile, access, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  scaffold,
  scaffoldCoreData,
  scaffoldAgents,
  scaffoldCoreRunner,
  scaffoldCoreDb,
  scaffoldGitignore,
  scaffoldRootPackageJson,
  scaffoldTsconfig,
  validateScaffold,
  dayDir,
  writeIfNotExists,
  ensureDir,
  AGENTS,
  DAYS,
} from "../scripts/lib/scaffold.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-scaffold");

describe("scaffold", () => {
  beforeEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
    await mkdir(TEST_ROOT, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  describe("helper functions", () => {
    it("dayDir should pad days correctly", () => {
      expect(dayDir(0)).toBe("day00");
      expect(dayDir(1)).toBe("day01");
      expect(dayDir(12)).toBe("day12");
    });

    it("ensureDir should create nested directories", async () => {
      const nestedPath = join(TEST_ROOT, "a", "b", "c");
      await ensureDir(nestedPath);

      const s = await stat(nestedPath);
      expect(s.isDirectory()).toBe(true);
    });

    it("writeIfNotExists should create file", async () => {
      const filePath = join(TEST_ROOT, "test.txt");
      const created = await writeIfNotExists(filePath, "hello", true);

      expect(created).toBe(true);
      const content = await readFile(filePath, "utf-8");
      expect(content).toBe("hello");
    });

    it("writeIfNotExists should not overwrite existing file", async () => {
      const filePath = join(TEST_ROOT, "test.txt");
      await writeIfNotExists(filePath, "original", true);
      const created = await writeIfNotExists(filePath, "new content", true);

      expect(created).toBe(false);
      const content = await readFile(filePath, "utf-8");
      expect(content).toBe("original");
    });

    it("writeIfNotExists should create parent directories", async () => {
      const filePath = join(TEST_ROOT, "nested", "dir", "test.txt");
      await writeIfNotExists(filePath, "nested", true);

      const content = await readFile(filePath, "utf-8");
      expect(content).toBe("nested");
    });
  });

  describe("scaffoldCoreData", () => {
    it("should create data directories for all days", async () => {
      await scaffoldCoreData({ root: TEST_ROOT, days: 3, silent: true });

      // Check day00-03 exist
      for (let day = 0; day <= 3; day++) {
        const dayPath = join(TEST_ROOT, "core", "data", dayDir(day));
        const s = await stat(dayPath);
        expect(s.isDirectory()).toBe(true);
      }
    });

    it("should create required files for each day", async () => {
      await scaffoldCoreData({ root: TEST_ROOT, days: 1, silent: true });

      const dayPath = join(TEST_ROOT, "core", "data", "day01");
      const files = await readdir(dayPath);

      expect(files).toContain("puzzle1.md");
      expect(files).toContain("puzzle2.md");
      expect(files).toContain("sample.txt");
      expect(files).toContain("sample.expected.json");
      expect(files).toContain("input.txt");
      expect(files).toContain("answers.json");
    });

    it("should create valid JSON for expected files", async () => {
      await scaffoldCoreData({ root: TEST_ROOT, days: 1, silent: true });

      const expectedPath = join(
        TEST_ROOT,
        "core",
        "data",
        "day01",
        "sample.expected.json"
      );
      const content = await readFile(expectedPath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed).toEqual({ part1: null, part2: null });
    });
  });

  describe("scaffoldAgents", () => {
    it("should create directories for all agents", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 1, silent: true });

      for (const agent of AGENTS) {
        const agentPath = join(TEST_ROOT, "agents", agent);
        const s = await stat(agentPath);
        expect(s.isDirectory()).toBe(true);
      }
    });

    it("should create agent.md for each agent", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 1, silent: true });

      for (const agent of AGENTS) {
        const mdPath = join(TEST_ROOT, "agents", agent, `${agent}.md`);
        await access(mdPath); // Throws if not exists
      }
    });

    it("should create TS and C solvers for each day", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 2, silent: true });

      const agentPath = join(TEST_ROOT, "agents", "claude");

      // Check TS solvers
      await access(join(agentPath, "ts", "day00", "part1.ts"));
      await access(join(agentPath, "ts", "day00", "part2.ts"));
      await access(join(agentPath, "ts", "day01", "part1.ts"));
      await access(join(agentPath, "ts", "day02", "part2.ts"));

      // Check C solvers
      await access(join(agentPath, "c", "day00", "part1.c"));
      await access(join(agentPath, "c", "day01", "part2.c"));
    });

    it("should create valid TS solver template", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 1, silent: true });

      const solverPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "ts",
        "day01",
        "part1.ts"
      );
      const content = await readFile(solverPath, "utf-8");

      expect(content).toContain("ISolver");
      expect(content).toContain("solve(input: string)");
      expect(content).toContain("NOT_IMPLEMENTED");
    });

    it("should create valid C solver template", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 1, silent: true });

      const solverPath = join(
        TEST_ROOT,
        "agents",
        "claude",
        "c",
        "day01",
        "part1.c"
      );
      const content = await readFile(solverPath, "utf-8");

      expect(content).toContain("#include");
      expect(content).toContain("aoc_read_input");
      expect(content).toContain("AOC_RESULT_INT");
    });

    it("should create notes and data placeholders", async () => {
      await scaffoldAgents({ root: TEST_ROOT, days: 1, silent: true });

      for (const agent of AGENTS) {
        await access(join(TEST_ROOT, "agents", agent, "notes", ".gitkeep"));
        await access(join(TEST_ROOT, "agents", agent, "data", ".gitkeep"));
        await access(join(TEST_ROOT, "agents", agent, "tools", ".gitkeep"));
      }
    });
  });

  describe("scaffoldCoreRunner", () => {
    it("should create runner package.json", async () => {
      await scaffoldCoreRunner({ root: TEST_ROOT, silent: true });

      const pkgPath = join(TEST_ROOT, "core", "runner", "package.json");
      const content = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.name).toBe("@aoc25/runner");
      expect(pkg.dependencies.commander).toBeDefined();
    });

    it("should create runner tsconfig.json", async () => {
      await scaffoldCoreRunner({ root: TEST_ROOT, silent: true });

      const tsconfigPath = join(TEST_ROOT, "core", "runner", "tsconfig.json");
      const content = await readFile(tsconfigPath, "utf-8");
      const tsconfig = JSON.parse(content);

      expect(tsconfig.extends).toBe("../../tsconfig.base.json");
    });
  });

  describe("scaffoldCoreDb", () => {
    it("should create db package.json", async () => {
      await scaffoldCoreDb({ root: TEST_ROOT, silent: true });

      const pkgPath = join(TEST_ROOT, "core", "db", "package.json");
      const content = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.name).toBe("@aoc25/db");
      expect(pkg.dependencies["better-sqlite3"]).toBeDefined();
    });
  });

  describe("scaffoldGitignore", () => {
    it("should create .gitignore", async () => {
      await scaffoldGitignore({ root: TEST_ROOT, silent: true });

      const content = await readFile(join(TEST_ROOT, ".gitignore"), "utf-8");
      expect(content).toContain("node_modules");
      expect(content).toContain("dist/");
      expect(content).toContain(".nuxt/");
    });
  });

  describe("scaffoldRootPackageJson", () => {
    it("should create root package.json with workspaces", async () => {
      await scaffoldRootPackageJson({ root: TEST_ROOT, silent: true });

      const content = await readFile(join(TEST_ROOT, "package.json"), "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.workspaces).toContain("core/runner");
      expect(pkg.workspaces).toContain("core/db");
      expect(pkg.type).toBe("module");
    });
  });

  describe("scaffoldTsconfig", () => {
    it("should create tsconfig.base.json", async () => {
      await scaffoldTsconfig({ root: TEST_ROOT, silent: true });

      const content = await readFile(
        join(TEST_ROOT, "tsconfig.base.json"),
        "utf-8"
      );
      const tsconfig = JSON.parse(content);

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.module).toBe("NodeNext");
    });

    it("should create tsconfig.json extending base", async () => {
      await scaffoldTsconfig({ root: TEST_ROOT, silent: true });

      const content = await readFile(join(TEST_ROOT, "tsconfig.json"), "utf-8");
      const tsconfig = JSON.parse(content);

      expect(tsconfig.extends).toBe("./tsconfig.base.json");
    });
  });

  describe("full scaffold", () => {
    it("should create complete project structure", async () => {
      await scaffold({ root: TEST_ROOT, days: 2, silent: true });

      // Check root files
      await access(join(TEST_ROOT, "package.json"));
      await access(join(TEST_ROOT, "tsconfig.json"));
      await access(join(TEST_ROOT, ".gitignore"));

      // Check core
      await access(join(TEST_ROOT, "core", "data", "day00"));
      await access(join(TEST_ROOT, "core", "runner", "package.json"));
      await access(join(TEST_ROOT, "core", "db", "package.json"));

      // Check agents
      for (const agent of AGENTS) {
        await access(join(TEST_ROOT, "agents", agent, `${agent}.md`));
        await access(
          join(TEST_ROOT, "agents", agent, "ts", "day01", "part1.ts")
        );
      }
    });
  });

  describe("validateScaffold", () => {
    it("should return valid for complete scaffold", async () => {
      await scaffold({ root: TEST_ROOT, days: 2, silent: true });

      const result = await validateScaffold(TEST_ROOT);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for missing directories", async () => {
      // Create incomplete structure
      await mkdir(join(TEST_ROOT, "core", "data"), { recursive: true });

      const result = await validateScaffold(TEST_ROOT);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("Missing"))).toBe(true);
    });

    it("should return errors for missing files", async () => {
      // Create directories but no files
      await mkdir(join(TEST_ROOT, "core", "data"), { recursive: true });
      await mkdir(join(TEST_ROOT, "core", "runner"), { recursive: true });
      await mkdir(join(TEST_ROOT, "core", "db"), { recursive: true });
      await mkdir(join(TEST_ROOT, "agents", "claude"), { recursive: true });
      await mkdir(join(TEST_ROOT, "agents", "codex"), { recursive: true });
      await mkdir(join(TEST_ROOT, "agents", "gemini"), { recursive: true });

      const result = await validateScaffold(TEST_ROOT);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("package.json"))).toBe(true);
    });
  });
});
