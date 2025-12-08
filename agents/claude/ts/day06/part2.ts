/**
 * 🎄 Advent of Code 2025 - Day 06 Part 2
 * @see https://adventofcode.com/2025/day/6
 *
 * Numbers are read column by column (right to left within each problem),
 * with most significant digit at top.
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.split("\n");
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    const numRows = lines.length;
    const maxCols = Math.max(...lines.map(l => l.length));
    const grid = lines.map(l => l.padEnd(maxCols, " "));

    // Find problems (contiguous column blocks)
    const problems: { start: number; end: number }[] = [];
    let inProblem = false;
    let problemStart = 0;

    for (let col = 0; col <= maxCols; col++) {
      let hasContent = false;
      if (col < maxCols) {
        for (let row = 0; row < numRows; row++) {
          if (grid[row][col] !== " ") {
            hasContent = true;
            break;
          }
        }
      }

      if (hasContent && !inProblem) {
        inProblem = true;
        problemStart = col;
      } else if (!hasContent && inProblem) {
        inProblem = false;
        problems.push({ start: problemStart, end: col });
      }
    }

    let grandTotal = BigInt(0);

    for (const prob of problems) {
      // Get operator from last row
      let operator = "*";
      for (let c = prob.start; c < prob.end; c++) {
        const ch = grid[numRows - 1][c];
        if (ch === "*" || ch === "+") {
          operator = ch;
          break;
        }
      }

      // Read columns right to left, each column = one number
      let result = operator === "*" ? BigInt(1) : BigInt(0);

      for (let c = prob.end - 1; c >= prob.start; c--) {
        // Build number from column (rows 0 to numRows-2)
        let num = BigInt(0);
        let found = false;
        for (let row = 0; row < numRows - 1; row++) {
          const ch = grid[row][c];
          if (ch >= "0" && ch <= "9") {
            num = num * BigInt(10) + BigInt(ch.charCodeAt(0) - 48);
            found = true;
          }
        }
        if (found) {
          if (operator === "*") {
            result *= num;
          } else {
            result += num;
          }
        }
      }

      grandTotal += result;
    }

    return grandTotal.toString();
  },
};
