/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

function isInvalidID(n: number): boolean {
  const s = n.toString();
  const len = s.length;

  // Try all possible pattern lengths (from 1 to len/2)
  for (let patternLen = 1; patternLen <= len / 2; patternLen++) {
    // Length must be divisible by pattern length
    if (len % patternLen !== 0) continue;

    const repeatCount = len / patternLen;
    // Must have at least 2 repetitions
    if (repeatCount < 2) continue;

    const pattern = s.slice(0, patternLen);

    // Check if pattern has leading zero (not allowed)
    if (pattern[0] === '0') continue;

    // Check if entire string is pattern repeated
    let isRepeated = true;
    for (let i = patternLen; i < len; i += patternLen) {
      if (s.slice(i, i + patternLen) !== pattern) {
        isRepeated = false;
        break;
      }
    }

    if (isRepeated) return true;
  }

  return false;
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
