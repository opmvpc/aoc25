/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const ranges = input.replace(/\s+/g, "").split(",").filter(Boolean).map(s => {
      const [minStr, maxStr] = s.split("-");
      return { min: BigInt(minStr), max: BigInt(maxStr) };
    });

    let totalSum = 0n;

    for (const range of ranges) {
      totalSum += solveLimit(range.max) - solveLimit(range.min - 1n);
    }

    return totalSum.toString();
  },
};

function solveLimit(limit: bigint): bigint {
  const sLimit = limit.toString();
  const L = sLimit.length;
  let total = 0n;

  // For lengths less than L, we sum all valid numbers (limit is effectively infinity for that length)
  for (let l = 2; l < L; l++) {
    const maxValForLen = (10n ** BigInt(l)) - 1n;
    total += calcSumForLen(l, maxValForLen);
  }

  // For length L, we sum up to limit
  total += calcSumForLen(L, limit);

  return total;
}

function calcSumForLen(len: number, limit: bigint): bigint {
  // Find unique prime factors of len
  const factors = getPrimeFactors(len);
  if (factors.length === 0) return 0n; // Should not happen for len >= 2

  let sumForLen = 0n;
  const numFactors = factors.length;
  const numSubsets = 1 << numFactors;

  for (let i = 1; i < numSubsets; i++) {
    let lcmVal = 1;
    let setBits = 0;
    for (let j = 0; j < numFactors; j++) {
      if ((i >> j) & 1) {
        lcmVal = lcm(lcmVal, factors[j]);
        setBits++;
      }
    }

    const d = len / lcmVal;
    const term = sumGen(len, d, limit);

    if (setBits % 2 === 1) {
      sumForLen += term;
    } else {
      sumForLen -= term;
    }
  }

  return sumForLen;
}

function sumGen(len: number, p: number, limit: bigint): bigint {
  // Construct multiplier Mp
  // Mp = 1 + 10^p + 10^2p + ... + 10^(len-p)
  const k = len / p;
  let Mp = 0n;
  const bigP = BigInt(p);
  for (let i = 0; i < k; i++) {
    Mp += 10n ** (BigInt(i) * bigP);
  }

  const minX = 10n ** (bigP - 1n);
  const maxX = (10n ** bigP) - 1n;
  
  // Find max X such that X * Mp <= limit
  const limitX = limit / Mp;
  
  let effectiveMaxX = maxX;
  if (limitX < effectiveMaxX) {
    effectiveMaxX = limitX;
  }

  if (effectiveMaxX < minX) return 0n;

  const count = effectiveMaxX - minX + 1n;
  const sumX = (minX + effectiveMaxX) * count / 2n;
  
  return sumX * Mp;
}

function getPrimeFactors(n: number): number[] {
  const factors = new Set<number>();
  let d = 2;
  let temp = n;
  while (d * d <= temp) {
    if (temp % d === 0) {
      factors.add(d);
      while (temp % d === 0) temp /= d;
    }
    d++;
  }
  if (temp > 1) factors.add(temp);
  return Array.from(factors);
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return (a * b) / gcd(a, b);
}
