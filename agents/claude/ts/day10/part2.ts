/**
 * Advent of Code 2025 - Day 10 Part 2
 * Factory - Minimum button presses to reach joltage targets
 *
 * Now buttons INCREMENT counters (not toggle).
 * This is Integer Linear Programming: A * x = b, minimize sum(x), x >= 0
 *
 * Solution: Use Simplex-like approach. Start from basic solution,
 * then improve by checking if we can reduce total presses.
 */

import type { ISolver } from "../../tools/runner/types.js";

// GCD for rational arithmetic
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Rational number as [num, den]
type Rat = [number, number];

function ratAdd(a: Rat, b: Rat): Rat {
  const num = a[0] * b[1] + b[0] * a[1];
  const den = a[1] * b[1];
  const g = gcd(num, den);
  return [num / g, den / g];
}

function ratSub(a: Rat, b: Rat): Rat {
  const num = a[0] * b[1] - b[0] * a[1];
  const den = a[1] * b[1];
  const g = gcd(Math.abs(num), den);
  return [num / g, den / g];
}

function ratMul(a: Rat, b: Rat): Rat {
  const num = a[0] * b[0];
  const den = a[1] * b[1];
  const g = gcd(Math.abs(num), den);
  return [num / g, den / g];
}

function ratDiv(a: Rat, b: Rat): Rat {
  if (b[0] === 0) throw new Error("Division by zero");
  const num = a[0] * b[1];
  const den = a[1] * b[0];
  const g = gcd(Math.abs(num), Math.abs(den));
  const sign = den < 0 ? -1 : 1;
  return [(sign * num) / g, (sign * den) / g];
}

function ratToNum(r: Rat): number {
  return r[0] / r[1];
}

function numToRat(n: number): Rat {
  return [n, 1];
}

function ratIsZero(r: Rat): boolean {
  return r[0] === 0;
}

function ratIsInt(r: Rat): boolean {
  return r[1] === 1 || r[0] % r[1] === 0;
}

function ratFloor(r: Rat): number {
  return Math.floor(r[0] / r[1]);
}

