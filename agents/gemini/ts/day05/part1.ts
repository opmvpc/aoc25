/**
 * 🎄 Advent of Code 2025 - Day 05 Part 1
 * @see https://adventofcode.com/2025/day/5
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const normalized = input.replace(/\r\n/g, "\n").trim();
    const parts = normalized.split("\n\n");
    
    if (parts.length < 2) return "0";

    const rangesLines = parts[0].split("\n");
    const idsLines = parts[1].split("\n");

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

    // 4. Check IDs
    let count = 0;
    // Optimize: if we sort IDs, we can iterate ranges and IDs in a single pass?
    // But IDs are just a list, maybe not worth sorting if checking against merged ranges is fast.
    // Let's use binary search over merged ranges for O(log M) per ID.
    
    for (const line of idsLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const id = parseInt(trimmed, 10);

      // Binary search for range containing id
      let low = 0;
      let high = merged.length - 1;
      let found = false;

      while (low <= high) {
        const mid = (low + high) >>> 1;
        const range = merged[mid];

        if (id >= range.min && id <= range.max) {
          found = true;
          break;
        } else if (id < range.min) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      if (found) count++;
    }

    return count.toString();
  },
};
