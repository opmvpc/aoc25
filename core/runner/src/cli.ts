#!/usr/bin/env node
/**
 * 🏆 AoC 2025 Battle Royale - CLI
 *
 * Usage:
 *   aoc run <day> <part> [--sample] [--lang c]
 *   aoc check <day> <part> [--sample] [--lang c]
 */

import { Command } from "commander";
import { executeTs } from "./executor-ts.js";
import { executeC } from "./executor-c.js";
import {
  detectAgent,
  getCoreDataDir,
  loadExpected,
  formatResult,
} from "./utils.js";
import type { RunConfig, RunResult } from "./types.js";

const program = new Command();

program
  .name("aoc")
  .description("🏆 AoC 2025 Battle Royale Runner")
  .version("1.0.0");

// Common options
interface RunOptions {
  sample?: boolean;
  lang?: "ts" | "c";
}

function validateDayPart(
  dayStr: string,
  partStr: string
): { day: number; part: 1 | 2 } | null {
  const day = parseInt(dayStr, 10);
  const part = parseInt(partStr, 10);

  if (isNaN(day) || day < 0 || day > 25) {
    console.error(`❌ Invalid day: ${dayStr} (must be 0-25)`);
    return null;
  }

  if (part !== 1 && part !== 2) {
    console.error(`❌ Invalid part: ${partStr} (must be 1 or 2)`);
    return null;
  }

  return { day, part: part as 1 | 2 };
}

program
  .command("run <day> <part>")
  .description("Run a solver")
  .option("-s, --sample", "Use sample input instead of final input")
  .option("-l, --lang <lang>", "Language: ts or c", "ts")
  .action(async (dayStr: string, partStr: string, options: RunOptions) => {
    const validated = validateDayPart(dayStr, partStr);
    if (!validated) return;

    const { day, part } = validated;
    const lang = (options.lang as "ts" | "c") || "ts";
    const useSample = options.sample ?? false;

    // Detect agent
    const agentInfo = detectAgent(process.cwd());
    if (!agentInfo) {
      console.error(
        "❌ Not in an agent directory. Run from agents/claude/, agents/codex/, or agents/gemini/"
      );
      process.exit(1);
    }

    const { agent, agentDir } = agentInfo;
    const coreDataDir = getCoreDataDir(agentDir, day);

    console.log(
      `\n🎄 AoC 2025 - Day ${day.toString().padStart(2, "0")} Part ${part}`
    );
    console.log(`🤖 Agent: ${agent}`);
    console.log(`📝 Language: ${lang.toUpperCase()}`);
    console.log(`📁 Input: ${useSample ? "sample" : "final"}`);
    console.log("─".repeat(40));

    const config: RunConfig = {
      day,
      part,
      lang,
      useSample,
      agentDir,
      coreDataDir,
    };

    // Execute
    let result: RunResult;
    if (lang === "ts") {
      result = await executeTs(config);
    } else {
      result = await executeC(config);
    }

    // Load expected for comparison
    const expected = await loadExpected(agentDir, day, useSample);
    const expectedAnswer = part === 1 ? expected.part1 : expected.part2;

    if (expectedAnswer !== null && !result.error) {
      result.isCorrect = result.answer === expectedAnswer;
    }

    console.log(
      formatResult(
        result.answer,
        result.timeMs,
        result.isCorrect,
        expectedAnswer,
        result.error
      )
    );
    console.log("");
  });

program
  .command("check <day> <part>")
  .description("Run solver and verify against expected answer")
  .option("-s, --sample", "Use sample input")
  .option("-l, --lang <lang>", "Language: ts or c", "ts")
  .action(async (dayStr: string, partStr: string, options: RunOptions) => {
    const validated = validateDayPart(dayStr, partStr);
    if (!validated) return;

    const { day, part } = validated;
    const lang = (options.lang as "ts" | "c") || "ts";
    const useSample = options.sample ?? false;

    const agentInfo = detectAgent(process.cwd());
    if (!agentInfo) {
      console.error("❌ Not in an agent directory.");
      process.exit(1);
    }

    const { agent, agentDir } = agentInfo;
    const coreDataDir = getCoreDataDir(agentDir, day);

    // Load expected first
    const expected = await loadExpected(agentDir, day, useSample);
    const expectedAnswer = part === 1 ? expected.part1 : expected.part2;

    if (expectedAnswer === null) {
      console.error(
        `❌ No expected answer for Day ${day} Part ${part}${
          useSample ? " (sample)" : ""
        }`
      );
      process.exit(1);
    }

    console.log(
      `\n🧪 Checking Day ${day.toString().padStart(2, "0")} Part ${part}`
    );
    console.log(
      `🤖 Agent: ${agent} | ${lang.toUpperCase()} | ${
        useSample ? "sample" : "final"
      }`
    );
    console.log("─".repeat(40));

    const config: RunConfig = {
      day,
      part,
      lang,
      useSample,
      agentDir,
      coreDataDir,
    };

    let result: RunResult;
    if (lang === "ts") {
      result = await executeTs(config);
    } else {
      result = await executeC(config);
    }

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      process.exit(1);
    }

    result.isCorrect = result.answer === expectedAnswer;
    console.log(
      formatResult(
        result.answer,
        result.timeMs,
        result.isCorrect,
        expectedAnswer
      )
    );

    if (!result.isCorrect) {
      process.exit(1);
    }

    console.log("");
  });

program.parse();
