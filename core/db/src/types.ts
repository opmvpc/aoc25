/**
 * 🏆 AoC 2025 Battle Royale - Database Types
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

export interface BenchmarkRun {
  id: number;
  session_id: number;
  run_index: number;
  time_ms: number;
}

// Input types for creating records
export interface CreateRunInput {
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  answer?: string;
  time_ms: number;
  is_correct?: boolean;
  is_sample?: boolean;
  error?: string;
}

export interface UpdateDayInput {
  puzzle1_md?: string;
  puzzle2_md?: string;
  sample_input?: string;
  sample_expected_p1?: string;
  sample_expected_p2?: string;
  final_input?: string;
  answer_p1?: string;
  answer_p2?: string;
  published_at?: string;
}

export interface CreateBenchmarkInput {
  agent: Agent;
  day: number;
  part: Part;
  language: Language;
  num_runs: number;
  answer?: string;
  is_correct?: boolean;
  times: number[];  // Array of time_ms for each run
}

export interface BenchmarkStats {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
  p50: number;
  p95: number;
  p99: number;
}
