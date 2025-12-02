/**
 * 🧪 Tests - C Executor
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, rm, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import {
  executeC,
  precompileC,
  executePrecompiled,
} from "../core/runner/src/executor-c.js";
import type { RunConfig } from "../core/runner/src/types.js";

const TEST_ROOT = join(process.cwd(), "tests", ".tmp-executor-c");

describe("executor-c", () => {
  const agentDir = join(TEST_ROOT, "agents", "test-agent");
  const coreDataDir = join(TEST_ROOT, "core", "data", "day99");
  const toolsDir = join(agentDir, "tools", "runner", "c");

  beforeAll(async () => {
    // Create test structure
    await mkdir(join(agentDir, "c", "day99"), { recursive: true });
    await mkdir(join(agentDir, "data", "day99"), { recursive: true });
    await mkdir(coreDataDir, { recursive: true });
    await mkdir(toolsDir, { recursive: true });

    // Copy common.h
    await copyFile(
      join(process.cwd(), "core", "runner", "c", "common.h"),
      join(toolsDir, "common.h")
    );

    // Create sample input
    await writeFile(join(agentDir, "data", "day99", "sample.txt"), "1\n2\n3\n");

    // Create final input
    await writeFile(join(coreDataDir, "input.txt"), "10\n20\n30\n");

    // Create a working C solver
    await writeFile(
      join(agentDir, "c", "day99", "part1.c"),
      `
#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int sum = 0;
    char* ptr = input;
    while (*ptr) {
        sum += (int)strtol(ptr, &ptr, 10);
        while (*ptr == '\\n' || *ptr == ' ') ptr++;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // Already computed during parse for this simple case
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(sum);

    aoc_cleanup(input);
    return 0;
}
`
    );

    // Create a C solver with compile error
    await writeFile(
      join(agentDir, "c", "day99", "part2.c"),
      `
#include "../../tools/runner/c/common.h"

int main(void) {
    this_will_not_compile();  // Intentional error
    return 0;
}
`
    );

    // Create a C solver that outputs error
    await mkdir(join(agentDir, "c", "day97"), { recursive: true });
    await writeFile(
      join(agentDir, "c", "day97", "part1.c"),
      `
#include <stdio.h>

int main(void) {
    printf("ERROR:Something went wrong\\n");
    return 0;
}
`
    );

    // Create a C solver that outputs raw (non-standardized) output
    await mkdir(join(agentDir, "c", "day96"), { recursive: true });
    await writeFile(
      join(agentDir, "c", "day96", "part1.c"),
      `
#include <stdio.h>

int main(void) {
    printf("42\\n");
    return 0;
}
`
    );

    // Create a C solver that exits with non-zero code
    await mkdir(join(agentDir, "c", "day95"), { recursive: true });
    await writeFile(
      join(agentDir, "c", "day95", "part1.c"),
      `
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    fprintf(stderr, "Fatal error");
    return 1;
}
`
    );

    // Create sample inputs for additional tests
    await mkdir(join(agentDir, "data", "day97"), { recursive: true });
    await writeFile(join(agentDir, "data", "day97", "sample.txt"), "test");
    await mkdir(join(agentDir, "data", "day96"), { recursive: true });
    await writeFile(join(agentDir, "data", "day96", "sample.txt"), "test");
    await mkdir(join(agentDir, "data", "day95"), { recursive: true });
    await writeFile(join(agentDir, "data", "day95", "sample.txt"), "test");
  });

  afterAll(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  it("should compile and execute a C solver with sample input", async () => {
    const config: RunConfig = {
      day: 99,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toBeUndefined();
    expect(result.answer).toBe("6"); // 1+2+3
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
  });

  it("should execute with final input", async () => {
    const config: RunConfig = {
      day: 99,
      part: 1,
      lang: "c",
      useSample: false,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toBeUndefined();
    expect(result.answer).toBe("60"); // 10+20+30
  });

  it("should handle compilation error", async () => {
    const config: RunConfig = {
      day: 99,
      part: 2,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toContain("Compilation failed");
  });

  it("should handle missing source file", async () => {
    // Create input but no source
    await mkdir(join(agentDir, "data", "day98"), { recursive: true });
    await writeFile(join(agentDir, "data", "day98", "sample.txt"), "test");

    const config: RunConfig = {
      day: 98,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toContain("Source not found");
  });

  it("should handle missing input file", async () => {
    // Create source but no input in a different day
    await mkdir(join(agentDir, "c", "day94"), { recursive: true });
    await writeFile(
      join(agentDir, "c", "day94", "part1.c"),
      `
#include <stdio.h>
int main(void) { printf("42"); return 0; }
`
    );

    const config: RunConfig = {
      day: 94,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toContain("Failed to read input");
  });

  it("should handle ERROR: output from C program", async () => {
    const config: RunConfig = {
      day: 97,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toBe("Something went wrong");
    expect(result.answer).toBe("");
  });

  it("should handle raw (non-standardized) output fallback", async () => {
    const config: RunConfig = {
      day: 96,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toBeUndefined();
    expect(result.answer).toBe("42");
  });

  it("should handle non-zero exit code", async () => {
    const config: RunConfig = {
      day: 95,
      part: 1,
      lang: "c",
      useSample: true,
      agentDir,
      coreDataDir,
    };

    const result = await executeC(config);

    expect(result.error).toContain("Exit code 1");
    expect(result.error).toContain("Fatal error");
  });

  describe("precompileC", () => {
    it("should precompile a C solution", async () => {
      const result = await precompileC(agentDir, 99, 1);

      expect("binaryPath" in result).toBe(true);
      if ("binaryPath" in result) {
        expect(result.binaryPath).toContain("part1");
      }
    });

    it("should return error for invalid source", async () => {
      const result = await precompileC(agentDir, 99, 2);

      expect("error" in result).toBe(true);
    });
  });

  describe("executePrecompiled", () => {
    it("should execute a precompiled binary", async () => {
      const precompile = await precompileC(agentDir, 99, 1);
      expect("binaryPath" in precompile).toBe(true);

      if ("binaryPath" in precompile) {
        const result = await executePrecompiled(
          precompile.binaryPath,
          "5\n10\n15\n"
        );

        expect(result.error).toBeUndefined();
        expect(result.answer).toBe("30");
        expect(result.timeMs).toBeGreaterThanOrEqual(0);
        // Internal timing should be captured
        expect(result.parseTimeMs).toBeDefined();
        expect(result.solveTimeMs).toBeDefined();
      }
    });

    it("should handle execution error in precompiled binary", async () => {
      // Precompile a failing binary
      const precompile = await precompileC(agentDir, 95, 1);
      expect("binaryPath" in precompile).toBe(true);

      if ("binaryPath" in precompile) {
        const result = await executePrecompiled(precompile.binaryPath, "test");

        expect(result.error).toContain("Exit code");
      }
    });
  });
});
