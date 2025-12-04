/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Pick 2 batteries to maximize 2-digit joltage
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let total = 0;
    let start = 0;
    const len = input.length;

    while (start < len) {
      // Find line end
      let end = start;
      while (end < len && input.charCodeAt(end) >= 48) end++;

      const lineLen = end - start;
      if (lineLen >= 2) {
        // Single pass: track max digit seen (to the right) and best joltage
        // First digit position must be < end-1 (need room for second digit)
        let maxDigit = input.charCodeAt(end - 1) - 48; // last digit as initial max
        let best = 0;

        // Scan from second-to-last to first (left to right for max tracking)
        for (let i = end - 2; i >= start; i--) {
          const d = input.charCodeAt(i) - 48;
          // If this digit is first, best joltage = d*10 + maxDigit (to its right)
          const joltage = d * 10 + maxDigit;
          if (joltage > best) best = joltage;
          if (d > maxDigit) maxDigit = d;
        }

        total += best;
      }

      // Skip to next line
      start = end + 1;
    }

    return total.toString();
  },
};
