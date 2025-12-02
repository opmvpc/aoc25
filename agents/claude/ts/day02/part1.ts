/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

function isInvalidID(n: number): boolean {
  const s = n.toString();
  const len = s.length;

  // Must be even length to be repeatable
  if (len % 2 !== 0) return false;

  const half = len / 2;
  const firstHalf = s.slice(0, half);
  const secondHalf = s.slice(half);

  // Check if first half has leading zero (not allowed)
  if (firstHalf[0] === '0') return false;

  return firstHalf === secondHalf;
}

export const solver: ISolver = {
  solve(input: string): string {
    const text = input.trim();

    let sum = 0;
    let i = 0;

    // Manual parsing for performance
    while (i < text.length) {
      // Skip whitespace and commas
      while (i < text.length && (text[i] === ',' || text[i] === ' ' || text[i] === '\n')) {
        i++;
      }

      if (i >= text.length) break;

      // Parse start number
      let start = 0;
      while (i < text.length && text[i] >= '0' && text[i] <= '9') {
        start = start * 10 + (text.charCodeAt(i) - 48);
        i++;
      }

      // Skip dash
      if (i < text.length && text[i] === '-') i++;

      // Parse end number
      let end = 0;
      while (i < text.length && text[i] >= '0' && text[i] <= '9') {
        end = end * 10 + (text.charCodeAt(i) - 48);
        i++;
      }

      // Check all numbers in range
      for (let n = start; n <= end; n++) {
        if (isInvalidID(n)) {
          sum += n;
        }
      }
    }

    return sum.toString();
  },
};
