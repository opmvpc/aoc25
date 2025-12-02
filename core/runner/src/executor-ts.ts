/**
 * 🏆 AoC 2025 Battle Royale - TypeScript Executor
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ISolver, RunResult, RunConfig } from "./types.js";

export async function executeTs(config: RunConfig): Promise<RunResult> {
  const { day, part, useSample, agentDir, coreDataDir } = config;
  const dayStr = day.toString().padStart(2, "0");

  // Load input
  const inputDir = useSample ? join(agentDir, "data", `day${dayStr}`) : coreDataDir;
  const inputFile = useSample ? "sample.txt" : "input.txt";
  const inputPath = join(inputDir, inputFile);

  let input: string;
  try {
    input = await readFile(inputPath, "utf-8");
  } catch (err) {
    return {
      answer: "",
      timeMs: 0,
      isCorrect: null,
      error: `Failed to read input: ${inputPath}`,
    };
  }

  // Load solver
  const solverPath = join(agentDir, "ts", `day${dayStr}`, `part${part}.ts`);

  let solver: ISolver;
  try {
    // Dynamic import with file URL for Windows compatibility
    const module = await import(pathToFileURL(solverPath).href);
    solver = module.solver;

    if (!solver || typeof solver.solve !== "function") {
      return {
        answer: "",
        timeMs: 0,
        isCorrect: null,
        error: `Invalid solver export in ${solverPath}`,
      };
    }
  } catch (err) {
    return {
      answer: "",
      timeMs: 0,
      isCorrect: null,
      error: `Failed to load solver: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Execute with timing
  const startTime = process.hrtime.bigint();
  let answer: string;

  try {
    answer = solver.solve(input);
  } catch (err) {
    const endTime = process.hrtime.bigint();
    const timeMs = Number(endTime - startTime) / 1_000_000;

    return {
      answer: "",
      timeMs,
      isCorrect: false,
      error: `Solver threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const endTime = process.hrtime.bigint();
  const timeMs = Number(endTime - startTime) / 1_000_000;

  return {
    answer: String(answer),
    timeMs,
    isCorrect: null, // Will be checked later
  };
}
