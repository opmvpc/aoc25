/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2
 * @see https://adventofcode.com/2025/day/5
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const normalized = input.replace(/\r\n/g, "\n").trim();
    const parts = normalized.split("\n\n");
    
    const rangesLines = parts[0].split("\n");

    // 1. Parse Ranges
    const ranges: { min: number; max: number }[] = [];
    for (const line of rangesLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const dashIndex = trimmed.indexOf('-');
      const min = parseInt(trimmed.substring(0, dashIndex), 10);
      const max = parseInt(trimmed.substring(dashIndex + 1), 10);
      ranges.push({ min, max });
    }

    // 2. Sort Ranges
    ranges.sort((a, b) => a.min - b.min);

    // 3. Merge Ranges
    const merged: { min: number; max: number }[] = [];
    if (ranges.length > 0) {
      let current = ranges[0];
      for (let i = 1; i < ranges.length; i++) {
        const next = ranges[i];
        // Merge if overlapping or adjacent
        if (next.min <= current.max + 1) {
          if (next.max > current.max) {
            current.max = next.max;
          }
        } else {
          merged.push(current);
          current = next;
        }
      }
      merged.push(current);
    }

    // 4. Calculate total length
    let totalCount = 0;
    for (const range of merged) {
      totalCount += (range.max - range.min + 1);
    }

    return totalCount.toString();
  },
};
