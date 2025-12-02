/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    // Clean input: remove newlines/spaces, split by comma
    const ranges = input.replace(/\s+/g, "").split(",").filter(Boolean).map(s => {
      const [minStr, maxStr] = s.split("-");
      return { min: BigInt(minStr), max: BigInt(maxStr) };
    });

    let totalSum = 0n;

    for (const range of ranges) {
      totalSum += calcSum(range.max) - calcSum(range.min - 1n);
    }

    return totalSum.toString();
  },
};

function calcSum(limit: bigint): bigint {
  if (limit < 11n) return 0n;

  let total = 0n;
  let L = 1;
  
  while (true) {
    const powerOf10 = 10n ** BigInt(L);
    const multiplier = powerOf10 + 1n;
    
    const minX = powerOf10 / 10n; // 10^(L-1)
    const maxX = powerOf10 - 1n;  // 10^L - 1
    
    const minVal = minX * multiplier;
    if (minVal > limit) break;

    const limitX = limit / multiplier;
    const effectiveMaxX = limitX < maxX ? limitX : maxX;

    if (effectiveMaxX >= minX) {
      const count = effectiveMaxX - minX + 1n;
      const sumX = (minX + effectiveMaxX) * count / 2n;
      total += sumX * multiplier;
    }

    L++;
  }

  return total;
}