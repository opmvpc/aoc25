/**
 * 🎄 Advent of Code 2025 - Day 06 Part 1
 * @see https://adventofcode.com/2025/day/6
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.split("\n");
    // Remove empty trailing lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    const numRows = lines.length;
    const maxCols = Math.max(...lines.map(l => l.length));

    // Pad all lines to same length
    const grid = lines.map(l => l.padEnd(maxCols, " "));

    // Find column ranges for each problem
    // A problem is a contiguous block of columns where at least one row has non-space
    const problems: { start: number; end: number }[] = [];
    let inProblem = false;
    let problemStart = 0;

    for (let col = 0; col <= maxCols; col++) {
      // Check if this column has any non-space character
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

    let grandTotal = 0;

    for (const prob of problems) {
      // Extract the column slice for this problem
      const slices: string[] = [];
      for (let row = 0; row < numRows; row++) {
        slices.push(grid[row].substring(prob.start, prob.end));
      }

      // Last row contains the operator
      const operatorLine = slices[numRows - 1].trim();
      const operator = operatorLine[0]; // '*' or '+'

      // Extract numbers from rows 0 to numRows-2
      const numbers: number[] = [];
      for (let row = 0; row < numRows - 1; row++) {
        const numStr = slices[row].trim();
        if (numStr.length > 0) {
          numbers.push(parseInt(numStr, 10));
        }
      }

      // Compute result
      let result: number;
      if (operator === "*") {
        result = numbers.reduce((acc, n) => acc * n, 1);
      } else {
        result = numbers.reduce((acc, n) => acc + n, 0);
      }

      grandTotal += result;
    }

    return grandTotal.toString();
  },
};
