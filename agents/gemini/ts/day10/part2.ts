import { ISolver } from "../../tools/runner/types.js";

// --- Rational Arithmetic ---

class Rational {
  n: bigint;
  d: bigint;

  constructor(n: bigint | number, d: bigint | number = 1n) {
    if (typeof n === 'number') n = BigInt(Math.floor(n));
    if (typeof d === 'number') d = BigInt(Math.floor(d));
    
    if (d === 0n) throw new Error("Division by zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const common = Rational.gcd(Rational.abs(n), d);
    this.n = n / common;
    this.d = d / common;
  }

  static gcd(a: bigint, b: bigint): bigint {
    return b === 0n ? a : Rational.gcd(b, a % b);
  }

  static abs(a: bigint): bigint {
    return a < 0n ? -a : a;
  }

  add(other: Rational): Rational {
    return new Rational(this.n * other.d + other.n * this.d, this.d * other.d);
  }

  sub(other: Rational): Rational {
    return new Rational(this.n * other.d - other.n * this.d, this.d * other.d);
  }

  mul(other: Rational): Rational {
    return new Rational(this.n * other.n, this.d * other.d);
  }

  div(other: Rational): Rational {
    return new Rational(this.n * other.d, this.d * other.n);
  }

  isZero(): boolean {
    return this.n === 0n;
  }
  
  isInteger(): boolean {
    return this.d === 1n;
  }

  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }
  
  ge(val: number): boolean {
    return this.n * 1n >= BigInt(val) * this.d;
  }
}

// --- Solver ---

interface Machine {
  targets: number[];
  buttons: number[][]; // buttons[col][row] - NOT standard, careful. Let's standarize to buttons[btn_idx][light_idx]
}

function parseInput(input: string): Machine[] {
  const machines: Machine[] = [];
  const lines = input.trim().split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse targets from curly braces
    const targetMatch = line.match(/\{([\d,]+)\}/);
    if (!targetMatch) continue;
    const targets = targetMatch[1].split(',').map(Number);
    const numLights = targets.length;

    // Parse buttons
    const buttons: number[][] = [];
    const parts = line.split('{')[0];
    const buttonRegex = new RegExp("\\(([\\d,]+)\\)", "g");
    let match;
    while ((match = buttonRegex.exec(parts)) !== null) {
      const indices = match[1].split(',').map(Number);
      const btnVec = new Array(numLights).fill(0);
      for (const idx of indices) {
        if (idx < numLights) btnVec[idx] = 1;
      }
      buttons.push(btnVec);
    }
    
    machines.push({ targets, buttons });
  }
  return machines;
}

function solveMachine(machine: Machine): number {
  const { targets, buttons } = machine;
  const numRows = targets.length;
  const numCols = buttons.length;

  // Build Augmented Matrix [M | T]
  // Row-major: matrix[row][col]
  const matrix: Rational[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: Rational[] = [];
    for (let c = 0; c < numCols; c++) {
      row.push(new Rational(buttons[c][r]));
    }
    row.push(new Rational(targets[r]));
    matrix.push(row);
  }

  // Gaussian Elimination
  let pivotRow = 0;
  const pivotCols: number[] = new Array(numRows).fill(-1);
  const colToPivotRow: number[] = new Array(numCols).fill(-1);

  for (let c = 0; c < numCols && pivotRow < numRows; c++) {
    // Select pivot
    let selectedRow = -1;
    for (let r = pivotRow; r < numRows; r++) {
      if (!matrix[r][c].isZero()) {
        selectedRow = r;
        break;
      }
    }

    if (selectedRow === -1) continue;

    // Swap
    [matrix[pivotRow], matrix[selectedRow]] = [matrix[selectedRow], matrix[pivotRow]];

    // Normalize pivot row
    const pivotVal = matrix[pivotRow][c];
    for (let k = c; k <= numCols; k++) {
      matrix[pivotRow][k] = matrix[pivotRow][k].div(pivotVal);
    }

    // Eliminate
    for (let r = 0; r < numRows; r++) {
      if (r !== pivotRow && !matrix[r][c].isZero()) {
        const factor = matrix[r][c];
        for (let k = c; k <= numCols; k++) {
          matrix[r][k] = matrix[r][k].sub(factor.mul(matrix[pivotRow][k]));
        }
      }
    }

    pivotCols[pivotRow] = c;
    colToPivotRow[c] = pivotRow;
    pivotRow++;
  }

  // Check consistency for rows > pivotRow
  for (let r = pivotRow; r < numRows; r++) {
    if (!matrix[r][numCols].isZero()) {
      return Infinity; // Inconsistent
    }
  }

  const freeCols: number[] = [];
  for (let c = 0; c < numCols; c++) {
    if (colToPivotRow[c] === -1) {
      freeCols.push(c);
    }
  }

  let minPresses = Infinity;
  const maxTarget = Math.max(...targets); 
  // Heuristic limit: no button needs to be pressed more than the max target + some buffer
  const limit = maxTarget + 5; 

  const numFree = freeCols.length;
  const freeValues = new Array(numFree).fill(0);

  const solveRecursively = (idx: number) => {
    if (idx === numFree) {
      // All free vars set. Compute pivots.
      let currentPresses = 0;
      for(const val of freeValues) currentPresses += val;
      
      // Pruning
      if (currentPresses >= minPresses) return;

      for (let r = 0; r < pivotRow; r++) {
        let val = matrix[r][numCols]; // Target
        // Subtract free variable contributions
        for (let i = 0; i < numFree; i++) {
          const fCol = freeCols[i];
          const coeff = matrix[r][fCol];
          if (!coeff.isZero()) {
            val = val.sub(coeff.mul(new Rational(freeValues[i])));
          }
        }
        
        // Val is the value of the pivot variable
        if (!val.isInteger() || val.n < 0n) return; // Invalid
        currentPresses += Number(val.n);
      }
      
      if (currentPresses < minPresses) {
        minPresses = currentPresses;
      }
      return;
    }

    // Iterate current free variable
    // For optimization, we could compute bounds, but let's try bruteforce first
    for (let v = 0; v <= limit; v++) {
       freeValues[idx] = v;
       // Early pruning check could go here:
       // If any pivot equation purely depends on processed free vars and is violated.
       solveRecursively(idx + 1);
       // if (minPresses is small enough? no target to aim for)
    }
  };

  solveRecursively(0);

  return minPresses === Infinity ? 0 : minPresses;
}

export const solver: ISolver = {
  solve(input: string): string {
    const machines = parseInput(input);
    let totalPresses = 0;

    for (const machine of machines) {
      const p = solveMachine(machine);
      if (p === Infinity) {
          // Should we handle impossible? Problem implies solution exists or we sum min?
          // "fewest total presses required ... on all of the machines"
          // If a machine is impossible, maybe 0? Or error. Assuming possible.
      } else {
        totalPresses += p;
      }
    }

    return totalPresses.toString();
  },
};