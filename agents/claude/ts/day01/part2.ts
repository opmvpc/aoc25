/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Count ALL times dial crosses 0 (during and at end of rotations)
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

      if (isLeft) {
        // Left: count full rotations + crossing if remainder >= pos
        const fullRotations = (dist / 100) | 0;
        const rem = dist - fullRotations * 100;
        count += fullRotations;
        // Cross 0 if we pass through it (rem >= pos, but not if pos is 0)
        count += +(rem >= pos && pos !== 0);
        pos = ((pos - rem) % 100 + 100) % 100;
      } else {
        // Right: (pos + dist) / 100 gives full crossings
        count += ((pos + dist) / 100) | 0;
        pos = (pos + dist) % 100;
      }
    }

    return count.toString();
  },
};
