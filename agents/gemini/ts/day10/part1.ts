import { ISolver } from "../../tools/runner/types.js";

interface Machine {
  target: number;
  length: number;
  buttons: number[];
}

function parseInput(input: string): Machine[] {
  const machines: Machine[] = [];
  const lines = input.trim().split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    // Extract target configuration
    // Regex to find content inside square brackets: [.*]
    const targetRegex = new RegExp("\\[([.#]+)\\]");
    const targetMatch = line.match(targetRegex);
    
    if (!targetMatch) continue;
    const targetStr = targetMatch[1];
    const length = targetStr.length;
    let target = 0;
    for (let i = 0; i < length; i++) {
      if (targetStr[i] === '#') {
        target |= (1 << i);
      }
    }

    // Extract buttons
    const buttons: number[] = [];
    const parts = line.split('{')[0];
    
    // Regex to find content inside parentheses: (1,2,3)
    // We use a loop with exec because we need all matches
    const buttonRegex = new RegExp("\\(([\\d,]+)\\)", "g");
    let match;
    while ((match = buttonRegex.exec(parts)) !== null) {
      const indices = match[1].split(',').map(Number);
      let btn = 0;
      for (const idx of indices) {
        btn |= (1 << idx);
      }
      buttons.push(btn);
    }

    machines.push({ target, length, buttons });
  }
  return machines;
}

function solveMachine(machine: Machine): number {
  const { target, length, buttons } = machine;
  const numButtons = buttons.length;
  // We want to solve sum(x_i * button_i) = target (mod 2)
  
  const numRows = length;
  const numCols = numButtons;
  
  // Matrix of size [numRows][numCols + 1]
  const matrix: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: number[] = new Array(numCols + 1).fill(0);
    for (let c = 0; c < numCols; c++) {
      if ((buttons[c] >> r) & 1) {
        row[c] = 1;
      }
    }
    if ((target >> r) & 1) {
      row[numCols] = 1;
    }
    matrix.push(row);
  }

  // Gaussian Elimination to RREF
  let pivotRow = 0;
  const pivotCols: number[] = new Array(numRows).fill(-1);
  const colToPivotRow: number[] = new Array(numCols).fill(-1);

  for (let c = 0; c < numCols && pivotRow < numRows; c++) {
    // Find pivot
    let selectedRow = -1;
    for (let r = pivotRow; r < numRows; r++) {
      if (matrix[r][c] === 1) {
        selectedRow = r;
        break;
      }
    }

    if (selectedRow === -1) {
      continue;
    }

    // Swap
    [matrix[pivotRow], matrix[selectedRow]] = [matrix[selectedRow], matrix[pivotRow]];

    // Eliminate
    for (let r = 0; r < numRows; r++) {
      if (r !== pivotRow && matrix[r][c] === 1) {
        for (let k = c; k <= numCols; k++) {
          matrix[r][k] ^= matrix[pivotRow][k];
        }
      }
    }

    pivotCols[pivotRow] = c;
    colToPivotRow[c] = pivotRow;
    pivotRow++;
  }

  // Check consistency
  for (let r = pivotRow; r < numRows; r++) {
    if (matrix[r][numCols] === 1) {
      return Infinity; // Should not happen based on problem statement
    }
  }

  // Free variables
  const freeCols: number[] = [];
  for (let c = 0; c < numCols; c++) {
    if (colToPivotRow[c] === -1) {
      freeCols.push(c);
    }
  }

  let minPresses = Infinity;
  const numFree = freeCols.length;
  // Limit to reasonable search space just in case, though problem says it's fine.
  // With numButtons ~13, max 13 free variables. 8192 iterations. Fast.
  const numCombinations = 1 << numFree;

  for (let i = 0; i < numCombinations; i++) {
    const solution: number[] = new Array(numCols).fill(0);
    let presses = 0;

    // Set free vars
    for (let j = 0; j < numFree; j++) {
      if ((i >> j) & 1) {
        solution[freeCols[j]] = 1;
        presses++;
      }
    }

    // Solve pivot vars
    for (let r = 0; r < pivotRow; r++) {
      const pCol = pivotCols[r];
      let val = matrix[r][numCols]; 
      
      for (const fCol of freeCols) {
        if (matrix[r][fCol] === 1) {
           val ^= solution[fCol];
        }
      }
      
      solution[pCol] = val;
      if (val === 1) presses++;
    }

    if (presses < minPresses) {
      minPresses = presses;
    }
  }

  return minPresses === Infinity ? 0 : minPresses;
}

export const solver: ISolver = {
  solve(input: string): string {
    const machines = parseInput(input);
    let totalPresses = 0;

    for (const machine of machines) {
      const p = solveMachine(machine);
      totalPresses += p;
    }

    return totalPresses.toString();
  },
};
