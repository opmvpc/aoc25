/**
 * 🏆 AoC 2025 Battle Royale - C Executor
 *
 * New standardized output format from C binaries:
 *   TIME:parse:1.234
 *   TIME:solve:5.678
 *   ANSWER:12345
 *   ERROR:message (optional)
 */

import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import type { RunResult, RunConfig } from "./types.js";

const COMPILER = "clang";
const EXE_EXT = process.platform === "win32" ? ".exe" : "";

interface ParsedCOutput {
  answer: string;
  parseTimeMs: number | null;
  solveTimeMs: number | null;
  totalTimeMs: number;
  error: string | undefined;
}

function parseCOutput(stdout: string, totalTimeMs: number): ParsedCOutput {
  const lines = stdout.trim().split("\n");

  let answer = "";
  let parseTimeMs: number | null = null;
  let solveTimeMs: number | null = null;
  let error: string | undefined;

  for (const line of lines) {
    if (line.startsWith("TIME:")) {
      // Format: TIME:name:milliseconds
      const parts = line.substring(5).split(":");
      if (parts.length >= 2) {
        const name = parts[0];
        const ms = parseFloat(parts[1]!);
        if (name === "parse") parseTimeMs = ms;
        else if (name === "solve") solveTimeMs = ms;
      }
    } else if (line.startsWith("ANSWER:")) {
      answer = line.substring(7);
    } else if (line.startsWith("ERROR:")) {
      error = line.substring(6);
    }
  }

  // Fallback: if no standardized output, use the raw output as answer
  if (!answer && !error && stdout.trim()) {
    answer = stdout.trim().split("\n")[0] || "";
  }

  return {
    answer,
    parseTimeMs,
    solveTimeMs,
    totalTimeMs,
    error,
  };
}

async function compile(
  sourcePath: string,
  outputPath: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const args = ["-O2", "-o", outputPath, sourcePath];
    const proc = spawn(COMPILER, args);

    let stderr = "";
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(null);
      } else {
        resolve(`Compilation failed:\n${stderr}`);
      }
    });

    proc.on("error", (err) => {
      resolve(`Compiler error: ${err.message}`);
    });
  });
}

async function execute(
  binaryPath: string,
  input: string
): Promise<{ stdout: string; stderr: string; timeMs: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const proc = spawn(binaryPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, 60_000);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1_000_000;

      if (killed) {
        resolve({
          stdout: "",
          stderr: "",
          timeMs,
          error: "Execution timed out (60s)",
        });
      } else if (code !== 0) {
        resolve({ stdout, stderr, timeMs, error: `Exit code ${code}` });
      } else {
        resolve({ stdout, stderr, timeMs });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        stdout: "",
        stderr: "",
        timeMs: 0,
        error: `Process error: ${err.message}`,
      });
    });

    // Write input to stdin
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

export async function executeC(config: RunConfig): Promise<RunResult> {
  const { day, part, useSample, agentDir, coreDataDir } = config;
  const dayStr = day.toString().padStart(2, "0");

  // Load input
  const inputDir = useSample
    ? join(agentDir, "data", `day${dayStr}`)
    : coreDataDir;
  const inputFile = useSample ? "sample.txt" : "input.txt";
  const inputPath = join(inputDir, inputFile);

  let input: string;
  try {
    input = await readFile(inputPath, "utf-8");
  } catch {
    return {
      answer: "",
      timeMs: 0,
      isCorrect: null,
      error: `Failed to read input: ${inputPath}`,
    };
  }

  // Paths
  const sourceDir = join(agentDir, "c", `day${dayStr}`);
  const sourcePath = join(sourceDir, `part${part}.c`);
  const binaryPath = join(sourceDir, `part${part}${EXE_EXT}`);

  // Check if source exists
  try {
    await access(sourcePath, constants.R_OK);
  } catch {
    return {
      answer: "",
      timeMs: 0,
      isCorrect: null,
      error: `Source not found: ${sourcePath}`,
    };
  }

  // Compile
  const compileError = await compile(sourcePath, binaryPath);
  if (compileError) {
    return {
      answer: "",
      timeMs: 0,
      isCorrect: null,
      error: compileError,
    };
  }

  // Execute
  const result = await execute(binaryPath, input);

  if (result.error) {
    return {
      answer: "",
      timeMs: result.timeMs,
      isCorrect: null,
      error: result.error + (result.stderr ? `\n${result.stderr}` : ""),
    };
  }

  // Parse standardized output
  const parsed = parseCOutput(result.stdout, result.timeMs);

  // Use internal timing if available, otherwise use external timing
  const timeMs = parsed.solveTimeMs ?? parsed.totalTimeMs;

  if (parsed.error) {
    return {
      answer: "",
      timeMs,
      isCorrect: null,
      error: parsed.error,
    };
  }

  return {
    answer: parsed.answer,
    timeMs,
    isCorrect: null,
  };
}

/**
 * Pre-compile a C solution without executing it
 * Useful for benchmarks where we want to compile once and run many times
 */
export async function precompileC(
  agentDir: string,
  day: number,
  part: 1 | 2
): Promise<{ binaryPath: string } | { error: string }> {
  const dayStr = day.toString().padStart(2, "0");
  const sourceDir = join(agentDir, "c", `day${dayStr}`);
  const sourcePath = join(sourceDir, `part${part}.c`);
  const binaryPath = join(sourceDir, `part${part}${EXE_EXT}`);

  const compileError = await compile(sourcePath, binaryPath);
  if (compileError) {
    return { error: compileError };
  }

  return { binaryPath };
}

/**
 * Execute a pre-compiled binary and parse standardized output
 * Used for benchmarks
 */
export async function executePrecompiled(
  binaryPath: string,
  input: string
): Promise<{
  answer: string;
  timeMs: number;
  parseTimeMs: number | undefined;
  solveTimeMs: number | undefined;
  error: string | undefined;
}> {
  const result = await execute(binaryPath, input);

  if (result.error) {
    return {
      answer: "",
      timeMs: result.timeMs,
      parseTimeMs: undefined,
      solveTimeMs: undefined,
      error: result.error,
    };
  }

  const parsed = parseCOutput(result.stdout, result.timeMs);

  return {
    answer: parsed.answer,
    // For benchmarks, prefer the internal solve time
    timeMs: parsed.solveTimeMs ?? parsed.totalTimeMs,
    parseTimeMs: parsed.parseTimeMs ?? undefined,
    solveTimeMs: parsed.solveTimeMs ?? undefined,
    error: parsed.error,
  };
}
