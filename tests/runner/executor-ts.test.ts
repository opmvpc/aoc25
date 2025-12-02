/**
 * 🧪 Tests - TypeScript Executor
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { executeTs } from "../core/runner/src/executor-ts.js";
import type { RunConfig } from "../core/runner/src/types.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-executor-ts");

describe("executor-ts", () => {
  const agentDir = join(TEST_ROOT, "agents", "test-agent");
  const coreDataDir = join(TEST_ROOT, "core", "data", "day99");

  beforeAll(async () => {
    // Create test structure
    await mkdir(join(agentDir, "ts", "day99"), { recursive: true });
    await mkdir(join(agentDir, "data", "day99"), { recursive: true });
    await mkdir(coreDataDir, { recursive: true });

    // Create sample input
    await writeFile(join(agentDir, "data", "day99", "sample.txt"), "1\n2\n3\n");

    // Create final input
    await writeFile(join(coreDataDir, "input.txt"), "10\n20\n30\n");

    // Create a working solver
    await writeFile(
      join(agentDir, "ts", "day99", "part1.ts"),
      `
export const solver = {
  solve(input) {
    const lines = input.trim().split("\\n");
    const sum = lines.reduce((a, b) => a + parseInt(b, 10), 0);
    return sum.toString();
  }
};
`
    );

    // Create a solver that throws
    await writeFile(
      join(agentDir, "ts", "day99", "part2.ts"),
      `
export const solver = {
  solve(input) {
    throw new Error("Intentional test error");
  }
};
`
    );
  });

  afterAll(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  it("should execute a TypeScript solver with sample input", async () => {
    const config: RunConfig = {
      day: 99,
      part: 1,
      lang: "ts",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeTs(config);

    expect(result.error).toBeUndefined();
    expect(result.answer).toBe("6"); // 1+2+3
    expect(result.timeMs).toBeGreaterThan(0);
    expect(result.isCorrect).toBeNull();
  });

  it("should execute with final input", async () => {
    const config: RunConfig = {
      day: 99,
      part: 1,
      lang: "ts",
      useSample: false,
      agentDir,
      coreDataDir,
    };

    const result = await executeTs(config);

    expect(result.error).toBeUndefined();
    expect(result.answer).toBe("60"); // 10+20+30
  });

  it("should handle solver that throws", async () => {
    const config: RunConfig = {
      day: 99,
      part: 2,
      lang: "ts",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeTs(config);

    expect(result.error).toContain("Intentional test error");
    expect(result.answer).toBe("");
  });

  it("should handle missing input file", async () => {
    const config: RunConfig = {
      day: 98,
      part: 1,
      lang: "ts",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeTs(config);

    expect(result.error).toContain("Failed to read input");
  });

  it("should handle missing solver file", async () => {
    // Create input but no solver
    await mkdir(join(agentDir, "data", "day97"), { recursive: true });
    await writeFile(join(agentDir, "data", "day97", "sample.txt"), "test");

    const config: RunConfig = {
      day: 97,
      part: 1,
      lang: "ts",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeTs(config);

    expect(result.error).toContain("Failed to load solver");
  });
});
