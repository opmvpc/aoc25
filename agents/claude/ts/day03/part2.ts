/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Pick 12 batteries to maximize 12-digit joltage
 * Simple greedy with linear scan, BigInt only for final sum
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let total = 0n;
    let i = 0;
    const inputLen = input.length;
    const K = 12;

    while (i < inputLen) {
      // Find line boundaries
      const lineStart = i;
      while (i < inputLen && input.charCodeAt(i) >= 48) i++;
      const len = i - lineStart;
      i++; // skip newline

      if (len < K) continue;

      // Greedy: for each of K positions, find max in valid range
      // Use number for joltage (12 digits fits in 53-bit mantissa)
      let joltage = 0;
      let lastPos = -1;

      for (let p = 0; p < K; p++) {
        const start = lastPos + 1;
        const end = len - K + p;

        // Linear scan for max in range [start, end]
        let maxIdx = start;
        let maxVal = input.charCodeAt(lineStart + start);

        for (let j = start + 1; j <= end; j++) {
          const v = input.charCodeAt(lineStart + j);
          if (v > maxVal) {
            maxVal = v;
            maxIdx = j;
          }
        }

        joltage = joltage * 10 + (maxVal - 48);
        lastPos = maxIdx;
      }

      // Only convert to BigInt when adding
      total += BigInt(joltage);
    }

    return total.toString();
  },
};
