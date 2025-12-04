/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Dial starts at 50, count times it lands on 0 after rotations
 * Optimized: fast parsing, minimal branching
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

      // Skip non-L/R (newlines = 10, etc)
      if (c !== 76 && c !== 82) {
        i++;
        continue;
      }

      // L=76, R=82
      const isRight = c === 82;
      i++;

      // Fast integer parse
      let dist = 0;
      let ch: number;
      while (i < len && (ch = input.charCodeAt(i)) >= 48 && ch <= 57) {
        dist = dist * 10 + ch - 48;
        i++;
      }

      // Apply movement with minimal modulo
      dist %= 100;
      if (isRight) {
        pos = (pos + dist) % 100;
      } else {
        pos = pos - dist;
        if (pos < 0) pos += 100;
      }

      // Count if at 0
      count += +(pos === 0);
    }

    return count.toString();
  },
};
