import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.split(/\r?\n/);
    // Remove trailing empty line if present (result of split on string ending with newline)
    if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    if (lines.length === 0) return "0";

    const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const height = lines.length;

    // Helper to check if a column is empty (all spaces)
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
      if (isColumnEmpty(col)) {
        col++;
        continue;
      }

      const startCol = col;
      while (col < width && !isColumnEmpty(col)) {
        col++;
      }
      const endCol = col;

      // Process block [startCol, endCol)
      
      // 1. Find operator in the last row of the block (or anywhere in the bottom-most non-empty row of the block?)
      // We'll search for the last row that contains an operator symbol within the block.
      
      let operator = '';
      let opRow = -1;

      // Find the row containing the operator for this block
      // Scan bottom-up
      for (let y = height - 1; y >= 0; y--) {
          let foundOp = false;
          // Check if this row has an operator in the current block columns
          for (let c = startCol; c < endCol; c++) {
              if (c < lines[y].length) {
                  const char = lines[y][c];
                  if (char === '+' || char === '*') {
                      operator = char;
                      foundOp = true;
                      break;
                  }
              }
          }
          if (foundOp) {
              opRow = y;
              break;
          }
      }

      if (!operator || opRow === -1) {
        // No operator found in this block
        console.warn(`No operator found for block ${startCol}-${endCol}`);
        continue; 
      }

      const numbers: number[] = [];

      // 2. Iterate each column in the block
      for (let c = startCol; c < endCol; c++) {
        let digitStr = "";
        // Read rows from top to bottom, excluding the operator row
        for (let y = 0; y < opRow; y++) {
          if (c < lines[y].length) {
             const char = lines[y][c];
             if (char !== ' ') {
               digitStr += char;
             }
          }
        }

        if (digitStr.length > 0) {
          const num = parseInt(digitStr, 10);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        }
      }

      // 3. Compute result
      let result = 0;
      if (numbers.length > 0) {
        if (operator === '+') {
          result = numbers.reduce((a, b) => a + b, 0);
        } else if (operator === '*') {
          result = numbers.reduce((a, b) => a * b, 1);
        }
      }
      
      grandTotal += result;
    }

    return grandTotal.toString();
  },
};