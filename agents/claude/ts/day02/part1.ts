/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Find IDs that are pattern repeated exactly twice (e.g., 1212, 55, 123123)
 */

import type { ISolver } from "../../tools/runner/types.js";

// Pre-compute powers of 10
const POW10 = new Array(20);
POW10[0] = 1;
for (let i = 1; i < 20; i++) POW10[i] = POW10[i - 1] * 10;

function countDigits(n: number): number {
  if (n < 10) return 1;
  if (n < 100) return 2;
  if (n < 1000) return 3;
  if (n < 10000) return 4;
  if (n < 100000) return 5;
  if (n < 1000000) return 6;
  if (n < 10000000) return 7;
  if (n < 100000000) return 8;
  if (n < 1000000000) return 9;
  if (n < 10000000000) return 10;
  return Math.floor(Math.log10(n)) + 1;
}

export const solver: ISolver = {
  solve(input: string): string {
    let sum = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Skip separators
      while (i < len) {
        const c = input.charCodeAt(i);
        if (c >= 48 && c <= 57) break;
        i++;
      }
      if (i >= len) break;

      // Parse start
      let start = 0;
      while (i < len) {
        const c = input.charCodeAt(i);
        if (c < 48 || c > 57) break;
        start = start * 10 + c - 48;
        i++;
      }

      // Skip dash
      while (i < len && input.charCodeAt(i) === 45) i++;

      // Parse end
      let end = 0;
      while (i < len) {
        const c = input.charCodeAt(i);
        if (c < 48 || c > 57) break;
        end = end * 10 + c - 48;
        i++;
      }

      // Generate invalids for this range (pattern repeated exactly twice)
      const startLen = countDigits(start);
      const endLen = countDigits(end);

      for (let totalLen = startLen; totalLen <= endLen; totalLen++) {
        if (totalLen & 1) continue; // Must be even

        const patternLen = totalLen >> 1;
        const multiplier = POW10[patternLen] + 1;
        let minPattern = POW10[patternLen - 1];
        let maxPattern = POW10[patternLen] - 1;

        // Clamp pattern range to stay within [start, end]
        const minFromStart = Math.ceil(start / multiplier);
        const maxFromEnd = Math.floor(end / multiplier);
        if (minFromStart > minPattern) minPattern = minFromStart;
        if (maxFromEnd < maxPattern) maxPattern = maxFromEnd;

        // Sum arithmetic sequence: sum = n * (first + last) / 2
        // where each term = pattern * multiplier
        if (minPattern <= maxPattern) {
          const n = maxPattern - minPattern + 1;
          const firstVal = minPattern * multiplier;
          const lastVal = maxPattern * multiplier;
          sum += (n * (firstVal + lastVal)) / 2;
        }
      }
    }

    return sum.toString();
  },
};
