/**
 * GET /api/benchmarks/stream - Stream benchmark results via SSE
 * Runs benchmarks in parallel with configurable concurrency
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getDb } from "~/server/utils/db";

interface BenchmarkTask {
  agent: "claude" | "codex" | "gemini";
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
  numRuns: number;
}

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
      console.log(`[Benchmark] Running C binary: ${precompiledBinary}`);
      proc = spawn(precompiledBinary, [], {
        cwd: agentDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      proc.stdin.write(input);
      proc.stdin.end();
    } else {
      const solverPath = join(agentDir, "ts", `day${dayStr}`, `part${part}.ts`);
      console.log(`[Benchmark] Running TS solver: ${solverPath}`);
      
      // Check if file exists
      if (!existsSync(solverPath)) {
        console.log(`[Benchmark] ERROR: TS file not found: ${solverPath}`);
        resolve({ answer: "", timeMs: 0, error: `File not found: ${solverPath}` });
        return;
      }

      // Use a proper async wrapper to avoid top-level await issues
      const runnerCode = `
(async () => {
  const { pathToFileURL } = await import('url');
  const { readFileSync } = await import('fs');
  const solver = (await import(pathToFileURL('${solverPath.replace(/\\/g, "/")}').href)).solver;
  const input = readFileSync(0, 'utf-8');
  const start = process.hrtime.bigint();
  const result = solver.solve(input);
  const end = process.hrtime.bigint();
  console.log(JSON.stringify({ answer: result, timeNs: Number(end - start) }));
})();
`;

      console.log(`[Benchmark] Spawning npx tsx for ${solverPath}`);
      proc = spawn("npx", ["tsx", "-e", runnerCode], {
        cwd: agentDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

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

    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({ answer: "", timeMs: 30000, error: "Timeout" });
    }, 30000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const totalTimeMs = Number(endTime - startTime) / 1_000_000;
      
      console.log(`[Benchmark] Process closed with code ${code}, language=${language}`);
      console.log(`[Benchmark] stdout: ${stdout.substring(0, 200)}`);
      console.log(`[Benchmark] stderr: ${stderr.substring(0, 200)}`);

      if (code !== 0) {
        console.log(`[Benchmark] ERROR: Exit code ${code}`);
        resolve({ answer: "", timeMs: totalTimeMs, error: stderr || `Exit ${code}` });
        return;
      }

      if (language === "c") {
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

        const internalTimeMs = parseTimeMs + solveTimeMs;
        console.log(`[Benchmark] C result: answer=${answer}, timeMs=${internalTimeMs}`);
        resolve({
          answer,
          timeMs: internalTimeMs > 0 ? internalTimeMs : totalTimeMs,
        });
      } else {
        try {
          const trimmedOutput = stdout.trim();
          console.log(`[Benchmark] TS raw output: ${trimmedOutput}`);
          const result = JSON.parse(trimmedOutput);
          console.log(`[Benchmark] TS parsed result: answer=${result.answer}, timeNs=${result.timeNs}`);
          resolve({
            answer: String(result.answer),
            timeMs: result.timeNs / 1_000_000,
          });
        } catch (e) {
          console.log(`[Benchmark] TS parse error: ${e}`);
          resolve({ answer: stdout.trim(), timeMs: totalTimeMs, error: `Parse error: ${e}` });
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

async function runBenchmark(
  task: BenchmarkTask,
  rootDir: string,
  input: string,
  onRunComplete?: (runIndex: number, totalRuns: number, timeMs: number) => void
): Promise<{
  agent: string;
  day: number;
  part: number;
  language: string;
  success: boolean;
  answer?: string;
  isCorrect?: boolean | null;
  stats?: ReturnType<typeof computeStats>;
  error?: string;
  sessionId?: number;
}> {
  const agentDir = join(rootDir, "agents", task.agent);

  if (!existsSync(agentDir)) {
    return {
      agent: task.agent,
      day: task.day,
      part: task.part,
      language: task.language,
      success: false,
      error: "Agent directory not found",
    };
  }

  // Pre-compile C if needed
  let precompiledBinary: string | undefined;
  if (task.language === "c") {
    const result = await compileC(agentDir, task.day, task.part);
    if (typeof result === "object" && "error" in result) {
      return {
        agent: task.agent,
        day: task.day,
        part: task.part,
        language: task.language,
        success: false,
        error: result.error,
      };
    }
    precompiledBinary = result;
  }

  // Run benchmark
  const times: number[] = [];
  let answer = "";

  for (let i = 0; i < task.numRuns; i++) {
    const result = await executeSolver(
      agentDir,
      task.day,
      task.part,
      task.language,
      input,
      precompiledBinary
    );

    if (result.error) {
      return {
        agent: task.agent,
        day: task.day,
        part: task.part,
        language: task.language,
        success: false,
        error: result.error,
      };
    }

    times.push(result.timeMs);
    if (i === 0) answer = result.answer;
    
    // Notify progress for each run
    if (onRunComplete) {
      onRunComplete(i + 1, task.numRuns, result.timeMs);
    }
  }

  if (times.length === 0) {
    return {
      agent: task.agent,
      day: task.day,
      part: task.part,
      language: task.language,
      success: false,
      error: "No successful runs",
    };
  }

  // Get expected answer
  const db = getDb();
  const dayData = db
    .prepare("SELECT answer_p1, answer_p2 FROM days WHERE id = ?")
    .get(task.day) as { answer_p1: string | null; answer_p2: string | null };

  const expectedAnswer = task.part === 1 ? dayData.answer_p1 : dayData.answer_p2;
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
      task.agent,
      task.day,
      task.part,
      task.language,
      task.numRuns,
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
  const insertRun = db.prepare(
    `INSERT INTO benchmark_runs (session_id, run_index, time_ms) VALUES (?, ?, ?)`
  );

  const insertMany = db.transaction((runTimes: number[]) => {
    runTimes.forEach((time, index) => {
      insertRun.run(sessionId, index, time);
    });
  });

  insertMany(times);

  return {
    agent: task.agent,
    day: task.day,
    part: task.part,
    language: task.language,
    success: true,
    answer,
    isCorrect,
    stats,
    sessionId,
  };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // Parse parameters
  const agents = query.agents
    ? (query.agents as string).split(",").filter((a) => ["claude", "codex", "gemini"].includes(a))
    : ["claude", "codex", "gemini"];

  const day = parseInt(query.day as string) || 0;
  const part = parseInt(query.part as string) || 1;
  const language = (query.language as "ts" | "c") || "ts";
  const numRuns = Math.min(1000, Math.max(1, parseInt(query.numRuns as string) || 100));
  const concurrency = Math.min(3, Math.max(1, parseInt(query.concurrency as string) || 3));

  if (day < 0 || day > 12) {
    throw createError({ statusCode: 400, message: "Invalid day (must be 0-12)" });
  }
  if (part !== 1 && part !== 2) {
    throw createError({ statusCode: 400, message: "Invalid part" });
  }
  if (!["ts", "c"].includes(language)) {
    throw createError({ statusCode: 400, message: "Invalid language" });
  }

  const rootDir = join(process.cwd(), "..", "..");
  const dayStr = day.toString().padStart(2, "0");

  // Load input
  const inputPath = join(rootDir, "core", "data", `day${dayStr}`, "input.txt");
  let input: string;
  try {
    input = await readFile(inputPath, "utf-8");
  } catch {
    throw createError({ statusCode: 404, message: "Input file not found" });
  }

  // Set up SSE
  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (eventType: string, data: unknown) => {
    event.node.res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Build task list
  const tasks: BenchmarkTask[] = agents.map((agent) => ({
    agent: agent as "claude" | "codex" | "gemini",
    day,
    part: part as 1 | 2,
    language,
    numRuns,
  }));

  const totalAgents = tasks.length;
  const totalRuns = totalAgents * numRuns;
  let completedRuns = 0;
  let completedAgents = 0;
  const results: Awaited<ReturnType<typeof runBenchmark>>[] = [];

  // Send initial progress
  sendEvent("progress", { 
    currentRun: 0, 
    totalRuns, 
    currentAgent: 0,
    totalAgents,
    phase: "starting" 
  });

  // Run benchmarks with concurrency control
  const runWithConcurrency = async () => {
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = runBenchmark(task, rootDir, input, (runIndex, agentTotalRuns, timeMs) => {
        completedRuns++;
        // Send run progress event
        sendEvent("run-progress", {
          agent: task.agent,
          runIndex,
          agentTotalRuns,
          timeMs,
          currentRun: completedRuns,
          totalRuns,
          percent: Math.round((completedRuns / totalRuns) * 100),
        });
      }).then((result) => {
        completedAgents++;
        results.push(result);

        // Send agent result
        sendEvent("result", result);

        // Send agent progress
        sendEvent("progress", {
          currentRun: completedRuns,
          totalRuns,
          currentAgent: completedAgents,
          totalAgents,
          phase: completedAgents === totalAgents ? "complete" : "running",
        });
      });

      executing.push(promise);

      // Limit concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          const p = executing[i];
          // Check if promise is fulfilled
          const status = await Promise.race([p.then(() => "fulfilled"), Promise.resolve("pending")]);
          if (status === "fulfilled") {
            executing.splice(i, 1);
          }
        }
      }
    }

    // Wait for remaining
    await Promise.all(executing);
  };

  try {
    await runWithConcurrency();

    // Compute final ranking
    const successfulResults = results
      .filter((r) => r.success && r.stats)
      .sort((a, b) => a.stats!.avg - b.stats!.avg);

    const ranking = successfulResults.map((r, i) => ({
      rank: i + 1,
      agent: r.agent,
      avgTimeMs: r.stats!.avg,
      answer: r.answer,
      isCorrect: r.isCorrect,
      sessionId: r.sessionId,
    }));

    sendEvent("done", {
      day,
      part,
      language,
      numRuns,
      ranking,
    });
  } catch (error) {
    sendEvent("error", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  event.node.res.end();
});
