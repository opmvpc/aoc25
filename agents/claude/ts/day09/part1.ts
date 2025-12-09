/**
 * Advent of Code 2025 - Day 09 Part 1
 * Movie Theater - Find largest rectangle area using two red tiles as corners
 *
 * Approach: O(n²) - test all pairs, find max |dx| * |dy|
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const n = lines.length;

    // Parse coordinates into typed arrays
    const px = new Int32Array(n);
    const py = new Int32Array(n);

    for (let i = 0; i < n; i++) {
      const line = lines[i];
      let idx = 0;
      let val = 0;

      // Parse X
      while (line.charCodeAt(idx) !== 44) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      px[i] = val;
      idx++;
      val = 0;

      // Parse Y
      while (idx < line.length) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      py[i] = val;
    }

    // Find max area = (|dx|+1) * (|dy|+1) for all pairs
    // Tiles are squares, so area includes the tiles themselves
    let maxArea = 0;

    for (let i = 0; i < n; i++) {
      const xi = px[i];
      const yi = py[i];
      for (let j = i + 1; j < n; j++) {
        const dx = xi - px[j];
        const dy = yi - py[j];
        // Use branchless abs
        const adx = dx < 0 ? -dx : dx;
        const ady = dy < 0 ? -dy : dy;
        const area = (adx + 1) * (ady + 1);
        if (area > maxArea) {
          maxArea = area;
        }
      }
    }

    return maxArea.toString();
  },
};
