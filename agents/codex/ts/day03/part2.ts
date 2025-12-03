/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * @see https://adventofcode.com/2025/day/3
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const s = input;
    const n = s.length;
    const K = 12;
    const stack = new Int8Array(K + 1); // allow temporary overflow to spend a drop
    let idx = 0;
    let total = 0n;

    while (idx < n) {
      while (idx < n) {
        const c = s.charCodeAt(idx);
        if (c !== 10 && c !== 13) break;
        idx++;
      }
      if (idx >= n) break;

      const lineStart = idx;
      while (idx < n) {
        const c = s.charCodeAt(idx);
        if (c === 10 || c === 13) break;
        idx++;
      }
      const lineEnd = idx;
      const len = lineEnd - lineStart;
      let drops = len - K;
      if (drops < 0) drops = 0; // Defensive; spec implies len >= K.

      let top = 0;
      for (let i = lineStart; i < lineEnd; ++i) {
        const d = s.charCodeAt(i) - 48;
        while (top > 0 && drops > 0 && stack[top - 1] < d) {
          top--;
          drops--;
        }
        stack[top++] = d;
        if (top > K) {
          top--;
          drops--;
        }
      }

      let val = 0n;
      for (let i = 0; i < top; ++i) {
        val = val * 10n + BigInt(stack[i]);
      }
      total += val;
    }

    return total.toString();
  },
};
