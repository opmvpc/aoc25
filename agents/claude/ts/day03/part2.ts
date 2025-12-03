/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * @see https://adventofcode.com/2025/day/3
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let totalJoltage = BigInt(0);

    for (const line of lines) {
      const len = line.length;
      const k = 12; // number of batteries to select
      let lastPos = -1;

      // Build result as regular number (fits in 53 bits for 12 digits)
      let joltage = 0;

      // Greedy: for each position in result, choose the max digit possible
      for (let p = 0; p < k; p++) {
        const start = lastPos + 1;
        const end = len - k + p; // must leave enough digits for remaining positions

        let maxDigitCode = 48; // '0' = ASCII 48
        let maxPos = start;

        // Find the maximum digit in valid range using charCodeAt
        for (let i = start; i <= end; i++) {
          const code = line.charCodeAt(i);
          if (code > maxDigitCode) {
            maxDigitCode = code;
            maxPos = i;
          }
        }

        // Accumulate as regular number (12 digits fits in Number)
        joltage = joltage * 10 + (maxDigitCode - 48);
        lastPos = maxPos;
      }

      totalJoltage += BigInt(joltage);
    }

    return totalJoltage.toString();
  },
};
