/**
 * 🎄 Advent of Code 2025 - Day 07 Part 2 - Quantum Tachyon Timelines
 * @see https://adventofcode.com/2025/day/7
 *
 * Count timelines: each split creates 2 timelines.
 * Track number of timelines at each column position using BigInt.
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

    // Track number of timelines at each column (use BigInt for large numbers)
    let timelines = new Map<number, bigint>();
    timelines.set(startCol, 1n);

    // Process each row
    for (let row = 1; row < lines.length; row++) {
      const nextTimelines = new Map<number, bigint>();

      for (const [col, count] of timelines) {
        const cell = col < lines[row].length ? lines[row][col] : ".";

        if (cell === "^") {
          // Split: timeline goes both left and right
          if (col > 0) {
            nextTimelines.set(col - 1, (nextTimelines.get(col - 1) || 0n) + count);
          }
          if (col < width - 1) {
            nextTimelines.set(col + 1, (nextTimelines.get(col + 1) || 0n) + count);
          }
        } else {
          // Continue down
          nextTimelines.set(col, (nextTimelines.get(col) || 0n) + count);
        }
      }

      timelines = nextTimelines;
    }

    // Sum all timelines
    let total = 0n;
    for (const count of timelines.values()) {
      total += count;
    }

    return total.toString();
  },
};
