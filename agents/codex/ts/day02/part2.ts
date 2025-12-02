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

    // Precompute powers of 10 up to max digits
    let digitsMax = 0;
    for (let x = maxR; x > 0; x = Math.trunc(x / 10)) digitsMax++;
    if (digitsMax === 0) digitsMax = 1;

    const pow10: number[] = [1];
    for (let i = 1; i <= digitsMax; i++) pow10.push(pow10[i - 1]! * 10);

    // Generate all invalid numbers up to maxR (dedup)
    const nums: number[] = [];
    for (let m = 1; m * 2 <= digitsMax; m++) {
      const baseMin = pow10[m - 1]!;
      const baseMax = pow10[m]! - 1;
      const denom = pow10[m]! - 1;
      for (let r = 2; m * r <= digitsMax; r++) {
        const k = (pow10[m * r]! - 1) / denom; // 111... pattern (r times)
        let xHi = Math.floor(maxR / k);
        if (xHi > baseMax) xHi = baseMax;
        if (xHi < baseMin) continue;
        for (let x = baseMin; x <= xHi; x++) {
          nums.push(x * k);
        }
      }
    }

    nums.sort((a, b) => a - b);
    const uniq: number[] = [];
    for (const v of nums) {
      if (uniq.length === 0 || uniq[uniq.length - 1] !== v) uniq.push(v);
    }

    const pref: number[] = new Array(uniq.length + 1);
    pref[0] = 0;
    for (let i = 0; i < uniq.length; i++) {
      pref[i + 1] = pref[i]! + uniq[i]!;
    }

    const lowerBound = (arr: number[], target: number) => {
      let l = 0,
        r = arr.length;
      while (l < r) {
        const m = (l + r) >> 1;
        if (arr[m]! < target) l = m + 1;
        else r = m;
      }
      return l;
    };

    let total = 0;
    for (const [L, R] of ranges) {
      const i1 = lowerBound(uniq, L);
      const i2 = lowerBound(uniq, R + 1);
      if (i1 < i2) total += pref[i2]! - pref[i1]!;
    }

    return String(total);
  },
};
