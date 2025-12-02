/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    // Manual parsing to avoid per-line allocations
    const data = input.trimEnd();
    const n = data.length;
    let i = 0;

    let pos = 50; // starting position
    let hits = 0;

    while (i < n) {
      const dir = data.charCodeAt(i); // 'L' or 'R'
      i++;

      // parse distance
      let value = 0;
      while (i < n) {
        const c = data.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          value = value * 10 + (c - 48);
          i++;
        } else {
          break;
        }
      }

      // skip newline characters (\n or \r\n)
      if (i < n && data.charCodeAt(i) === 13) i++;
      if (i < n && data.charCodeAt(i) === 10) i++;

      const step = value % 100; // dial size is 100
      if (dir === 76) {
        // L
        pos -= step;
        if (pos < 0) pos += 100;
      } else {
        // R
        pos += step;
        if (pos >= 100) pos -= 100;
      }

      if (pos === 0) hits++;
    }

    return hits.toString();
  },
};
