/**
 * Advent of Code 2025 - Day 08 Part 2
 * Connect all junction boxes into one circuit
 * Return product of X coordinates of the last pair that merges circuits
 *
 * Optimizations:
 * - Float64Array for pairs (better cache locality)
 * - Inline distance calculation
 * - Iterative Union-Find
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const n = lines.length;

    // Parse points into flat arrays
    const px = new Int32Array(n);
    const py = new Int32Array(n);
    const pz = new Int32Array(n);

    for (let i = 0; i < n; i++) {
      const line = lines[i];
      let idx = 0;
      let val = 0;

      while (line.charCodeAt(idx) !== 44) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      px[i] = val;
      idx++;
      val = 0;

      while (line.charCodeAt(idx) !== 44) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      py[i] = val;
      idx++;
      val = 0;

      while (idx < line.length) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      pz[i] = val;
    }

    // Generate pairs
    const numPairs = (n * (n - 1)) / 2;
    const pairData = new Float64Array(numPairs * 3);

    let pairIdx = 0;
    for (let i = 0; i < n; i++) {
      const xi = px[i],
        yi = py[i],
        zi = pz[i];
      for (let j = i + 1; j < n; j++) {
        const dx = xi - px[j];
        const dy = yi - py[j];
        const dz = zi - pz[j];
        pairData[pairIdx++] = dx * dx + dy * dy + dz * dz;
        pairData[pairIdx++] = i;
        pairData[pairIdx++] = j;
      }
    }

    // Sort pairs by distance
    const indices = new Uint32Array(numPairs);
    for (let i = 0; i < numPairs; i++) indices[i] = i;
    indices.sort((a, b) => pairData[a * 3] - pairData[b * 3]);

    // Union-Find
    const parent = new Int32Array(n);
    const rank = new Int32Array(n);
    for (let i = 0; i < n; i++) parent[i] = i;

    function find(x: number): number {
      let root = x;
      while (parent[root] !== root) root = parent[root];
      while (parent[x] !== root) {
        const next = parent[x];
        parent[x] = root;
        x = next;
      }
      return root;
    }

    function union(x: number, y: number): boolean {
      const rx = find(x);
      const ry = find(y);
      if (rx === ry) return false;

      if (rank[rx] < rank[ry]) {
        parent[rx] = ry;
      } else if (rank[rx] > rank[ry]) {
        parent[ry] = rx;
      } else {
        parent[ry] = rx;
        rank[rx]++;
      }
      return true;
    }

    // Connect until 1 component
    let components = n;
    let lastI = 0,
      lastJ = 0;

    for (let k = 0; k < numPairs && components > 1; k++) {
      const idx = indices[k] * 3;
      const i = pairData[idx + 1];
      const j = pairData[idx + 2];
      if (union(i, j)) {
        lastI = i;
        lastJ = j;
        components--;
      }
    }

    return (px[lastI] * px[lastJ]).toString();
  },
};
