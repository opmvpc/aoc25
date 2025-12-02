/**
 * 🏆 AoC 2025 Battle Royale - Runner Types
 */

export interface ISolver {
  solve(input: string): string;
}

export interface RunResult {
  answer: string;
  timeMs: number;
  isCorrect: boolean | null; // null = pas encore vérifié
  error?: string;
}

export interface RunConfig {
  day: number;
  part: 1 | 2;
  lang: "ts" | "c";
  useSample: boolean;
  agentDir: string;
  coreDataDir: string;
}

export type Agent = "claude" | "codex" | "gemini";
