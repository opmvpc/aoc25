/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const s = input.trim();
    const len = s.length;

    const ranges: Array<[number, number]> = [];
    let maxR = 0;
    for (let i = 0; i < len; ) {
      while (i < len && s.charCodeAt(i) < 48) i++;
      if (i >= len) break;
      let lo = 0;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          lo = lo * 10 + (c - 48);
          i++;
        } else break;
      }
      if (i < len && s.charCodeAt(i) === 45) i++; // '-'
      let hi = 0;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          hi = hi * 10 + (c - 48);
          i++;
        } else break;
      }
      ranges.push([lo, hi]);
      if (hi > maxR) maxR = hi;
      while (
        i < len &&
        (s.charCodeAt(i) === 44 || s.charCodeAt(i) === 10 || s.charCodeAt(i) === 13)
      )
        i++;
    }

    // Merge ranges to accelerate membership checks
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const [l, r] of ranges) {
      if (!merged.length || l > merged[merged.length - 1]![1] + 1) {
        merged.push([l, r]);
      } else {
        if (r > merged[merged.length - 1]![1]) merged[merged.length - 1]![1] = r;
      }
    }

    // Precompute powers of 10 up to max digits
    let digitsMax = 0;
    for (let x = maxR; x > 0; x = Math.trunc(x / 10)) digitsMax++;
    if (digitsMax === 0) digitsMax = 1;

    const pow10: number[] = [1];
    for (let i = 1; i <= digitsMax; i++) pow10.push(pow10[i - 1]! * 10);

    // Proper divisors for primitive check
    const divs: number[][] = Array.from({ length: digitsMax + 1 }, () => []);
    const mults: number[][] = Array.from({ length: digitsMax + 1 }, () => []);
    for (let m = 1; m <= digitsMax; m++) {
      for (let d = 1; d * 2 <= m; d++) {
        if (m % d === 0) {
          divs[m]!.push(d);
          mults[m]!.push((pow10[m]! - 1) / (pow10[d]! - 1));
        }
      }
    }

    const mergedLen = merged.length;
    let total = 0;

    for (let m = 1; m <= digitsMax; m++) {
      const baseMin = pow10[m - 1]!;
      const baseMax = pow10[m]! - 1;
      if (baseMin > baseMax) continue;
      const divList = divs[m]!;
      const mulList = mults[m]!;

      for (let r = 2; m * r <= digitsMax; r++) {
        const k = (pow10[m * r]! - 1) / (pow10[m]! - 1); // 111... repeated r times
        let xHi = Math.floor(maxR / k);
        if (xHi > baseMax) xHi = baseMax;
        if (xHi < baseMin) continue;

        let idx = 0;
        for (let x = baseMin; x <= xHi; x++) {
          // Primitive check: ensure base isn't itself a repetition
          let primitive = true;
          for (let i = 0; i < divList.length; i++) {
            const d = divList[i]!;
            const rep = Math.trunc(x / pow10[m - d]!);
            if (rep * mulList[i]! === x) {
              primitive = false;
              break;
            }
          }
          if (!primitive) continue;

          const val = x * k;
          while (idx < mergedLen && val > merged[idx]![1]) idx++;
          if (idx >= mergedLen) break;
          if (val >= merged[idx]![0]) total += val;
        }
      }
    }

    return String(total);
  },
};
