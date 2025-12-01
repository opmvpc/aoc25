/**
 * 🎄 Advent of Code 2025 - Day 00 Part 1
 * Number Cruncher - Count pairs with sum divisible by K
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping
 *
 * Key insight: (a + b) % K == 0 means (a%K + b%K) % K == 0
 * So we group numbers by their remainder and count valid pairs.
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const [n, k] = lines[0]!.split(" ").map(Number);

    // Count numbers by their remainder when divided by K
    const remainderCount = new Map<number, number>();

    for (let i = 1; i <= n!; i++) {
      const num = parseInt(lines[i]!, 10);
      const rem = ((num % k!) + k!) % k!; // Handle negative numbers
      remainderCount.set(rem, (remainderCount.get(rem) || 0) + 1);
    }

    let pairs = 0n; // Use BigInt for large counts

    // Pairs where both numbers have remainder 0
    const count0 = BigInt(remainderCount.get(0) || 0);
    pairs += (count0 * (count0 - 1n)) / 2n;

    // Pairs where remainders sum to K
    for (let r = 1; r < Math.ceil(k! / 2); r++) {
      const countR = BigInt(remainderCount.get(r) || 0);
      const countKR = BigInt(remainderCount.get(k! - r) || 0);
      pairs += countR * countKR;
    }

    // If K is even, pairs where both have remainder K/2
    if (k! % 2 === 0) {
      const countHalf = BigInt(remainderCount.get(k! / 2) || 0);
      pairs += (countHalf * (countHalf - 1n)) / 2n;
    }

    return pairs.toString();
  },
};
