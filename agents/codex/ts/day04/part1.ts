/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * @see https://adventofcode.com/2025/day/4
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const h = lines.length;
    if (h === 0 || lines[0].length === 0) return "0";

    const w = lines[0].length;
    const stride = w + 2; // padded grid to drop bounds checks
    const grid = new Uint8Array((h + 2) * stride);
    const at = "@".charCodeAt(0);

    for (let r = 0; r < h; r++) {
      const line = lines[r];
      let idx = (r + 1) * stride + 1;
      for (let c = 0; c < w; c++, idx++) {
        grid[idx] = line.charCodeAt(c) === at ? 1 : 0;
      }
    }

    let accessible = 0;
    for (let r = 1; r <= h; r++) {
      const rowBase = r * stride;
      for (let c = 1; c <= w; c++) {
        const pos = rowBase + c;
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
