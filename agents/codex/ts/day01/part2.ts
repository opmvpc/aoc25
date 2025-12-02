/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
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
      while (i < len && ((c = s.charCodeAt(i)) === 10 || c === 13)) i++;

      // Count every click that lands on 0 using arithmetic instead of simulation.
      let first = dir === 82 /* 'R' */ ? (100 - pos) % 100 : pos;
      if (first === 0) first = 100;
      const rem = dist - first;
      if (rem >= 0) {
        hits += 1 + Math.floor(rem / 100);
      }

      const step = dist % 100;
      if (dir === 82) {
        pos += step;
        if (pos >= 100) pos -= 100;
      } else {
        pos -= step;
        if (pos < 0) pos += 100;
      }
    }

    return String(hits);
  },
};
