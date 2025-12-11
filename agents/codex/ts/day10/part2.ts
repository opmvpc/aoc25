/**
 * 🎄 Advent of Code 2025 - Day 10 Part 2
 * @see https://adventofcode.com/2025/day/10
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let total = 0;

    // Fraction helpers (exact rational arithmetic with int numerator/denominator).
    const gcd = (a: number, b: number): number => {
      while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
      }
      return a < 0 ? -a : a;
    };
    const makeFrac = (n: number, d = 1): [number, number] => {
      if (n === 0) return [0, 1];
      if (d < 0) {
        n = -n;
        d = -d;
      }
      const g = gcd(n, d);
      return [n / g, d / g];
    };
    const add = (a: [number, number], b: [number, number]): [number, number] =>
      makeFrac(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
    const sub = (a: [number, number], b: [number, number]): [number, number] =>
      makeFrac(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
    const mul = (a: [number, number], b: [number, number]): [number, number] =>
      makeFrac(a[0] * b[0], a[1] * b[1]);
    const div = (a: [number, number], b: [number, number]): [number, number] =>
      makeFrac(a[0] * b[1], a[1] * b[0]);
    const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

    // Preallocated buffers (problem constraints small: <=10 counters, <=13 buttons).
    const MAX_M = 10;
    const MAX_N = 13;
    const numMat: number[][] = Array.from({ length: MAX_M }, () => new Array(MAX_N).fill(0));
    const denMat: number[][] = Array.from({ length: MAX_M }, () => new Array(MAX_N).fill(1));
    const rhsNum = new Array<number>(MAX_M).fill(0);
    const rhsDen = new Array<number>(MAX_M).fill(1);
    const pivotCols = new Array<number>(MAX_M).fill(-1);

    // Main per-line solver.
    const solveLine = (line: string): number => {
      if (!line) return 0;

      // Parse targets inside braces.
      const braceStart = line.indexOf("{");
      const braceEnd = line.indexOf("}", braceStart);
      const targets: number[] = [];
      let value = 0;
      let reading = false;
      for (let i = braceStart + 1; i < braceEnd; i++) {
        const c = line.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          value = value * 10 + (c - 48);
          reading = true;
        } else if (reading) {
          targets.push(value);
          value = 0;
          reading = false;
        }
      }
      if (reading) targets.push(value);
      const m = targets.length;

      // Parse buttons between ']' and '{'.
      const buttons: number[] = [];
      let mask = 0;
      let num = 0;
      let inNum = false;
      for (let i = line.indexOf("]") + 1; i < braceStart; i++) {
        const c = line.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          num = num * 10 + (c - 48);
          inNum = true;
        } else {
          if (inNum) {
            mask |= 1 << num;
            num = 0;
            inNum = false;
          }
          if (c === 41) {
            buttons.push(mask);
            mask = 0;
          }
        }
      }

      // Deduplicate identical masks and compute per-button upper bound (min target on touched counters).
      const seen = new Uint8Array(1 << 10);
      const masks: number[] = [];
      const varMax: number[] = [];
      for (let i = 0; i < buttons.length; i++) {
        const bm = buttons[i]!;
        if (bm === 0) continue;
        if (seen[bm]) continue;
        seen[bm] = 1;
        let bound = 1_000_000;
        for (let bit = 0; bit < m; bit++) {
          if (bm & (1 << bit)) {
            const t = targets[bit]!;
            if (t < bound) bound = t;
          }
        }
        if (bound === 0) continue; // would overshoot zero-target counter
        masks.push(bm);
        varMax.push(bound);
      }

      const n = masks.length;
      if (n === 0) return 0;

      // Reorder columns so that free variables (non-pivot) tend to have small bounds.
      const order = [...Array(n).keys()].sort((a, b) => {
        const diff = varMax[b]! - varMax[a]!;
        if (diff !== 0) return diff;
        // Tie-breaker: larger masks earlier.
        let ca = 0;
        let cb = 0;
        for (let x = masks[a]!; x; x &= x - 1) ca++;
        for (let x = masks[b]!; x; x &= x - 1) cb++;
        return cb - ca;
      });

      // Build matrix with reordered columns.
      for (let i = 0; i < m; i++) {
        rhsNum[i] = targets[i]!;
        rhsDen[i] = 1;
        pivotCols[i] = -1;
        const rowNum = numMat[i];
        const rowDen = denMat[i];
        for (let j = 0; j < n; j++) {
          rowNum[j] = (masks[order[j]!]! >> i) & 1;
          rowDen[j] = 1;
        }
      }

      // Gauss-Jordan elimination to RREF.
      const isPivot = new Uint8Array(n);
      let r = 0;
      for (let c = 0; c < n && r < m; c++) {
        let pivotRow = -1;
        for (let i = r; i < m; i++) {
          if (numMat[i][c] !== 0) {
            pivotRow = i;
            break;
          }
        }
        if (pivotRow === -1) continue;
        if (pivotRow !== r) {
          [numMat[pivotRow], numMat[r]] = [numMat[r], numMat[pivotRow]];
          [denMat[pivotRow], denMat[r]] = [denMat[r], denMat[pivotRow]];
          [rhsNum[pivotRow], rhsNum[r]] = [rhsNum[r], rhsNum[pivotRow]];
          [rhsDen[pivotRow], rhsDen[r]] = [rhsDen[r], rhsDen[pivotRow]];
        }

        const [invNum, invDen] = makeFrac(denMat[r][c], numMat[r][c]);
        for (let j = c; j < n; j++) {
          const [nn, nd] = mul([numMat[r][j], denMat[r][j]], [invNum, invDen]);
          numMat[r][j] = nn;
          denMat[r][j] = nd;
        }
        {
          const [nn, nd] = mul([rhsNum[r], rhsDen[r]], [invNum, invDen]);
          rhsNum[r] = nn;
          rhsDen[r] = nd;
        }

        for (let i = 0; i < m; i++) {
          if (i === r) continue;
          if (numMat[i][c] === 0) continue;
          const coeff = [numMat[i][c], denMat[i][c]] as [number, number];
          for (let j = c; j < n; j++) {
            const [nn, nd] = sub(
              [numMat[i][j], denMat[i][j]],
              mul(coeff, [numMat[r][j], denMat[r][j]])
            );
            numMat[i][j] = nn;
            denMat[i][j] = nd;
          }
          const [nn, nd] = sub([rhsNum[i], rhsDen[i]], mul(coeff, [rhsNum[r], rhsDen[r]]));
          rhsNum[i] = nn;
          rhsDen[i] = nd;
        }

        pivotCols[r] = c;
        isPivot[c] = 1;
        r++;
      }
      const rank = r;

      // Check for inconsistencies (zero row with non-zero RHS).
      for (let i = rank; i < m; i++) {
        let allZero = true;
        for (let j = 0; j < n; j++) {
          if (numMat[i][j] !== 0) {
            allZero = false;
            break;
          }
        }
        if (allZero && rhsNum[i] !== 0) {
          throw new Error("No solution for this machine");
        }
      }

      const freeCols: number[] = [];
      for (let c = 0; c < n; c++) {
        if (!isPivot[c]) freeCols.push(c);
      }
      const freeLen = freeCols.length;

      const varMaxSorted = order.map((idx) => varMax[idx]!);
      const freeMaxArr = freeCols.map((c) => varMaxSorted[c]!);
      const freeVals = new Int32Array(freeLen);

      // Precompute pivot expressions: pivot = (base - sum(coeff * free)) / den
      const pivotData: { den: number; base: number; coeff: number[]; max: number }[] = [];
      for (let i = 0; i < rank; i++) {
        const pc = pivotCols[i]!;
        let cd = rhsDen[i];
        for (let k = 0; k < freeLen; k++) {
          const d = denMat[i][freeCols[k]!]!;
          cd = lcm(cd, d);
        }
        const base = rhsNum[i]! * (cd / rhsDen[i]!);
        const coeff: number[] = new Array(freeLen);
        for (let k = 0; k < freeLen; k++) {
          const fc = freeCols[k]!;
          coeff[k] = numMat[i][fc]! * (cd / denMat[i][fc]!);
        }
        pivotData.push({ den: cd, base, coeff, max: varMaxSorted[pc]! });
      }

      const sumTargets = targets.reduce((a, b) => a + b, 0);
      let best = sumTargets;

      if (freeLen === 0) {
        let cost = 0;
        for (let i = 0; i < rank; i++) {
          const pd = pivotData[i]!;
          if (pd.base % pd.den !== 0) throw new Error("Non-integer solution");
          const val = pd.base / pd.den;
          if (val < 0 || val > pd.max) throw new Error("Out of bounds");
          cost += val;
        }
        return cost;
      }

      const dfs = (idx: number, partial: number) => {
        if (partial >= best) return;
        if (idx === freeLen) {
          let cost = partial;
          for (let p = 0; p < pivotData.length; p++) {
            const pd = pivotData[p]!;
            let numVal = pd.base;
            const coeff = pd.coeff;
            for (let k = 0; k < freeLen; k++) {
              numVal -= coeff[k]! * freeVals[k]!;
            }
            if (numVal < 0) return;
            if (numVal % pd.den !== 0) return;
            const val = numVal / pd.den;
            if (val > pd.max) return;
            cost += val;
            if (cost >= best) return;
          }
          best = cost;
          return;
        }
        const maxVal = freeMaxArr[idx]!;
        for (let v = 0; v <= maxVal; v++) {
          freeVals[idx] = v;
          dfs(idx + 1, partial + v);
        }
      };

      dfs(0, 0);
      return best;
    };

    for (let i = 0; i < lines.length; i++) {
      total += solveLine(lines[i]!);
    }

    return String(total);
  },
};
