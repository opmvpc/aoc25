/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let position = 50;
    let count = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Skip whitespace
      while (i < len && (input[i] === ' ' || input[i] === '\r')) i++;
      if (i >= len) break;

      // Read direction
      const direction = input[i++];
      if (direction === '\n') continue;

      // Parse distance manually (faster than parseInt)
      let distance = 0;
      while (i < len && input[i] >= '0' && input[i] <= '9') {
        distance = distance * 10 + (input.charCodeAt(i) - 48);
        i++;
      }

      // Skip newline
      if (i < len && input[i] === '\n') i++;

      if (direction === 'L') {
        position = (position - distance % 100 + 100) % 100;
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
