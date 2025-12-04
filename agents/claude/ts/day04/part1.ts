/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * Count rolls (@) with fewer than 4 neighbors
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const rows = lines.length;
    const cols = lines[0].length;

    let count = 0;

    for (let r = 0; r < rows; r++) {
      const line = lines[r];
      for (let c = 0; c < cols; c++) {
        if (line[c] !== "@") continue;

        // Count neighbors (8 directions)
        let neighbors = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && lines[nr][nc] === "@") {
              neighbors++;
            }
          }
        }

        if (neighbors < 4) count++;
      }
    }

    return count.toString();
  },
};
