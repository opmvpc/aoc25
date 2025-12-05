/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2
 * @see https://adventofcode.com/2025/day/5
 */

import type { ISolver } from "../../tools/runner/types.js";

// Parse only ranges; ignores numbers after the blank line.
const parseRanges = (input: string, out: number[]): void => {
  let num = 0;
  let inNum = false;
  let prevNL = false;
  let afterBlank = false;
  for (let i = 0, n = input.length; i <= n; i++) {
    const c = i < n ? input.charCodeAt(i) : 10;
    if (c >= 48 && c <= 57) {
      if (!afterBlank) {
        num = num * 10 + (c - 48);
        inNum = true;
      }
      prevNL = false;
    } else {
      if (inNum && !afterBlank) {
        out.push(num);
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
    parseRanges(input, rangesFlat);

    const rangeCount = rangesFlat.length >> 1;
    if (rangeCount === 0) return "0";

    const starts = new Array<number>(rangeCount);
    const ends = new Array<number>(rangeCount);
    for (let i = 0, j = 0; i < rangeCount; i++, j += 2) {
      starts[i] = rangesFlat[j];
      ends[i] = rangesFlat[j + 1];
    }
    const order = new Array<number>(rangeCount);
    for (let i = 0; i < rangeCount; i++) order[i] = i;
    order.sort((a, b) => starts[a] - starts[b]);

    let ms = starts[order[0]];
    let me = ends[order[0]];
    let total = 0;
    for (let k = 1; k < rangeCount; k++) {
      const idx = order[k];
      const s = starts[idx];
      const e = ends[idx];
      if (s <= me + 1) {
        if (e > me) me = e;
      } else {
        total += me - ms + 1;
        ms = s;
        me = e;
      }
    }
    total += me - ms + 1;

    return String(total);
  },
};
