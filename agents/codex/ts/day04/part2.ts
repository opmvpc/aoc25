/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * @see https://adventofcode.com/2025/day/4
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let end = input.length;
    while (end > 0) {
      const ch = input.charCodeAt(end - 1);
      if (ch === 10 || ch === 13) end--;
      else break;
    }
    if (end === 0) return "0";

    let width = 0;
    while (width < end && input.charCodeAt(width) !== 10) width++;

    let height = 1;
    for (let i = width; i < end; i++) if (input.charCodeAt(i) === 10) height++;

    const stride = width + 2; // padded border avoids bounds checks
    const size = (height + 2) * stride;

    const grid = new Uint8Array(size);
    const at = 64; // '@'
    let r = 1;
    let c = 1;
    for (let i = 0; i < end; i++) {
      const ch = input.charCodeAt(i);
      if (ch === 10) {
        r++;
        c = 1;
      } else {
        grid[r * stride + c] = ch === at ? 1 : 0;
        c++;
      }
    }

    const deg = new Uint8Array(size);
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;

    // Precompute neighbor counts and seed queue
    for (let row = 1; row <= height; row++) {
      const base = row * stride;
      for (let col = 1; col <= width; col++) {
        const pos = base + col;
        if (grid[pos] === 0) continue;

        const neighbors =
          grid[pos - stride - 1] +
          grid[pos - stride] +
          grid[pos - stride + 1] +
          grid[pos - 1] +
          grid[pos + 1] +
          grid[pos + stride - 1] +
          grid[pos + stride] +
          grid[pos + stride + 1];

        deg[pos] = neighbors;
        if (neighbors < 4) queue[tail++] = pos;
      }
    }

    let removed = 0;
    const offsets = [-stride - 1, -stride, -stride + 1, -1, 1, stride - 1, stride, stride + 1];

    while (head < tail) {
      const pos = queue[head++];
      if (grid[pos] === 0) continue; // already removed

      grid[pos] = 0;
      removed++;

      for (let i = 0; i < 8; i++) {
        const npos = pos + offsets[i];
        if (grid[npos]) {
          const nd = --deg[npos];
          if (nd == 3) queue[tail++] = npos; // just fell below 4
        }
      }
    }

    return String(removed);
  },
};
