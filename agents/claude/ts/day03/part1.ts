/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Pick 2 batteries to maximize 2-digit joltage
 * Optimized: branchless max updates
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let total = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Find line boundaries
      const start = i;
      while (i < len && input.charCodeAt(i) >= 48) i++;
      const end = i;
      i++; // skip newline

      if (end - start < 2) continue;

      // Scan right-to-left tracking max digit to the right
      let maxRight = input.charCodeAt(end - 1);
      let best = 0;

      for (let j = end - 2; j >= start; j--) {
        const d = input.charCodeAt(j);
        // joltage = (d - 48) * 10 + (maxRight - 48) = d*10 + maxRight - 528
        const joltage = d * 10 + maxRight - 528;
        // Branchless max
        best = joltage > best ? joltage : best;
        maxRight = d > maxRight ? d : maxRight;
      }

      total += best;
    }

    return total.toString();
  },
};
