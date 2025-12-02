/**
 * 🏆 AoC 2025 Battle Royale - Frontend Types
 */

export type Agent = "claude" | "codex" | "gemini";
export type Language = "ts" | "c";
export type Part = 1 | 2;

export interface Day {
  id: number;
  puzzle1_md: string | null;
  puzzle2_md: string | null;
  sample_input: string | null;
  sample_expected_p1: string | null;
  sample_expected_p2: string | null;
  final_input: string | null;
  answer_p1: string | null;
  answer_p2: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: number;
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  answer: string | null;
  time_ms: number;
  is_correct: boolean | null;
  is_sample: boolean;
  error: string | null;
  created_at: string;
}

export interface BenchmarkSession {
  id: number;
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  num_runs: number;
  answer: string | null;
  is_correct: boolean | null;
  avg_time_ms: number | null;
  min_time_ms: number | null;
  max_time_ms: number | null;
  std_dev_ms: number | null;
  p50_time_ms: number | null;
  p95_time_ms: number | null;
  p99_time_ms: number | null;
  created_at: string;
}

export interface DayWithRuns extends Day {
  runs: Run[];
  latestRuns: {
    [key in Agent]?: {
      ts?: { part1?: Run; part2?: Run };
      c?: { part1?: Run; part2?: Run };
    };
  };
}

export interface RunRequest {
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  useSample?: boolean;
}

export interface BenchmarkRequest {
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  numRuns?: number;
}

export const AGENTS: Agent[] = ["claude", "codex", "gemini"];
export const LANGUAGES: Language[] = ["ts", "c"];
export const PARTS: Part[] = [1, 2];
