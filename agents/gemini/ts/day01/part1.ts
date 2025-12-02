/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let position = 50;
    let count = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Skip whitespace
      while (i < len && input.charCodeAt(i) <= 32) {
        i++;
      }
      if (i >= len) break;

      const dir = input.charCodeAt(i); // 'L' or 'R'
      i++;
      
      let val = 0;
      while (i < len) {
        const c = input.charCodeAt(i);
        if (c < 48 || c > 57) break;
        val = val * 10 + (c - 48);
        i++;
      }

      if (dir === 76) { // 'L'
        position = (position - val) % 100;
        if (position < 0) position += 100;
      } else { // 'R' assumed
        position = (position + val) % 100;
      }

      if (position === 0) {
        count++;
      }
    }

    return count.toString();
  },
};