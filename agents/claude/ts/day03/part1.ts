/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * @see https://adventofcode.com/2025/day/3
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let totalJoltage = 0;

    for (const line of lines) {
      const len = line.length;
      if (len < 2) continue;

      // O(n) optimization: precompute max digit after each position
      // maxAfter[i] = max(digit[i+1], digit[i+2], ..., digit[len-1])
      const maxAfter = new Array(len);
      maxAfter[len - 1] = 0; // no digit after last

      for (let i = len - 2; i >= 0; i--) {
        const digit = line.charCodeAt(i + 1) - 48;
        maxAfter[i] = Math.max(digit, maxAfter[i + 1]);
      }

      // Find max joltage: 10 * digit[i] + maxAfter[i]
      let maxJoltage = 0;
      for (let i = 0; i < len - 1; i++) {
        const d1 = line.charCodeAt(i) - 48;
        const joltage = d1 * 10 + maxAfter[i];
        if (joltage > maxJoltage) {
          maxJoltage = joltage;
        }
      }

      totalJoltage += maxJoltage;
    }

    return totalJoltage.toString();
  },
};
