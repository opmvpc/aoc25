/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * @see https://adventofcode.com/2025/day/3
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const s = input;
    const n = s.length;
    let idx = 0;
    let total = 0;

    // Process each line without extra allocations, scanning right-to-left to pick the best pair.
    while (idx < n) {
      // Skip any newline characters (handles possible trailing newline).
      while (idx < n) {
        const c = s.charCodeAt(idx);
        if (c !== 10 && c !== 13) break;
        idx++;
      }
      if (idx >= n) break;

      const lineStart = idx;
      while (idx < n) {
        const c = s.charCodeAt(idx);
        if (c === 10 || c === 13) break;
        idx++;
      }
      const lineEnd = idx - 1;

      // Fast path for lines with at least 2 chars.
      if (lineEnd > lineStart) {
        let bestSecond = s.charCodeAt(lineEnd) - 48;
        let bestPair = 0;
        for (let j = lineEnd - 1; j >= lineStart; --j) {
          const d = s.charCodeAt(j) - 48;
          const candidate = d * 10 + bestSecond;
          if (candidate > bestPair) bestPair = candidate;
          if (d > bestSecond) bestSecond = d;
        }

        total += bestPair;
      }
    }

    return String(total);
  },
};
