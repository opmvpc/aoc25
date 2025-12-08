/**
 * 🎄 Advent of Code 2025 - Day 06 Part 2
 * @see https://adventofcode.com/2025/day/6
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    // Trim a trailing newline but keep inner spacing intact
    const rawLines = input.endsWith("\n")
      ? input.slice(0, -1).split("\n")
      : input.split("\n");
    const rowCount = rawLines.length;
    const opRow = rawLines[rowCount - 1];
    const dataRows = rowCount - 1;

    // Determine the widest row to size column buffers once
    let maxLen = 0;
    for (let r = 0; r < rowCount; r++) {
      const len = rawLines[r].length;
      if (len > maxLen) maxLen = len;
    }

    const used = new Uint8Array(maxLen);
    const hasDigit = new Uint8Array(maxLen);
    const colVals = new Float64Array(maxLen);
    const ops = new Uint8Array(maxLen);

    // Build per-column values once (top to bottom), also marking used columns
    for (let r = 0; r < dataRows; r++) {
      const line = rawLines[r];
      const len = line.length;
      for (let c = 0; c < len; c++) {
        const code = line.charCodeAt(c);
        if (code !== 32) used[c] = 1;
        if (code >= 48 && code <= 57) {
          colVals[c] = colVals[c] * 10 + (code - 48);
          hasDigit[c] = 1;
        }
      }
    }
    // Include operator row for block detection
    const opLen = opRow.length;
    for (let c = 0; c < opLen; c++) {
      const code = opRow.charCodeAt(c);
      ops[c] = code;
      if (code !== 32) used[c] = 1;
    }

    let total = 0;
    let col = 0;
    while (col < maxLen) {
      // Skip separators (columns fully empty)
      while (col < maxLen && used[col] === 0) col++;
      if (col >= maxLen) break;
      const start = col;
      while (col < maxLen && used[col] === 1) col++;
      const end = col;

      // Operator inside the block on the last row
      let op = 0;
      for (let c = start; c < end && op === 0; c++) {
        const code = ops[c];
        if (code === 43 || code === 42) op = code;
      }
      const isAdd = op === 43;

      let acc = isAdd ? 0 : 1;
      // Process each column right-to-left with prebuilt values
      for (let c = end - 1; c >= start; c--) {
        if (hasDigit[c]) {
          const val = colVals[c];
          acc = isAdd ? acc + val : acc * val;
        }
      }

      total += acc;
    }

    return String(total);
  },
};
