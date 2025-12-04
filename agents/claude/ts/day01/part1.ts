/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Dial starts at 50, count times it lands on 0 after rotations
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let pos = 50;
    let count = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      const c = input.charCodeAt(i);

      // Skip non-L/R chars
      if (c !== 76 && c !== 82) { // 'L' = 76, 'R' = 82
        i++;
        continue;
      }

      const isLeft = c === 76;
      i++;

      // Fast integer parse
      let dist = 0;
      let ch: number;
      while (i < len && (ch = input.charCodeAt(i)) >= 48 && ch <= 57) {
        dist = dist * 10 + ch - 48;
        i++;
      }

      // Update position - branchless modulo
      if (isLeft) {
        pos = ((pos - dist) % 100 + 100) % 100;
      } else {
        pos = (pos + dist) % 100;
      }

      // Count if at 0 (branchless)
      count += +(pos === 0);
    }

    return count.toString();
  },
};
