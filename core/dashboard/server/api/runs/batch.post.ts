/**
 * POST /api/runs/batch - Exécuter plusieurs solvers en parallèle
 *
 * Options:
 * - runAll: Run all agents for a specific day/part/language
 * - runDay: Run all parts for all agents for a day
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getDb } from "~/server/utils/db";

interface BatchRunRequest {
  day: number;
  agents?: ("claude" | "codex" | "gemini")[];
  parts?: (1 | 2)[];
  languages?: ("ts" | "c")[];
  useSample?: boolean;
}

interface RunResult {
  agent: string;
  day: number;
  part: number;
  language: string;
  answer: string;
  timeMs: number;
  isCorrect: boolean | null;
  error?: string;
}

async function executeRunner(
  agentDir: string,
  agent: string,
  day: number,
  part: 1 | 2,
  language: "ts" | "c",
  useSample: boolean
): Promise<RunResult> {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const aocPath = join(agentDir, "tools", isWindows ? "aoc.bat" : "aoc");
    const args = ["run", day.toString(), part.toString()];

    if (useSample) args.push("--sample");
    if (language === "c") args.push("--lang", "c");

    const proc = isWindows
      ? spawn("cmd", ["/c", aocPath, ...args], { cwd: agentDir, env: { ...process.env } })
      : spawn(aocPath, args, { cwd: agentDir, env: { ...process.env } });

    let stdout = "";
    let stderr = "";

    const startTime = process.hrtime.bigint();

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({
        agent,
        day,
        part,
        language,
        answer: "",
        timeMs: 60000,
        isCorrect: null,
        error: "Execution timed out (60s)",
      });
    }, 60000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1_000_000;

      if (code !== 0) {
        resolve({
          agent,
          day,
          part,
          language,
          answer: "",
          timeMs,
          isCorrect: null,
          error: stderr || `Exit code ${code}`,
        });
        return;
      }

      const answerMatch = stdout.match(/Answer:\s*(.+)/);
      const timeMatch = stdout.match(/Time:\s*([\d.]+)(µs|ms|s)/);

      let parsedTime = timeMs;
      if (timeMatch) {
        const value = parseFloat(timeMatch[1]!);
        const unit = timeMatch[2];
        if (unit === "µs") parsedTime = value / 1000;
        else if (unit === "ms") parsedTime = value;
        else if (unit === "s") parsedTime = value * 1000;
      }

      resolve({
        agent,
        day,
        part,
        language,
        answer: answerMatch ? answerMatch[1]!.trim() : "",
        timeMs: parsedTime,
        isCorrect: null, // Will be set after
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        agent,
        day,
        part,
        language,
        answer: "",
        timeMs: 0,
        isCorrect: null,
        error: `Process error: ${err.message}`,
      });
    });
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BatchRunRequest>(event);

  if (body.day < 0 || body.day > 12) {
    throw createError({ statusCode: 400, message: "Invalid day (must be 0-12)" });
  }

  const agents = body.agents || ["claude", "codex", "gemini"];
  const parts = body.parts || [1, 2];
  const languages = body.languages || ["ts"];
  const useSample = body.useSample ?? false;

  const rootDir = join(process.cwd(), "..", "..");
  const db = getDb();

  // Get expected answers
  const dayData = db.prepare("SELECT * FROM days WHERE id = ?").get(body.day) as {
    answer_p1: string | null;
    answer_p2: string | null;
    sample_expected_p1: string | null;
    sample_expected_p2: string | null;
  } | undefined;

  // Build list of runs
  const runConfigs: Array<{
    agent: "claude" | "codex" | "gemini";
    part: 1 | 2;
    language: "ts" | "c";
  }> = [];

  for (const agent of agents) {
    for (const part of parts) {
      for (const language of languages) {
        runConfigs.push({ agent, part: part as 1 | 2, language: language as "ts" | "c" });
      }
    }
  }

  // Execute all in parallel
  const results = await Promise.all(
    runConfigs.map(async (config) => {
      const agentDir = join(rootDir, "agents", config.agent);

      if (!existsSync(agentDir)) {
        return {
          agent: config.agent,
          day: body.day,
          part: config.part,
          language: config.language,
          answer: "",
          timeMs: 0,
          isCorrect: null,
          error: "Agent directory not found",
        };
      }

      const result = await executeRunner(
        agentDir,
        config.agent,
        body.day,
        config.part,
        config.language,
        useSample
      );

      // Check correctness
      if (dayData && !result.error) {
        let expectedAnswer: string | null = null;
        if (useSample) {
          expectedAnswer = config.part === 1 ? dayData.sample_expected_p1 : dayData.sample_expected_p2;
        } else {
          expectedAnswer = config.part === 1 ? dayData.answer_p1 : dayData.answer_p2;
        }

        if (expectedAnswer !== null) {
          result.isCorrect = result.answer === expectedAnswer;
        }
      }

      // Store in DB
      db.prepare(`
        INSERT INTO runs (agent, day, part, language, answer, time_ms, is_correct, is_sample, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        config.agent,
        body.day,
        config.part,
        config.language,
        result.answer || null,
        result.timeMs,
        result.isCorrect === null ? null : result.isCorrect ? 1 : 0,
        useSample ? 1 : 0,
        result.error || null
      );

      return result;
    })
  );

  return {
    day: body.day,
    useSample,
    results,
    summary: {
      total: results.length,
      success: results.filter((r) => r.isCorrect === true).length,
      failed: results.filter((r) => r.isCorrect === false).length,
      errors: results.filter((r) => r.error).length,
      pending: results.filter((r) => r.isCorrect === null && !r.error).length,
    },
  };
});
