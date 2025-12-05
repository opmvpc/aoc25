/**
 * 🎄 Advent of Code 2025 - Day 05 Part 1 - OPTIMIZED
 * Techniques: typed arrays, manual parsing, binary search
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const blankIdx = input.indexOf("\n\n");
    const rangesStr = input.slice(0, blankIdx);
    const idsStr = input.slice(blankIdx + 2);

    // Parse ranges into typed arrays for cache efficiency
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

    // Parse IDs
    const idLines = idsStr.trim().split("\n");
    const ids = new Float64Array(idLines.length);
    for (let i = 0; i < idLines.length; i++) {
      ids[i] = +idLines[i];
    }

    // Sort ranges by start using indices
    const indices = new Uint16Array(n);
    for (let i = 0; i < n; i++) indices[i] = i;
    indices.sort((a, b) => starts[a] - starts[b]);

    // Merge ranges
    const mStarts: number[] = [];
    const mEnds: number[] = [];
    let curStart = starts[indices[0]];
    let curEnd = ends[indices[0]];

    for (let i = 1; i < n; i++) {
      const idx = indices[i];
      if (starts[idx] <= curEnd + 1) {
        if (ends[idx] > curEnd) curEnd = ends[idx];
      } else {
        mStarts.push(curStart);
        mEnds.push(curEnd);
        curStart = starts[idx];
        curEnd = ends[idx];
      }
    }
    mStarts.push(curStart);
    mEnds.push(curEnd);

    const m = mStarts.length;

    // Binary search helper
    const isFresh = (id: number): number => {
      let lo = 0,
        hi = m;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (id > mEnds[mid]) {
          lo = mid + 1;
        } else if (id < mStarts[mid]) {
          hi = mid;
        } else {
          return 1;
        }
      }
      return 0;
    };

    // Count fresh IDs
    let count = 0;
    for (let i = 0; i < ids.length; i++) {
      count += isFresh(ids[i]);
    }

    return count.toString();
  },
};
