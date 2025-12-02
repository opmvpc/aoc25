/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let pos = 50;
    let hits = 0;
    const s = input;
    const len = s.length;

    for (let i = 0; i < len; ) {
      const dir = s.charCodeAt(i); // 'L' or 'R'
      i++;

      let dist = 0;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          dist = dist * 10 + (c - 48);
          i++;
        } else {
          // Skip newline characters (\n or \r\n)
          do {
            i++;
          } while (i < len && (s.charCodeAt(i) === 10 || s.charCodeAt(i) === 13));
          break;
        }
      }

      const step = dist % 100;
      if (dir === 82) {
        // 'R'
        pos += step;
        if (pos >= 100) pos -= 100;
      } else {
        // 'L'
        pos -= step;
        if (pos < 0) pos += 100;
      }

      if (pos === 0) hits++;
    }

    return String(hits);
  },
};
