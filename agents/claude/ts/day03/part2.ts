/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Pick 12 batteries to maximize 12-digit joltage (greedy with sparse table RMQ)
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let total = BigInt(0);
    let lineStart = 0;
    const inputLen = input.length;
    const K = 12;

    while (lineStart < inputLen) {
      // Find line end
      let lineEnd = lineStart;
      while (lineEnd < inputLen && input.charCodeAt(lineEnd) >= 48) lineEnd++;

      const len = lineEnd - lineStart;
      if (len >= K) {
        // Build sparse table for RMQ (Range Maximum Query)
        // sparse[k][i] = index of max in range [i, i + 2^k - 1]
        const LOG = Math.ceil(Math.log2(len + 1));
        const sparse: number[][] = new Array(LOG);

        // Level 0: each position is max of itself
        sparse[0] = new Array(len);
        for (let i = 0; i < len; i++) {
          sparse[0][i] = i;
        }

        // Build higher levels
        for (let k = 1; k < LOG; k++) {
          const prevLen = len - (1 << k) + 1;
          if (prevLen <= 0) break;
          sparse[k] = new Array(prevLen);
          const half = 1 << (k - 1);
          for (let i = 0; i < prevLen; i++) {
            const left = sparse[k - 1][i];
            const right = sparse[k - 1][i + half];
            sparse[k][i] = input.charCodeAt(lineStart + left) >= input.charCodeAt(lineStart + right) ? left : right;
          }
        }

        // Precompute log2 table
        const log2 = new Uint8Array(len + 1);
        for (let i = 2; i <= len; i++) {
          log2[i] = log2[i >> 1] + 1;
        }

        // RMQ function: returns index of max in [l, r]
        const rmq = (l: number, r: number): number => {
          const length = r - l + 1;
          const k = log2[length];
          const left = sparse[k][l];
          const rightStart = r - (1 << k) + 1;
          const right = sparse[k][rightStart];
          return input.charCodeAt(lineStart + left) >= input.charCodeAt(lineStart + right) ? left : right;
        };

        // Greedy selection with O(1) RMQ
        let joltage = 0;
        let lastPos = -1;

        for (let p = 0; p < K; p++) {
          const start = lastPos + 1;
          const end = len - K + p;
          const maxIdx = rmq(start, end);
          joltage = joltage * 10 + (input.charCodeAt(lineStart + maxIdx) - 48);
          lastPos = maxIdx;
        }

        total += BigInt(joltage);
      }

      lineStart = lineEnd + 1;
    }

    return total.toString();
  },
};
