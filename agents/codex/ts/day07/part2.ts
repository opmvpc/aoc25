/**
 * 🎄 Advent of Code 2025 - Day 07 Part 2
 * @see https://adventofcode.com/2025/day/7
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.endsWith("\n")
      ? input.slice(0, -1).split("\n")
      : input.split("\n");
    const height = lines.length;

    let width = 0;
    let startRow = 0;
    let startCol = 0;
    for (let r = 0; r < height; r++) {
      const line = lines[r];
      const len = line.length;
      if (len > width) width = len;
      const idx = line.indexOf("S");
      if (idx >= 0) {
        startRow = r;
        startCol = idx;
      }
    }

    const countsA = new Float64Array(width);
    const countsB = new Float64Array(width);
    const listA = new Uint16Array(width);
    const listB = new Uint16Array(width);

    let currCounts = countsA;
    let nextCounts = countsB;
    let currList = listA;
    let nextList = listB;

    let currLen = 0;
    currCounts[startCol] = 1;
    currList[currLen++] = startCol;

    let outside = 0;

    for (let r = startRow + 1; r < height && currLen > 0; r++) {
      const row = lines[r];
      const rowLen = row.length;
      let nextLen = 0;

      for (let i = 0; i < currLen; i++) {
        const c = currList[i];
        const cnt = currCounts[c];
        if (c < rowLen && row.charCodeAt(c) === 94) {
          const left = c - 1;
          const right = c + 1;
          if (left >= 0) {
            if (nextCounts[left] === 0) nextList[nextLen++] = left;
            nextCounts[left] += cnt;
          } else {
            outside += cnt;
          }
          if (right < width) {
            if (nextCounts[right] === 0) nextList[nextLen++] = right;
            nextCounts[right] += cnt;
          } else {
            outside += cnt;
          }
        } else {
          if (nextCounts[c] === 0) nextList[nextLen++] = c;
          nextCounts[c] += cnt;
        }
      }

      for (let i = 0; i < currLen; i++) {
        currCounts[currList[i]] = 0;
      }

      let tmpCounts = currCounts;
      currCounts = nextCounts;
      nextCounts = tmpCounts;

      let tmpList = currList;
      currList = nextList;
      nextList = tmpList;

      currLen = nextLen;
    }

    let total = outside;
    for (let i = 0; i < currLen; i++) {
      total += currCounts[currList[i]];
    }

    return String(total);
  },
};
