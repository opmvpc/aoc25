/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * @see https://adventofcode.com/2025/day/2
 */

import type { ISolver } from "../../tools/runner/types.js";

function generateInvalids(start: number, end: number): Set<number> {
  const invalids = new Set<number>();
  const startLen = start.toString().length;
  const endLen = end.toString().length;

  // For each possible total length (must be even)
  for (let totalLen = startLen; totalLen <= endLen; totalLen++) {
    if (totalLen % 2 !== 0) continue; // Must be even

    const patternLen = totalLen / 2;
    const minPattern = Math.pow(10, patternLen - 1);
    const maxPattern = Math.pow(10, patternLen) - 1;

    for (let pattern = minPattern; pattern <= maxPattern; pattern++) {
      // Build repeated number (pattern twice)
      const repeated = pattern * (Math.pow(10, patternLen) + 1);

      // Check if in range
      if (repeated >= start && repeated <= end) {
        invalids.add(repeated);
      } else if (repeated > end) {
        break;
      }
    }
  }

  return invalids;
}

export const solver: ISolver = {
  solve(input: string): string {
    const text = input.trim();

    // Parse all ranges
    const ranges: [number, number][] = [];
    let i = 0;

    while (i < text.length) {
      while (i < text.length && (text[i] === ',' || text[i] === ' ' || text[i] === '\n')) {
        i++;
      }

      if (i >= text.length) break;

      let start = 0;
      while (i < text.length && text[i] >= '0' && text[i] <= '9') {
        start = start * 10 + (text.charCodeAt(i) - 48);
        i++;
      }

      if (i < text.length && text[i] === '-') i++;

      let end = 0;
      while (i < text.length && text[i] >= '0' && text[i] <= '9') {
        end = end * 10 + (text.charCodeAt(i) - 48);
        i++;
      }

      ranges.push([start, end]);
    }

    // For each range, generate invalids directly
    let sum = 0;
    for (const [start, end] of ranges) {
      const invalids = generateInvalids(start, end);
      for (const n of invalids.values()) {
        sum += n;
      }
    }

    return sum.toString();
  },
};
