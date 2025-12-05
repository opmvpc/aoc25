/**
 * 🎄 Advent of Code 2025 - Day 05 Part 1
 * @see https://adventofcode.com/2025/day/5
 */

import type { ISolver } from "../../tools/runner/types.js";

// Single-pass parser: fills ranges (start/end pairs) and ids, splitting on first blank line.
const parseInput = (input: string, ranges: number[], ids: number[]): void => {
  let num = 0;
  let inNum = false;
  let prevNL = false;
  let afterBlank = false;
  for (let i = 0, n = input.length; i <= n; i++) {
    const c = i < n ? input.charCodeAt(i) : 10;
    if (c >= 48 && c <= 57) {
      num = num * 10 + (c - 48);
      inNum = true;
      prevNL = false;
    } else {
      if (inNum) {
        (afterBlank ? ids : ranges).push(num);
        num = 0;
        inNum = false;
      }
      if (c === 10) {
        if (prevNL && !afterBlank) afterBlank = true;
        prevNL = true;
      } else {
        prevNL = false;
      }
    }
  }
};

export const solver: ISolver = {
  solve(input: string): string {
    const rangesFlat: number[] = [];
    const ids: number[] = [];
    parseInput(input, rangesFlat, ids);

    const rangeCount = rangesFlat.length >> 1;
    const idCount = ids.length;
    if (rangeCount === 0 || idCount === 0) return "0";

    // Split into start/end arrays and sort by start via index indirection (native sort).
    const starts = new Array<number>(rangeCount);
    const ends = new Array<number>(rangeCount);
    for (let i = 0, j = 0; i < rangeCount; i++, j += 2) {
      starts[i] = rangesFlat[j];
      ends[i] = rangesFlat[j + 1];
    }
    const order = new Array<number>(rangeCount);
    for (let i = 0; i < rangeCount; i++) order[i] = i;
    order.sort((a, b) => starts[a] - starts[b]);

    // Merge ranges into front of starts/ends (reuse arrays).
    const mStarts = new Array<number>(rangeCount);
    const mEnds = new Array<number>(rangeCount);
    let mlen = 0;
    let ms = starts[order[0]];
    let me = ends[order[0]];
    for (let k = 1; k < rangeCount; k++) {
      const idx = order[k];
      const s = starts[idx];
      const e = ends[idx];
      if (s <= me + 1) {
        if (e > me) me = e;
      } else {
        mStarts[mlen] = ms;
        mEnds[mlen] = me;
        mlen++;
        ms = s;
        me = e;
      }
    }
    mStarts[mlen] = ms;
    mEnds[mlen] = me;
    mlen++;

    // Sort IDs and sweep once against merged intervals.
    ids.sort((a, b) => a - b);
    let fresh = 0;
    let r = 0;
    for (let i = 0; i < idCount && r < mlen; i++) {
      const x = ids[i];
      while (r < mlen && x > mEnds[r]) r++;
      if (r >= mlen) break;
      if (x >= mStarts[r]) fresh++;
    }

    return String(fresh);
  },
};
