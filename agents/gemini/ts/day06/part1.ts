import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.split(/\r?\n/);
    if (lines.length === 0) return "0";

    // Pad lines to valid max width to treat as a grid
    const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const height = lines.length;

    // Helper to check if a column is empty
    const isColumnEmpty = (colIndex: number): boolean => {
      for (let y = 0; y < height; y++) {
        if (colIndex < lines[y].length && lines[y][colIndex] !== ' ') {
          return false;
        }
      }
      return true;
    };

    let grandTotal = 0;
    let col = 0;

    while (col < width) {
      // Skip empty columns
      if (isColumnEmpty(col)) {
        col++;
        continue;
      }

      // Found start of a problem block
      const startCol = col;
      while (col < width && !isColumnEmpty(col)) {
        col++;
      }
      const endCol = col; // Exclusive

      // Process block [startCol, endCol)
      // The operator is on the last line (height - 1)
      // Actually, verify if the last line has content in this block.
      // The problem says "at the bottom of the problem is the symbol".
      // Assuming the grid is well formed where the last line has the operator.
      // But let's be robust: find the last row that has non-space content in this block.
      // For the given input format, it seems the last row is always the operator row.
      
      let operator = '';
      let opRowIndex = -1;

      // Find the operator row from bottom up
      for (let y = height - 1; y >= 0; y--) {
        const segment = lines[y].substring(startCol, endCol).trim();
        if (segment.length > 0) {
          operator = segment; // Should be + or *
          opRowIndex = y;
          break;
        }
      }

      if (opRowIndex === -1) {
        // Empty block? Should not happen given isColumnEmpty check
        continue;
      }

      // Collect numbers from rows above opRowIndex
      const numbers: number[] = [];
      for (let y = 0; y < opRowIndex; y++) {
        const segment = lines[y].substring(startCol, endCol).trim();
        if (segment.length > 0) {
          const num = parseInt(segment, 10);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        }
      }

      // Perform operation
      let result = 0;
      if (numbers.length > 0) {
        if (operator === '+') {
          result = numbers.reduce((a, b) => a + b, 0);
        } else if (operator === '*') {
          result = numbers.reduce((a, b) => a * b, 1);
        } else {
            console.warn(`Unknown operator '${operator}' at col ${startCol}`);
        }
      }

      grandTotal += result;
    }

    return grandTotal.toString();
  },
};