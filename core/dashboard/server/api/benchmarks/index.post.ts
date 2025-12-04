/**
 * POST /api/benchmarks - Lancer benchmark x100
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getDb, sqliteBool } from "~/server/utils/db";

interface BenchmarkRequest {
  agent: "claude" | "codex" | "gemini";
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
  numRuns?: number;
}

// Compile C once, then run multiple times
async function compileC(
  agentDir: string,
  day: number,
  part: 1 | 2
): Promise<string | { error: string }> {
  const dayStr = day.toString().padStart(2, "0");
  const sourceDir = join(agentDir, "c", `day${dayStr}`);
  const sourcePath = join(sourceDir, `part${part}.c`);
  const binaryPath = join(
    sourceDir,
    `part${part}${process.platform === "win32" ? ".exe" : ""}`
  );

  return new Promise((resolve) => {
    const proc = spawn("clang", ["-O2", "-o", binaryPath, sourcePath]);

    let stderr = "";
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(binaryPath);
      } else {
        resolve({ error: `Compilation failed: ${stderr}` });
      }
    });

    proc.on("error", (err) => {
      resolve({ error: `Compiler error: ${err.message}` });
    });
  });
}

// Execute a solver once and measure time
async function executeSolver(
  agentDir: string,
  day: number,
  part: 1 | 2,
  language: "ts" | "c",
  input: string,
  precompiledBinary?: string
): Promise<{ answer: string; timeMs: number; error?: string }> {
  return new Promise((resolve) => {
    const dayStr = day.toString().padStart(2, "0");

    let proc;
    const startTime = process.hrtime.bigint();

    if (language === "c" && precompiledBinary) {
      // Run precompiled binary
      console.log(`[Benchmark POST] Running C binary: ${precompiledBinary}`);
      proc = spawn(precompiledBinary, [], {
        cwd: agentDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      proc.stdin.write(input);
      proc.stdin.end();
    } else {
      // Run TypeScript solver via a wrapper script that reads from stdin
      const solverPath = join(agentDir, "ts", `day${dayStr}`, `part${part}.ts`);
      console.log(`[Benchmark POST] Running TS solver: ${solverPath}`);

      // Check if file exists
      if (!existsSync(solverPath)) {
        console.log(`[Benchmark POST] ERROR: TS file not found: ${solverPath}`);
        resolve({
          answer: "",
          timeMs: 0,
          error: `File not found: ${solverPath}`,
        });
        return;
      }

      // Use a proper async wrapper to avoid top-level await issues
      const runnerCode = `
(async () => {
  const { pathToFileURL } = await import('url');
  const { readFileSync } = await import('fs');
  const solver = (await import(pathToFileURL('${solverPath.replace(
    /\\/g,
    "/"
  )}').href)).solver;
  const input = readFileSync(0, 'utf-8');
  const start = process.hrtime.bigint();
  const result = solver.solve(input);
  const end = process.hrtime.bigint();
  console.log(JSON.stringify({ answer: result, timeNs: Number(end - start) }));
})();
`;

      // Don't use shell: true - it breaks stdin piping
      proc = spawn("npx", ["tsx", "-e", runnerCode], {
        cwd: agentDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Write input to stdin
      proc.stdin.write(input);
      proc.stdin.end();
    }

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Timeout after 30 seconds per run
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({ answer: "", timeMs: 30000, error: "Timeout" });
    }, 30000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const totalTimeMs = Number(endTime - startTime) / 1_000_000;

      console.log(
        `[Benchmark POST] Process closed with code ${code}, language=${language}`
      );
      console.log(
        `[Benchmark POST] stdout (first 200): ${stdout.substring(0, 200)}`
      );
      console.log(
        `[Benchmark POST] stderr (first 200): ${stderr.substring(0, 200)}`
      );

      if (code !== 0) {
        console.log(`[Benchmark POST] ERROR: Exit code ${code}`);
        resolve({
          answer: "",
          timeMs: totalTimeMs,
          error: stderr || `Exit ${code}`,
        });
        return;
      }

      if (language === "c") {
        // Parse C output: TIME:parse:X.XX\nTIME:solve:X.XX\nANSWER:XXX
        const lines = stdout.trim().split("\n");
        let answer = "";
        let parseTimeMs = 0;
        let solveTimeMs = 0;

        for (const line of lines) {
          if (line.startsWith("ANSWER:")) {
            answer = line.substring(7);
          } else if (line.startsWith("TIME:parse:")) {
            parseTimeMs = parseFloat(line.substring(11)) || 0;
          } else if (line.startsWith("TIME:solve:")) {
            solveTimeMs = parseFloat(line.substring(11)) || 0;
          }
        }

        // Use internal timing (parse + solve) for accurate measurement
        const internalTimeMs = parseTimeMs + solveTimeMs;
        console.log(
          `[Benchmark POST] C result: answer=${answer}, timeMs=${internalTimeMs}`
        );
        resolve({
          answer,
          timeMs: internalTimeMs > 0 ? internalTimeMs : totalTimeMs,
        });
      } else {
        // Parse TS output
        try {
          const trimmedOutput = stdout.trim();
          console.log(`[Benchmark POST] TS raw output: ${trimmedOutput}`);
          const result = JSON.parse(trimmedOutput);
          console.log(
            `[Benchmark POST] TS parsed: answer=${result.answer}, timeNs=${result.timeNs}`
          );
          resolve({
            answer: String(result.answer),
            timeMs: result.timeNs / 1_000_000,
          });
        } catch (e) {
          console.log(`[Benchmark POST] TS parse error: ${e}`);
          resolve({
            answer: stdout.trim(),
            timeMs: totalTimeMs,
            error: `Parse error: ${e}`,
          });
        }
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ answer: "", timeMs: 0, error: err.message });
    });
  });
}

function computeStats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const avg = times.reduce((a, b) => a + b, 0) / n;
  const min = sorted[0]!;
  const max = sorted[n - 1]!;

  const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(n - 1, idx))]!;
  };

  return {
    avg,
    min,
    max,
    stdDev,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
  };
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BenchmarkRequest>(event);

  // Validate
  if (!["claude", "codex", "gemini"].includes(body.agent)) {
    throw createError({ statusCode: 400, message: "Invalid agent" });
  }
  if (body.day < 0 || body.day > 12) {
    throw createError({
      statusCode: 400,
      message: "Invalid day (must be 0-12)",
    });
  }
  if (body.part !== 1 && body.part !== 2) {
    throw createError({ statusCode: 400, message: "Invalid part" });
  }
  if (!["ts", "c"].includes(body.language)) {
    throw createError({ statusCode: 400, message: "Invalid language" });
  }

  const numRuns = body.numRuns ?? 100;
  if (numRuns < 1 || numRuns > 1000) {
    throw createError({ statusCode: 400, message: "numRuns must be 1-1000" });
  }

  const rootDir = join(process.cwd(), "..", "..");
  const agentDir = join(rootDir, "agents", body.agent);
  const dayStr = body.day.toString().padStart(2, "0");

  if (!existsSync(agentDir)) {
    throw createError({
      statusCode: 404,
      message: "Agent directory not found",
    });
  }

  // Load input
  const inputPath = join(rootDir, "core", "data", `day${dayStr}`, "input.txt");
  let input: string;
  try {
    input = await readFile(inputPath, "utf-8");
  } catch {
    throw createError({ statusCode: 404, message: "Input file not found" });
  }

  // Pre-compile C if needed
  let precompiledBinary: string | undefined;
  if (body.language === "c") {
    const result = await compileC(agentDir, body.day, body.part);
    if (typeof result === "object" && "error" in result) {
      throw createError({ statusCode: 400, message: result.error });
    }
    precompiledBinary = result;
  }

  // Run benchmark
  const times: number[] = [];
  let answer = "";
  let lastError = "";

  for (let i = 0; i < numRuns; i++) {
    const result = await executeSolver(
      agentDir,
      body.day,
      body.part,
      body.language,
      input,
      precompiledBinary
    );

    if (result.error) {
      lastError = result.error;
      break;
    }

    times.push(result.timeMs);
    if (i === 0) answer = result.answer;
  }

  if (times.length === 0) {
    throw createError({
      statusCode: 500,
      message: `Benchmark failed: ${lastError || "No runs completed"}`,
    });
  }

  // Get expected answer
  const db = getDb();
  const day = db
    .prepare("SELECT answer_p1, answer_p2 FROM days WHERE id = ?")
    .get(body.day) as {
    answer_p1: string | null;
    answer_p2: string | null;
  };

  const expectedAnswer = body.part === 1 ? day.answer_p1 : day.answer_p2;
  const isCorrect = expectedAnswer !== null ? answer === expectedAnswer : null;

  // Compute stats
  const stats = computeStats(times);

  // Store in database
  const insertResult = db
    .prepare(
      `
    INSERT INTO benchmark_sessions (
      agent, day, part, language, num_runs, answer, is_correct,
      avg_time_ms, min_time_ms, max_time_ms, std_dev_ms,
      p50_time_ms, p95_time_ms, p99_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      body.agent,
      body.day,
      body.part,
      body.language,
      numRuns,
      answer,
      isCorrect === null ? null : isCorrect ? 1 : 0,
      stats.avg,
      stats.min,
      stats.max,
      stats.stdDev,
      stats.p50,
      stats.p95,
      stats.p99
    );

  const sessionId = Number(insertResult.lastInsertRowid);

  // Store individual runs
  const insertRun = db.prepare(`
    INSERT INTO benchmark_runs (session_id, run_index, time_ms) VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((runTimes: number[]) => {
    runTimes.forEach((time, index) => {
      insertRun.run(sessionId, index, time);
    });
  });

  insertMany(times);

  return {
    id: sessionId,
    agent: body.agent,
    day: body.day,
    part: body.part,
    language: body.language,
    num_runs: numRuns,
    answer,
    is_correct: isCorrect,
    avg_time_ms: stats.avg,
    min_time_ms: stats.min,
    max_time_ms: stats.max,
    std_dev_ms: stats.stdDev,
    p50_time_ms: stats.p50,
    p95_time_ms: stats.p95,
    p99_time_ms: stats.p99,
  };
});