// Solve using exact rational Gaussian elimination
function solveILP(buttons: number[][], targets: number[]): number {
  const numCounters = targets.length;
  const numButtons = buttons.length;

  // Build augmented matrix with rationals
  const matrix: Rat[][] = [];
  for (let i = 0; i < numCounters; i++) {
    const row: Rat[] = [];
    for (let j = 0; j < numButtons; j++) {
      row.push(buttons[j].includes(i) ? [1, 1] : [0, 1]);
    }
    row.push(numToRat(targets[i]));
    matrix.push(row);
  }

  const cols = numButtons + 1;

  // Gaussian elimination to RREF
  let pivotRow = 0;
  const pivotCols: number[] = [];

  for (let col = 0; col < numButtons && pivotRow < numCounters; col++) {
    // Find non-zero pivot
    let found = -1;
    for (let r = pivotRow; r < numCounters; r++) {
      if (!ratIsZero(matrix[r][col])) {
        found = r;
        break;
      }
    }

    if (found === -1) continue;

    [matrix[pivotRow], matrix[found]] = [matrix[found], matrix[pivotRow]];
    pivotCols.push(col);

    const pivotVal = matrix[pivotRow][col];

    // Normalize pivot row
    for (let c = 0; c < cols; c++) {
      matrix[pivotRow][c] = ratDiv(matrix[pivotRow][c], pivotVal);
    }

    // Eliminate all other rows
    for (let r = 0; r < numCounters; r++) {
      if (r !== pivotRow && !ratIsZero(matrix[r][col])) {
        const factor = matrix[r][col];
        for (let c = 0; c < cols; c++) {
          matrix[r][c] = ratSub(matrix[r][c], ratMul(factor, matrix[pivotRow][c]));
        }
      }
    }

    pivotRow++;
  }

  // Check for inconsistency
  for (let r = pivotRow; r < numCounters; r++) {
    if (!ratIsZero(matrix[r][cols - 1])) {
      return -1;
    }
  }

  // Identify free variables
  const freeVars: number[] = [];
  const pivotSet = new Set(pivotCols);
  for (let j = 0; j < numButtons; j++) {
    if (!pivotSet.has(j)) freeVars.push(j);
  }

  const numFree = freeVars.length;

  // If no free variables, check unique solution
  if (numFree === 0) {
    let sum = 0;
    for (let i = 0; i < pivotCols.length; i++) {
      const r = matrix[i][cols - 1];
      if (!ratIsInt(r)) return -1;
      const val = r[0] / r[1];
      if (val < 0) return -1;
      sum += val;
    }
    return sum;
  }

  // With free variables, enumerate valid integer solutions
  // Compute bounds: for basic var x_i = rhs_i - sum(coef_ij * free_j) >= 0
  // We need to find the feasible region and minimize sum

  // Get coefficients of free vars in each basic var equation
  const basicCoefs: Rat[][] = []; // basicCoefs[i][f] = coef of freeVars[f] in basic var i
  const basicRhs: Rat[] = [];

  for (let i = 0; i < pivotCols.length; i++) {
    const coefs: Rat[] = [];
    for (let f = 0; f < numFree; f++) {
      coefs.push(matrix[i][freeVars[f]]);
    }
    basicCoefs.push(coefs);
    basicRhs.push(matrix[i][cols - 1]);
  }

  // Convert coefficients to floats for faster computation
  const coefs: number[][] = basicCoefs.map((row) => row.map(ratToNum));
  const rhsVals: number[] = basicRhs.map(ratToNum);

  // Upper bound: sum of targets is an upper bound on total presses
  const sumTargets = targets.reduce((a, b) => a + b, 0);
  const upperBound = sumTargets;

  let minSum = Infinity;

  // DFS with dynamic feasibility checking and pruning
  function search(idx: number, freeVals: number[], freeSum: number): void {
    if (freeSum >= minSum) return;

    if (idx === numFree) {
      let sum = freeSum;
      let valid = true;

      for (let i = 0; i < pivotCols.length && valid; i++) {
        let val = rhsVals[i];
        for (let f = 0; f < numFree; f++) {
          val -= coefs[i][f] * freeVals[f];
        }
        const rounded = Math.round(val);
        if (rounded < 0 || Math.abs(val - rounded) > 1e-9) {
          valid = false;
        } else {
          sum += rounded;
        }
      }

      if (valid && sum < minSum) {
        minSum = sum;
      }
      return;
    }

    // Compute bounds for free[idx] based on already-assigned free vars
    // and assuming future free vars take values that maximize feasibility
    let lb = 0;
    let ub = upperBound;

    for (let i = 0; i < pivotCols.length; i++) {
      let remaining = rhsVals[i];
      for (let f = 0; f < idx; f++) {
        remaining -= coefs[i][f] * freeVals[f];
      }

      const c = coefs[i][idx];
      if (Math.abs(c) < 1e-9) continue;

      // Estimate best-case contribution from future free vars
      let futureContrib = 0;
      for (let f = idx + 1; f < numFree; f++) {
        const fc = coefs[i][f];
        // If fc > 0, future var = 0 minimizes consumption
        // If fc < 0, future var = upperBound maximizes production
        if (fc < 0) {
          futureContrib -= fc * upperBound;
        }
      }

      // remaining - c*free[idx] + futureContrib >= 0
      const adjusted = remaining + futureContrib;

      if (c > 0) {
        // adjusted - c*free >= 0 => free <= adjusted / c
        ub = Math.min(ub, Math.floor(adjusted / c + 1e-9));
      } else {
        // c < 0: adjusted + |c|*free >= 0
        // If adjusted < 0: free >= -adjusted / |c|
        if (adjusted < -1e-9) {
          lb = Math.max(lb, Math.ceil(-adjusted / (-c) - 1e-9));
        }
      }
    }

    if (lb > ub || lb > upperBound) return;
    ub = Math.min(ub, upperBound);

    for (let v = lb; v <= ub; v++) {
      freeVals[idx] = v;
      search(idx + 1, freeVals, freeSum + v);
    }
  }

  search(0, new Array(numFree).fill(0), 0);

  return minSum === Infinity ? -1 : minSum;
}

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let total = 0;

    for (const line of lines) {
      // Parse buttons
      const buttons: number[][] = [];
      let idx = 0;
      while ((idx = line.indexOf("(", idx)) !== -1) {
        const end = line.indexOf(")", idx);
        const content = line.slice(idx + 1, end);
        const indices = content.split(",").map((s) => parseInt(s.trim(), 10));
        buttons.push(indices);
        idx = end + 1;
      }

      // Parse targets
      const braceStart = line.indexOf("{");
      const braceEnd = line.indexOf("}");
      const targets = line
        .slice(braceStart + 1, braceEnd)
        .split(",")
        .map((s) => parseInt(s.trim(), 10));

      const result = solveILP(buttons, targets);
      if (result === -1) {
        throw new Error(`No solution for line: ${line}`);
      }
      total += result;
    }

    return total.toString();
  },
};
