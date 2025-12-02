/**
 * POST /api/runs/debug - Exécuter un solver et retourner l'output brut
 * Pour le debugging
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";

interface DebugRunRequest {
  agent: "claude" | "codex" | "gemini";
  day: number;
  part: 1 | 2;
  language: "ts" | "c";
  useSample?: boolean;
}

interface DebugRunResult {
  agent: string;
  day: number;
  part: number;
  language: string;
  useSample: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  error?: string;
  command: string;
}

async function executeRunner(
  agentDir: string,
  day: number,
  part: 1 | 2,
  language: "ts" | "c",
  useSample: boolean
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  error?: string;
  command: string;
}> {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const aocPath = join(agentDir, "tools", isWindows ? "aoc.bat" : "aoc");
    const args = ["run", day.toString(), part.toString()];

    if (useSample) args.push("--sample");
    if (language === "c") args.push("--lang", "c");

    const command = `${aocPath} ${args.join(" ")}`;

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

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1_000_000;
      resolve({
        stdout,
        stderr,
        exitCode: null,
        timeMs,
        error: "Execution timed out (60s)",
        command,
      });
    }, 60000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const endTime = process.hrtime.bigint();
      const timeMs = Number(endTime - startTime) / 1_000_000;

      resolve({
        stdout,
        stderr,
        exitCode: code,
        timeMs,
        command,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        stdout,
        stderr,
        exitCode: null,
        timeMs: 0,
        error: `Process error: ${err.message}`,
        command,
      });
    });
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DebugRunRequest>(event);

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

  const rootDir = join(process.cwd(), "..", "..");
  const agentDir = join(rootDir, "agents", body.agent);

  if (!existsSync(agentDir)) {
    throw createError({
      statusCode: 404,
      message: "Agent directory not found",
    });
  }

  const result = await executeRunner(
    agentDir,
    body.day,
    body.part,
    body.language,
    body.useSample ?? false
  );

  return {
    agent: body.agent,
    day: body.day,
    part: body.part,
    language: body.language,
    useSample: body.useSample ?? false,
    ...result,
  };
});
