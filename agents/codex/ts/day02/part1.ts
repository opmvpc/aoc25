/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const s = input.trim();
    const len = s.length;

    // Parse ranges quickly
    const ranges: Array<[bigint, bigint]> = [];
    let maxR = 0n;
    for (let i = 0; i < len; ) {
      while (i < len && s.charCodeAt(i) < 48) i++;
      if (i >= len) break;
      let lo = 0n;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          lo = lo * 10n + BigInt(c - 48);
          i++;
        } else break;
      }
      if (i < len && s.charCodeAt(i) === 45) i++; // '-'
      let hi = 0n;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          hi = hi * 10n + BigInt(c - 48);
          i++;
        } else break;
      }
      ranges.push([lo, hi]);
      if (hi > maxR) maxR = hi;
      while (i < len && (s.charCodeAt(i) === 44 || s.charCodeAt(i) === 10 || s.charCodeAt(i) === 13)) i++;
    }

    // Precompute powers of 10
    const pow10: bigint[] = [1n];
    for (let i = 1; i <= 20; i++) pow10.push(pow10[i - 1]! * 10n);

    // Maximum half-length to consider (numbers have 2m digits)
    let digits = 0;
    for (let x = maxR; x > 0n; x /= 10n) digits++;
    const mMax = digits >> 1;

    let total = 0n;
    for (const [L, R] of ranges) {
      for (let m = 1; m <= mMax; m++) {
        const k = pow10[m]! + 1n; // multiplier for repetition
        let xLo = (L + k - 1n) / k; // ceil(L / k)
        let xHi = R / k;

        const lower = pow10[m - 1]!;
        const upper = pow10[m]! - 1n;
        if (xLo < lower) xLo = lower;
        if (xHi > upper) xHi = upper;
        if (xLo > xHi) continue;

        const count = xHi - xLo + 1n;
        const sumX = (xLo + xHi) * count / 2n;
        total += k * sumX;
      }
    }

    return total.toString();
  },
};
