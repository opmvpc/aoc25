/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");

    let position = 50;
    let count = 0;

    for (const line of lines) {
      const direction = line[0];
      const distance = parseInt(line.slice(1));

      if (direction === "L") {
        position = ((position - distance) % 100 + 100) % 100;
      } else {
        position = (position + distance) % 100;
      }

      if (position === 0) {
        count++;
      }
    }

    return count.toString();
  },
};
