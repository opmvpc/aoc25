/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Find IDs that are pattern repeated 2+ times (e.g., 1212, 123123123, 1111)
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

// Compute multiplier for repeating pattern: 1 + 10^p + 10^2p + ... + 10^((r-1)*p)
// = (10^(r*p) - 1) / (10^p - 1)
function getMultiplier(patternLen: number, repeatCount: number): number {
  let mult = 0;
  let power = 1;
  for (let i = 0; i < repeatCount; i++) {
    mult += power;
    power *= POW10[patternLen];
  }
  return mult;
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

      // Track seen values to avoid duplicates (e.g., 111111 = 11*3 or 111*2)
      const seen = new Set<number>();

      const startLen = countDigits(start);
      const endLen = countDigits(end);

      for (let totalLen = startLen; totalLen <= endLen; totalLen++) {
        // Try all pattern lengths that divide totalLen
        for (let patternLen = 1; patternLen <= totalLen >> 1; patternLen++) {
          if (totalLen % patternLen !== 0) continue;

          const repeatCount = totalLen / patternLen;
          if (repeatCount < 2) continue;

          const multiplier = getMultiplier(patternLen, repeatCount);
          let minPattern = POW10[patternLen - 1];
          let maxPattern = POW10[patternLen] - 1;

          // Clamp to range
          const minFromStart = Math.ceil(start / multiplier);
          const maxFromEnd = Math.floor(end / multiplier);
          if (minFromStart > minPattern) minPattern = minFromStart;
          if (maxFromEnd < maxPattern) maxPattern = maxFromEnd;

          for (let pattern = minPattern; pattern <= maxPattern; pattern++) {
            const repeated = pattern * multiplier;
            if (!seen.has(repeated)) {
              seen.add(repeated);
              sum += repeated;
            }
          }
        }
      }
    }

    return sum.toString();
  },
};
