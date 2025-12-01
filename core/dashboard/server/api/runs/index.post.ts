/**
 * POST /api/runs - Exécuter un solver
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getDb, sqliteBool } from "~/server/utils/db";

interface RunRequest {
  agent: "claude" | "codex" | "gemini";
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
  useSample?: boolean;
}

interface RunResult {
  answer: string;
  timeMs: number;
  error?: string;
}

async function executeRunner(
  agentDir: string,
  day: number,
  part: 1 | 2,
  language: "ts" | "c",
  useSample: boolean
): Promise<RunResult> {
  return new Promise((resolve) => {
    const aocPath = join(agentDir, "tools", "aoc.bat");
    const args = ["run", day.toString(), part.toString()];

    if (useSample) args.push("--sample");
    if (language === "c") args.push("--lang", "c");

    // Use cmd on Windows to run the batch file
    const proc = spawn("cmd", ["/c", aocPath, ...args], {
      cwd: agentDir,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    const startTime = process.hrtime.bigint();

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Timeout after 120 seconds
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve({
        answer: "",
        timeMs: 120000,
        error: "Execution timed out (120s)",
      });
    }, 120000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1_000_000;

      if (code !== 0) {
        resolve({
          answer: "",
          timeMs,
          error: stderr || `Exit code ${code}`,
        });
        return;
      }

      // Parse output - look for "Answer: XXX"
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
        answer: answerMatch ? answerMatch[1]!.trim() : "",
        timeMs: parsedTime,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        answer: "",
        timeMs: 0,
        error: `Process error: ${err.message}`,
      });
    });
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RunRequest>(event);

  // Validate
  if (!["claude", "codex", "gemini"].includes(body.agent)) {
    throw createError({ statusCode: 400, message: "Invalid agent" });
  }
  if (body.day < 0 || body.day > 12) {
    throw createError({ statusCode: 400, message: "Invalid day (must be 0-12)" });
  }
  if (body.part !== 1 && body.part !== 2) {
    throw createError({ statusCode: 400, message: "Invalid part" });
  }
  if (!["ts", "c"].includes(body.language)) {
    throw createError({ statusCode: 400, message: "Invalid language" });
  }

  const rootDir = join(process.cwd(), "..", "..");
  const agentDir = join(rootDir, "agents", body.agent);

  if (!existsSync(agentDir)) {
    throw createError({ statusCode: 404, message: "Agent directory not found" });
  }

  // Execute
  const result = await executeRunner(
    agentDir,
    body.day,
    body.part,
    body.language,
    body.useSample ?? false
  );

  // Get expected answer
  const db = getDb();
  const day = db.prepare("SELECT * FROM days WHERE id = ?").get(body.day) as {
    answer_p1: string | null;
    answer_p2: string | null;
    sample_expected_p1: string | null;
    sample_expected_p2: string | null;
  };

  let expectedAnswer: string | null = null;
  if (body.useSample) {
    expectedAnswer = body.part === 1 ? day.sample_expected_p1 : day.sample_expected_p2;
  } else {
    expectedAnswer = body.part === 1 ? day.answer_p1 : day.answer_p2;
  }

  const isCorrect = expectedAnswer !== null && !result.error
    ? result.answer === expectedAnswer
    : null;

  // Store run in database
  const insertResult = db.prepare(`
    INSERT INTO runs (agent, day, part, language, answer, time_ms, is_correct, is_sample, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.agent,
    body.day,
    body.part,
    body.language,
    result.answer || null,
    result.timeMs,
    isCorrect === null ? null : isCorrect ? 1 : 0,
    body.useSample ? 1 : 0,
    result.error || null
  );

  return {
    id: Number(insertResult.lastInsertRowid),
    agent: body.agent,
    day: body.day,
    part: body.part,
    language: body.language,
    answer: result.answer,
    time_ms: result.timeMs,
    is_correct: isCorrect,
    is_sample: body.useSample ?? false,
    error: result.error || null,
    expected: expectedAnswer,
  };
});
