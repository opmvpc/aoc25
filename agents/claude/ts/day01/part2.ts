/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Count ALL times dial crosses 0 (during and at end of rotations)
 * Optimized: fast parsing, no modulo
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
      if (c !== 76 && c !== 82) {
        i++;
        continue;
      }

      const isRight = c === 82;
      i++;

      // Fast integer parse
      let dist = 0;
      let ch: number;
      while (i < len && (ch = input.charCodeAt(i)) >= 48 && ch <= 57) {
        dist = dist * 10 + ch - 48;
        i++;
      }

      if (isRight) {
        const total = pos + dist;
        const crossings = (total / 100) | 0;
        count += crossings;
        pos = total - crossings * 100;
      } else {
        const fullRot = (dist / 100) | 0;
        const rem = dist - fullRot * 100;
        count += fullRot + (+(rem >= pos && pos !== 0));
        pos = pos - rem;
        if (pos < 0) pos += 100;
      }
    }

    return count.toString();
  },
};
