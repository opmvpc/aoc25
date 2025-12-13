/**
 * GET /api/runs/stream - Stream run results via SSE
 *
 * Query params:
 * - days: comma-separated day numbers (e.g., "1,2,3" or "all")
 * - sample: "true" or "false"
 * - agents: comma-separated agents (default: "claude,codex,gemini")
 * - languages: comma-separated languages (default: "ts,c")
 * - parts: comma-separated parts (default: "1,2")
 *
 * Streams JSON events:
 * - { type: "start", total: number }
 * - { type: "result", data: RunResult }
 * - { type: "done", summary: {...} }
 * - { type: "error", message: string }
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { getDb } from "~/server/utils/db";

interface RunConfig {
  agent: "claude" | "codex" | "gemini";
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
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

const NOT_IMPLEMENTED_MARKERS = [
  "NOT_IMPLEMENTED",
  "TODO: Implement solution",
  'return "NOT_IMPLEMENTED"',
];

// Day 12 Part 2 is always a free star in AoC (given for completing all other puzzles)
const FREE_STAR_ANSWER = "Merry Christmas!";

async function isFileImplemented(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return false;
  try {
    const content = await readFile(filePath, "utf-8");
    for (const marker of NOT_IMPLEMENTED_MARKERS) {
      if (content.includes(marker)) return false;
    }
    return true;
  } catch {
    return false;
  }
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
      ? spawn("cmd", ["/c", aocPath, ...args], {
          cwd: agentDir,
          env: { ...process.env },
        })
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
        isCorrect: null,
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
  const query = getQuery(event);

  // Parse query params
  const daysParam = (query.days as string) || "all";
  const useSample = query.sample === "true";
  const agentsParam = (query.agents as string) || "claude,codex,gemini";
  const languagesParam = (query.languages as string) || "ts,c";
  const partsParam = (query.parts as string) || "1,2";

  const agents = agentsParam.split(",") as ("claude" | "codex" | "gemini")[];
  const languages = languagesParam.split(",") as ("ts" | "c")[];
  const parts = partsParam.split(",").map(Number) as (1 | 2)[];

  // Get days list
  let days: number[];
  if (daysParam === "all") {
    days = Array.from({ length: 13 }, (_, i) => i);
  } else {
    days = daysParam.split(",").map(Number);
  }

  const rootDir = join(process.cwd(), "..", "..");
  const db = getDb();

  // Build list of runs to execute, filtering out unimplemented
  const runsToExecute: RunConfig[] = [];

  for (const day of days) {
    for (const agent of agents) {
      for (const part of parts) {
        // Day 12 Part 2 is a free star - always include it
        if (day === 12 && part === 2) {
          // Add for both languages to show in dashboard
          for (const language of languages) {
            runsToExecute.push({ agent, day, part, language });
          }
          continue;
        }

        for (const language of languages) {
          const dayStr = day.toString().padStart(2, "0");
          const ext = language === "ts" ? "ts" : "c";
          const filePath = join(
            rootDir,
            "agents",
            agent,
            language,
            `day${dayStr}`,
            `part${part}.${ext}`
          );

          if (await isFileImplemented(filePath)) {
            runsToExecute.push({ agent, day, part, language });
          }
        }
      }
    }
  }

  // Set up SSE
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");

  const sendEvent = (data: object) => {
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send start event
  sendEvent({ type: "start", total: runsToExecute.length });

  let completed = 0;
  let success = 0;
  let failed = 0;
  let errors = 0;

  // Process runs with concurrency limit, streaming results immediately
  const CONCURRENCY = 6;
  const runningPromises: Promise<void>[] = [];

  const processRun = async (config: RunConfig) => {
    const agentDir = join(rootDir, "agents", config.agent);

    let result: RunResult;

    // Day 12 Part 2 is a free star - no code execution needed
    if (config.day === 12 && config.part === 2) {
      result = {
        agent: config.agent,
        day: config.day,
        part: config.part,
        language: config.language,
        answer: FREE_STAR_ANSWER,
        timeMs: 0,
        isCorrect: true, // Always correct - it's a free star!
      };

      // Store in DB
      db.prepare(
        `
        INSERT INTO runs (agent, day, part, language, answer, time_ms, is_correct, is_sample, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        config.agent,
        config.day,
        config.part,
        config.language,
        result.answer,
        result.timeMs,
        1, // is_correct = true
        useSample ? 1 : 0,
        null
      );
    } else if (!existsSync(agentDir)) {
      result = {
        agent: config.agent,
        day: config.day,
        part: config.part,
        language: config.language,
        answer: "",
        timeMs: 0,
        isCorrect: null,
        error: "Agent directory not found",
      };
    } else {
      result = await executeRunner(
        agentDir,
        config.agent,
        config.day,
        config.part,
        config.language,
        useSample
      );

      // Get expected answer and check correctness
      const dayData = db
        .prepare("SELECT * FROM days WHERE id = ?")
        .get(config.day) as
        | {
            answer_p1: string | null;
            answer_p2: string | null;
            sample_expected_p1: string | null;
            sample_expected_p2: string | null;
          }
        | undefined;

      if (dayData && !result.error) {
        let expectedAnswer: string | null = null;
        if (useSample) {
          expectedAnswer =
            config.part === 1
              ? dayData.sample_expected_p1
              : dayData.sample_expected_p2;
        } else {
          expectedAnswer =
            config.part === 1 ? dayData.answer_p1 : dayData.answer_p2;
        }

        if (expectedAnswer !== null) {
          result.isCorrect = result.answer === expectedAnswer;
        }
      }

      // Store in DB
      db.prepare(
        `
        INSERT INTO runs (agent, day, part, language, answer, time_ms, is_correct, is_sample, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        config.agent,
        config.day,
        config.part,
        config.language,
        result.answer || null,
        result.timeMs,
        result.isCorrect === null ? null : result.isCorrect ? 1 : 0,
        useSample ? 1 : 0,
        result.error || null
      );
    }

    // Send result immediately when this run completes
    completed++;
    if (result.error) errors++;
    else if (result.isCorrect === true) success++;
    else if (result.isCorrect === false) failed++;

    sendEvent({
      type: "result",
      data: result,
      progress: { completed, total: runsToExecute.length },
    });
  };

  // Process all runs with concurrency control, streaming each result as it completes
  for (const config of runsToExecute) {
    // Start the run
    const promise = processRun(config).then(() => {
      // Remove from running list when done
      const idx = runningPromises.indexOf(promise);
      if (idx !== -1) runningPromises.splice(idx, 1);
    });
    runningPromises.push(promise);

    // If we've hit concurrency limit, wait for one to finish
    if (runningPromises.length >= CONCURRENCY) {
      await Promise.race(runningPromises);
    }
  }

  // Wait for remaining runs to complete
  await Promise.all(runningPromises);

  // Send done event
  sendEvent({
    type: "done",
    summary: {
      total: runsToExecute.length,
      success,
      failed,
      errors,
    },
  });

  event.node.res.end();
});
