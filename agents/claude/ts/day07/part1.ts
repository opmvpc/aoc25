/**
 * 🎄 Advent of Code 2025 - Day 07 Part 1 - Tachyon Beam Splitters
 * @see https://adventofcode.com/2025/day/7
 *
 * Simulate tachyon beams descending from S.
 * When a beam hits '^', it splits into left and right beams.
 * Count the total number of splits.
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.split("\n");
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    const width = Math.max(...lines.map(l => l.length));

    // Find S position
    let startCol = -1;
    for (let c = 0; c < lines[0].length; c++) {
      if (lines[0][c] === "S") {
        startCol = c;
        break;
      }
    }

    // Track active beam columns (as a Set for deduplication)
    let active = new Set<number>();
    active.add(startCol);

    let splitCount = 0;

    // Process each row
    for (let row = 1; row < lines.length; row++) {
      const nextActive = new Set<number>();

      for (const col of active) {
        const cell = col < lines[row].length ? lines[row][col] : ".";

        if (cell === "^") {
          splitCount++;
          if (col > 0) nextActive.add(col - 1);
          if (col < width - 1) nextActive.add(col + 1);
        } else {
          nextActive.add(col);
        }
      }

      active = nextActive;
    }

    return splitCount.toString();
  },
};
