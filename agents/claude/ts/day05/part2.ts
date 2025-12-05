/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2 - OPTIMIZED
 * Techniques: typed arrays, manual parsing, single-pass merge+sum
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const blankIdx = input.indexOf("\n\n");
    const rangesStr = input.slice(0, blankIdx);

    // Parse ranges into typed arrays
    const rangeLines = rangesStr.split("\n");
    const n = rangeLines.length;
    const starts = new Float64Array(n);
    const ends = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      const line = rangeLines[i];
      const dashIdx = line.indexOf("-");
      starts[i] = +line.slice(0, dashIdx);
      ends[i] = +line.slice(dashIdx + 1);
    }

    // Sort ranges by start using indices
    const indices = new Uint16Array(n);
    for (let i = 0; i < n; i++) indices[i] = i;
    indices.sort((a, b) => starts[a] - starts[b]);

    // Merge and sum in one pass
    let total = 0;
    let curStart = starts[indices[0]];
    let curEnd = ends[indices[0]];

    for (let i = 1; i < n; i++) {
      const idx = indices[i];
      if (starts[idx] <= curEnd + 1) {
        if (ends[idx] > curEnd) curEnd = ends[idx];
      } else {
        total += curEnd - curStart + 1;
        curStart = starts[idx];
        curEnd = ends[idx];
      }
    }
    total += curEnd - curStart + 1;

    return total.toString();
  },
};
