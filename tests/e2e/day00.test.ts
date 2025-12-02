/**
 * 🧪 Tests - Day 00 Solvers (End-to-End Validation)
 *
 * Ces tests valident que les solutions Day 00 fonctionnent
 * pour tous les agents, en TS et en C.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { executeTs } from "../core/runner/src/executor-ts.js";
import { executeC } from "../core/runner/src/executor-c.js";
import type { RunConfig } from "../core/runner/src/types.js";

const AGENTS = ["claude", "codex", "gemini"] as const;
const ROOT = process.cwd();

describe("day00 solvers", () => {
  const coreDataDir = join(ROOT, "core", "data", "day00");

  // Expected answers from sample.expected.json
  let expectedSample: { part1: string; part2: string };

  beforeAll(async () => {
    const content = await readFile(
      join(ROOT, "core", "data", "day00", "sample.expected.json"),
      "utf-8"
    );
    expectedSample = JSON.parse(content);
  });

  for (const agent of AGENTS) {
    const agentDir = join(ROOT, "agents", agent);

    describe(`${agent} - TypeScript`, () => {
      it("part 1 - sample input should return correct answer", async () => {
        const config: RunConfig = {
          day: 0,
          part: 1,
          lang: "ts",
          useSample: true,
          agentDir,
          coreDataDir,
        };

        const result = await executeTs(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBe(expectedSample.part1);
      });

      it("part 2 - sample input should return correct answer", async () => {
        const config: RunConfig = {
          day: 0,
          part: 2,
          lang: "ts",
          useSample: true,
          agentDir,
          coreDataDir,
        };

        const result = await executeTs(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBe(expectedSample.part2);
      });

      it("part 1 - final input should complete without error", async () => {
        const config: RunConfig = {
          day: 0,
          part: 1,
          lang: "ts",
          useSample: false,
          agentDir,
          coreDataDir,
        };

        const result = await executeTs(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBeTruthy();
        expect(result.timeMs).toBeGreaterThan(0);
      });

      it("part 2 - final input should complete without error", async () => {
        const config: RunConfig = {
          day: 0,
          part: 2,
          lang: "ts",
          useSample: false,
          agentDir,
          coreDataDir,
        };

        const result = await executeTs(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBeTruthy();
      });
    });

    describe(`${agent} - C`, () => {
      it("part 1 - sample input should return correct answer", async () => {
        const config: RunConfig = {
          day: 0,
          part: 1,
          lang: "c",
          useSample: true,
          agentDir,
          coreDataDir,
        };

        const result = await executeC(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBe(expectedSample.part1);
      });

      it("part 2 - sample input should return correct answer", async () => {
        const config: RunConfig = {
          day: 0,
          part: 2,
          lang: "c",
          useSample: true,
          agentDir,
          coreDataDir,
        };

        const result = await executeC(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBe(expectedSample.part2);
      });

      it("part 1 - final input should complete without error", async () => {
        const config: RunConfig = {
          day: 0,
          part: 1,
          lang: "c",
          useSample: false,
          agentDir,
          coreDataDir,
        };

        const result = await executeC(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBeTruthy();
        // C internal timer can report 0 for very fast executions
        expect(result.timeMs).toBeGreaterThanOrEqual(0);
      });

      it("part 2 - final input should complete without error", async () => {
        const config: RunConfig = {
          day: 0,
          part: 2,
          lang: "c",
          useSample: false,
          agentDir,
          coreDataDir,
        };

        const result = await executeC(config);

        expect(result.error).toBeUndefined();
        expect(result.answer).toBeTruthy();
      });
    });
  }

  describe("cross-agent consistency", () => {
    it("all agents should produce the same answer for part 1 final input", async () => {
      const answers: string[] = [];

      for (const agent of AGENTS) {
        const config: RunConfig = {
          day: 0,
          part: 1,
          lang: "ts",
          useSample: false,
          agentDir: join(ROOT, "agents", agent),
          coreDataDir,
        };

        const result = await executeTs(config);
        expect(result.error).toBeUndefined();
        answers.push(result.answer);
      }

      // All answers should be the same
      expect(answers[0]).toBe(answers[1]);
      expect(answers[1]).toBe(answers[2]);
    });

    it("TS and C should produce the same answer", async () => {
      const agentDir = join(ROOT, "agents", "claude");

      const tsConfig: RunConfig = {
        day: 0,
        part: 1,
        lang: "ts",
        useSample: false,
        agentDir,
        coreDataDir,
      };

      const cConfig: RunConfig = {
        day: 0,
        part: 1,
        lang: "c",
        useSample: false,
        agentDir,
        coreDataDir,
      };

      const [tsResult, cResult] = await Promise.all([
        executeTs(tsConfig),
        executeC(cConfig),
      ]);

      expect(tsResult.error).toBeUndefined();
      expect(cResult.error).toBeUndefined();
      expect(tsResult.answer).toBe(cResult.answer);
    });
  });
});
