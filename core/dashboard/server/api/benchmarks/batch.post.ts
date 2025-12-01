/**
 * POST /api/benchmarks/batch - Benchmark all 3 agents
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getDb } from "~/server/utils/db";

interface BatchBenchmarkRequest {
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
  agents?: ("claude" | "codex" | "gemini")[];
  numRuns?: number;
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
      proc = spawn(precompiledBinary, [], {
        cwd: agentDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      proc.stdin.write(input);
      proc.stdin.end();
    } else {
      const solverPath = join(agentDir, "ts", `day${dayStr}`, `part${part}.ts`);

      const code = `
        import { pathToFileURL } from 'url';
        const solver = (await import(pathToFileURL('${solverPath.replace(
          /\\/g,
          "/"
        )}').href)).solver;
        const input = ${JSON.stringify(input)};
        const start = process.hrtime.bigint();
        const result = solver.solve(input);
        const end = process.hrtime.bigint();
        console.log(JSON.stringify({ answer: result, timeNs: Number(end - start) }));
      `;

      proc = spawn("npx", ["tsx", "-e", code], {
        cwd: agentDir,
        shell: true,
      });
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

      if (code !== 0) {
        resolve({ answer: "", timeMs: totalTimeMs, error: stderr || `Exit ${code}` });
        return;
      }

      if (language === "c") {
        // Parse C output format
        const answerMatch = stdout.match(/ANSWER:(.+)/);
        const timeMatch = stdout.match(/TIME:solve:([\d.]+)/);

        resolve({
          answer: answerMatch ? answerMatch[1]!.trim() : stdout.trim(),
          timeMs: timeMatch ? parseFloat(timeMatch[1]!) : totalTimeMs,
        });
      } else {
        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            answer: String(result.answer),
            timeMs: result.timeNs / 1_000_000,
          });
        } catch {
          resolve({ answer: stdout.trim(), timeMs: totalTimeMs });
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

async function benchmarkAgent(
  agent: "claude" | "codex" | "gemini",
  rootDir: string,
  day: number,
  part: 1 | 2,
  language: "ts" | "c",
  input: string,
  numRuns: number
): Promise<{
  agent: string;
  success: boolean;
  answer?: string;
  isCorrect?: boolean | null;
  stats?: ReturnType<typeof computeStats>;
  error?: string;
  sessionId?: number;
}> {
  const agentDir = join(rootDir, "agents", agent);

  if (!existsSync(agentDir)) {
    return { agent, success: false, error: "Agent directory not found" };
  }

  // Pre-compile C if needed
  let precompiledBinary: string | undefined;
  if (language === "c") {
    const result = await compileC(agentDir, day, part);
    if (typeof result === "object" && "error" in result) {
      return { agent, success: false, error: result.error };
    }
    precompiledBinary = result;
  }

  // Run benchmark
  const times: number[] = [];
  let answer = "";

  for (let i = 0; i < numRuns; i++) {
    const result = await executeSolver(
      agentDir,
      day,
      part,
      language,
      input,
      precompiledBinary
    );

    if (result.error) {
      return { agent, success: false, error: result.error };
    }

    times.push(result.timeMs);
    if (i === 0) answer = result.answer;
  }

  if (times.length === 0) {
    return { agent, success: false, error: "No successful runs" };
  }

  // Get expected answer
  const db = getDb();
  const dayData = db
    .prepare("SELECT answer_p1, answer_p2 FROM days WHERE id = ?")
    .get(day) as { answer_p1: string | null; answer_p2: string | null };

  const expectedAnswer = part === 1 ? dayData.answer_p1 : dayData.answer_p2;
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
      agent,
      day,
      part,
      language,
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
    agent,
    success: true,
    answer,
    isCorrect,
    stats,
    sessionId,
  };
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BatchBenchmarkRequest>(event);

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

  const agents = body.agents || ["claude", "codex", "gemini"];
  const numRuns = body.numRuns ?? 100;

  if (numRuns < 1 || numRuns > 1000) {
    throw createError({ statusCode: 400, message: "numRuns must be 1-1000" });
  }

  const rootDir = join(process.cwd(), "..", "..");
  const dayStr = body.day.toString().padStart(2, "0");

  // Load input
  const inputPath = join(rootDir, "core", "data", `day${dayStr}`, "input.txt");
  let input: string;
  try {
    input = await readFile(inputPath, "utf-8");
  } catch {
    throw createError({ statusCode: 404, message: "Input file not found" });
  }

  // Run benchmarks sequentially to avoid resource contention
  const results = [];

  for (const agent of agents) {
    const result = await benchmarkAgent(
      agent as "claude" | "codex" | "gemini",
      rootDir,
      body.day,
      body.part,
      body.language,
      input,
      numRuns
    );
    results.push(result);
  }

  // Rank by average time
  const successfulResults = results
    .filter((r) => r.success && r.stats)
    .sort((a, b) => a.stats!.avg - b.stats!.avg);

  return {
    day: body.day,
    part: body.part,
    language: body.language,
    numRuns,
    results,
    ranking: successfulResults.map((r, i) => ({
      rank: i + 1,
      agent: r.agent,
      avgTimeMs: r.stats!.avg,
      answer: r.answer,
      isCorrect: r.isCorrect,
    })),
  };
});
