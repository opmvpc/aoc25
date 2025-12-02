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
      const dir = s.charCodeAt(i++); // 'L' or 'R'

      let dist = 0;
      let c: number;
      while (i < len && (c = s.charCodeAt(i)) >= 48 && c <= 57) {
        dist = dist * 10 + (c - 48);
        i++;
      }
      // Skip newline chars fast
      while (i < len && ((c = s.charCodeAt(i)) === 10 || c === 13)) i++;

      const step = dist % 100;
      if (dir === 82 /* 'R' */) {
        pos += step;
        if (pos >= 100) pos -= 100;
      } else {
        pos -= step;
        if (pos < 0) pos += 100;
      }

      hits += (pos === 0) as unknown as number;
    }

    return String(hits);
  },
};
