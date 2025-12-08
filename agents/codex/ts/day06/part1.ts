/**
 * 🎄 Advent of Code 2025 - Day 06 Part 1
 * @see https://adventofcode.com/2025/day/6
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const rawLines = input.endsWith("\n")
      ? input.slice(0, -1).split("\n")
      : input.split("\n");
    const rowCount = rawLines.length;
    const lastRow = rawLines[rowCount - 1];

    let maxLen = 0;
    for (let i = 0; i < rowCount; i++) {
      const len = rawLines[i].length;
      if (len > maxLen) maxLen = len;
    }

    const colUsed = new Uint8Array(maxLen);
    for (let r = 0; r < rowCount; r++) {
      const line = rawLines[r];
      const len = line.length;
      for (let c = 0; c < len; c++) {
        if (line.charCodeAt(c) !== 32) colUsed[c] = 1;
      }
    }

    let total = 0;
    let col = 0;
    while (col < maxLen) {
      while (col < maxLen && colUsed[col] === 0) col++;
      if (col >= maxLen) break;
      const start = col;
      while (col < maxLen && colUsed[col] === 1) col++;
      const end = col;

      let op = 0;
      const lastLen = lastRow.length;
      for (let c = start; c < end && op === 0; c++) {
        const ch = c < lastLen ? lastRow.charCodeAt(c) : 32;
        if (ch === 43 || ch === 42) op = ch;
      }
      const isAdd = op === 43;

      let acc = isAdd ? 0 : 1;
      for (let r = 0; r < rowCount - 1; r++) {
        const line = rawLines[r];
        const len = line.length;
        let val = 0;
        let hasDigit = false;
        for (let c = start; c < end && c < len; c++) {
          const code = line.charCodeAt(c);
          if (code >= 48 && code <= 57) {
            val = val * 10 + (code - 48);
            hasDigit = true;
          }
        }
        if (hasDigit) {
          acc = isAdd ? acc + val : acc * val;
        }
      }

      total += acc;
    }

    return String(total);
  },
};
