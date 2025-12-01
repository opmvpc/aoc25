/**
 * 🎄 Advent of Code 2025 - Day 00 Part 2
 * Number Cruncher - Sum of products of valid pairs
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping with sum tracking
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const [n, k] = lines[0]!.split(" ").map(Number);

    // Group numbers by remainder, track both count and sum
    const groups = new Map<number, { count: number; sum: bigint; nums: number[] }>();

    for (let i = 1; i <= n!; i++) {
      const num = parseInt(lines[i]!, 10);
      const rem = ((num % k!) + k!) % k!;

      if (!groups.has(rem)) {
        groups.set(rem, { count: 0, sum: 0n, nums: [] });
      }
      const g = groups.get(rem)!;
      g.count++;
      g.sum += BigInt(num);
      g.nums.push(num);
    }

    let totalProduct = 0n;

    // For remainder 0: sum of products within the group
    const g0 = groups.get(0);
    if (g0 && g0.count >= 2) {
      let sumSquares = 0n;
      for (const num of g0.nums) {
        sumSquares += BigInt(num) * BigInt(num);
      }
      totalProduct += (g0.sum * g0.sum - sumSquares) / 2n;
    }

    // For pairs (r, k-r): sum of products between groups
    for (let r = 1; r < Math.ceil(k! / 2); r++) {
      const gR = groups.get(r);
      const gKR = groups.get(k! - r);

      if (gR && gKR) {
        totalProduct += gR.sum * gKR.sum;
      }
    }

    // If K is even, pairs within K/2 group
    if (k! % 2 === 0) {
      const gHalf = groups.get(k! / 2);
      if (gHalf && gHalf.count >= 2) {
        let sumSquares = 0n;
        for (const num of gHalf.nums) {
          sumSquares += BigInt(num) * BigInt(num);
        }
        totalProduct += (gHalf.sum * gHalf.sum - sumSquares) / 2n;
      }
    }

    return totalProduct.toString();
  },
};
