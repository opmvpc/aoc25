/**
 * 🏆 AoC 2025 Battle Royale - Utilities
 */

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Agent } from "./types.js";

/**
 * Détecte l'agent depuis le répertoire courant
 * Le runner est dans agents/XXX/tools/runner/
 * Donc on remonte de 2 niveaux pour trouver le nom de l'agent
 */
export function detectAgent(cwd: string): { agent: Agent; agentDir: string } | null {
  const normalized = resolve(cwd);

  // Check if we're in an agent directory
  const parts = normalized.split(/[/\\]/);
  const agentsIndex = parts.findIndex((p) => p === "agents");

  if (agentsIndex === -1 || agentsIndex >= parts.length - 1) {
    return null;
  }

  const agentName = parts[agentsIndex + 1];
  if (!["claude", "codex", "gemini"].includes(agentName!)) {
    return null;
  }

  const agentDir = parts.slice(0, agentsIndex + 2).join("/");

  return {
    agent: agentName as Agent,
    agentDir,
  };
}

/**
 * Trouve le répertoire core/data depuis le répertoire de l'agent
 */
export function getCoreDataDir(agentDir: string, day: number): string {
  const dayStr = day.toString().padStart(2, "0");
  // agents/XXX -> root -> core/data/dayXX
  const root = resolve(agentDir, "..", "..");
  return join(root, "core", "data", `day${dayStr}`);
}

/**
 * Charge les réponses attendues
 */
export async function loadExpected(
  agentDir: string,
  day: number,
  useSample: boolean
): Promise<{ part1: string | null; part2: string | null }> {
  const dayStr = day.toString().padStart(2, "0");

  let filePath: string;
  if (useSample) {
    filePath = join(agentDir, "data", `day${dayStr}`, "sample.expected.json");
  } else {
    const root = resolve(agentDir, "..", "..");
    filePath = join(root, "core", "data", `day${dayStr}`, "answers.json");
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { part1: null, part2: null };
  }
}

/**
 * Formate le temps en millisecondes de manière lisible
 */
export function formatTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Affiche le résultat d'un run
 */
export function formatResult(
  answer: string,
  timeMs: number,
  isCorrect: boolean | null,
  expected: string | null,
  error?: string
): string {
  const lines: string[] = [];

  if (error) {
    lines.push(`❌ Error: ${error}`);
  } else {
    let statusIcon: string;
    if (isCorrect === null) {
      statusIcon = "⏳";
    } else if (isCorrect) {
      statusIcon = "✅";
    } else {
      statusIcon = "❌";
    }

    lines.push(`${statusIcon} Answer: ${answer}`);
    lines.push(`⏱️  Time: ${formatTime(timeMs)}`);

    if (isCorrect === false && expected) {
      lines.push(`📋 Expected: ${expected}`);
    }
  }

  return lines.join("\n");
}
