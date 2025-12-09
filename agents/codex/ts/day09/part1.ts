/**
 * 🎄 Advent of Code 2025 - Day 09 Part 1
 * @see https://adventofcode.com/2025/day/9
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return "0";

    // First pass to count points and preallocate typed arrays.
    let count = 1;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed.charCodeAt(i) === 10) count++;
    }

    const xs = new Int32Array(count);
    const ys = new Int32Array(count);

    // Fast manual parsing: numbers are "x,y" per line.
    let idx = 0;
    let val = 0;
    let sign = 1;
    let currentX = 0;
    const len = trimmed.length;

    for (let i = 0; i <= len; i++) {
      const code = i === len ? 10 : trimmed.charCodeAt(i);

      if (code === 45) {
        sign = -1;
      } else if (code >= 48 && code <= 57) {
        val = val * 10 + (code - 48);
      } else if (code === 44) {
        currentX = sign * val;
        val = 0;
        sign = 1;
      } else {
        ys[idx] = sign * val;
        xs[idx] = currentX;
        idx++;
        val = 0;
        sign = 1;
        currentX = 0;
      }
    }

    const n = idx;
    let best = 0;

    for (let i = 0; i < n; i++) {
      const xi = xs[i];
      const yi = ys[i];
      for (let j = i + 1; j < n; j++) {
        let dx = xs[j] - xi;
        if (dx < 0) dx = -dx;
        let dy = ys[j] - yi;
        if (dy < 0) dy = -dy;
        const area = (dx + 1) * (dy + 1);
        if (area > best) best = area;
      }
    }

    return best.toString();
  },
};
