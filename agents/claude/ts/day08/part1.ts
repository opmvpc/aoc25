/**
 * Advent of Code 2025 - Day 08 Part 1
 * Playground - Connect junction boxes, find 3 largest circuits
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

    // Parse points into flat arrays for better cache locality
    const px = new Int32Array(n);
    const py = new Int32Array(n);
    const pz = new Int32Array(n);

    for (let i = 0; i < n; i++) {
      const line = lines[i];
      let idx = 0;
      let val = 0;

      // Parse X
      while (line.charCodeAt(idx) !== 44) {
        // ','
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      px[i] = val;
      idx++;
      val = 0;

      // Parse Y
      while (line.charCodeAt(idx) !== 44) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      py[i] = val;
      idx++;
      val = 0;

      // Parse Z
      while (idx < line.length) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      pz[i] = val;
    }

    // Generate pairs: store as [dist, i, j] in flat Float64Array
    // Total pairs = n*(n-1)/2
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

    // Sort pairs by distance - create index array and sort it
    const indices = new Uint32Array(numPairs);
    for (let i = 0; i < numPairs; i++) indices[i] = i;

    indices.sort((a, b) => pairData[a * 3] - pairData[b * 3]);

    // Union-Find
    const parent = new Int32Array(n);
    const rank = new Int32Array(n);
    const size = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      parent[i] = i;
      size[i] = 1;
    }

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

    function union(x: number, y: number): void {
      const rx = find(x);
      const ry = find(y);
      if (rx === ry) return;

      if (rank[rx] < rank[ry]) {
        parent[rx] = ry;
        size[ry] += size[rx];
      } else if (rank[rx] > rank[ry]) {
        parent[ry] = rx;
        size[rx] += size[ry];
      } else {
        parent[ry] = rx;
        size[rx] += size[ry];
        rank[rx]++;
      }
    }

    // Connect pairs
    const connectionsToMake = n === 20 ? 10 : 1000;
    for (let k = 0; k < connectionsToMake; k++) {
      const idx = indices[k] * 3;
      union(pairData[idx + 1], pairData[idx + 2]);
    }

    // Find top 3 sizes
    let t1 = 0,
      t2 = 0,
      t3 = 0;
    for (let i = 0; i < n; i++) {
      if (parent[i] === i) {
        const s = size[i];
        if (s > t1) {
          t3 = t2;
          t2 = t1;
          t1 = s;
        } else if (s > t2) {
          t3 = t2;
          t2 = s;
        } else if (s > t3) {
          t3 = s;
        }
      }
    }

    if (t2 === 0) t2 = 1;
    if (t3 === 0) t3 = 1;

    return (t1 * t2 * t3).toString();
  },
};
