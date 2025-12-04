/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * @see https://adventofcode.com/2025/day/4
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let end = input.length;
    while (end > 0) {
      const ch = input.charCodeAt(end - 1);
      if (ch === 10 || ch === 13) end--;
      else break;
    }
    if (end === 0) return "0";

    let width = 0;
    while (width < end && input.charCodeAt(width) !== 10) width++;

    let height = 1;
    for (let i = width; i < end; i++) if (input.charCodeAt(i) === 10) height++;

    const stride = width + 2; // padded grid to drop bounds checks
    const grid = new Uint8Array((height + 2) * stride);
    const at = 64; // '@'

    let r = 1;
    let c = 1;
    for (let i = 0; i < end; i++) {
      const ch = input.charCodeAt(i);
      if (ch === 10) {
        r++;
        c = 1;
      } else {
        grid[r * stride + c] = ch === at ? 1 : 0;
        c++;
      }
    }

    let accessible = 0;
    for (let row = 1; row <= height; row++) {
      const rowBase = row * stride;
      for (let col = 1; col <= width; col++) {
        const pos = rowBase + col;
        if (grid[pos] === 0) continue;

        const neighborCount =
          grid[pos - stride - 1] +
          grid[pos - stride] +
          grid[pos - stride + 1] +
          grid[pos - 1] +
          grid[pos + 1] +
          grid[pos + stride - 1] +
          grid[pos + stride] +
          grid[pos + stride + 1];

        if (neighborCount < 4) accessible++;
      }
    }

    return String(accessible);
  },
};
