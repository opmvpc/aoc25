/**
 * 🎄 Advent of Code 2025 - Day 07 Part 1
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
      const s = line.indexOf("S");
      if (s >= 0) {
        startRow = r;
        startCol = s;
      }
    }

    const maskA = new Uint8Array(width);
    const maskB = new Uint8Array(width);
    const listA = new Uint16Array(width);
    const listB = new Uint16Array(width);

    let currMask = maskA;
    let nextMask = maskB;
    let currList = listA;
    let nextList = listB;

    let currLen = 0;
    currMask[startCol] = 1;
    currList[currLen++] = startCol;

    let splits = 0;
    for (let r = startRow + 1; r < height && currLen > 0; r++) {
      const row = lines[r];
      const rowLen = row.length;
      let nextLen = 0;

      for (let i = 0; i < currLen; i++) {
        const c = currList[i];
        if (c < rowLen && row.charCodeAt(c) === 94) {
          splits++;
          const left = c - 1;
          const right = c + 1;
          if (left >= 0 && nextMask[left] === 0) {
            nextMask[left] = 1;
            nextList[nextLen++] = left;
          }
          if (right < width && nextMask[right] === 0) {
            nextMask[right] = 1;
            nextList[nextLen++] = right;
          }
        } else if (nextMask[c] === 0) {
          nextMask[c] = 1;
          nextList[nextLen++] = c;
        }
      }

      for (let i = 0; i < currLen; i++) {
        currMask[currList[i]] = 0;
      }

      let tmpMask = currMask;
      currMask = nextMask;
      nextMask = tmpMask;
      let tmpList = currList;
      currList = nextList;
      nextList = tmpList;
      currLen = nextLen;
    }

    return String(splits);
  },
};
