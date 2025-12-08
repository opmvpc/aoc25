/**
 * 🎄 Advent of Code 2025 - Day 08 Part 1
 * @see https://adventofcode.com/2025/day/8
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const data = input.trim();
    const len = data.length;
    if (len === 0) return "0";

    // Count lines to size typed arrays up front
    let n = 1;
    for (let i = 0; i < len; i++) {
      if (data.charCodeAt(i) === 10) n++;
    }

    const xs = new Int32Array(n);
    const ys = new Int32Array(n);
    const zs = new Int32Array(n);

    // Fast manual parsing: X,Y,Z per line, positive integers
    let idx = 0;
    let pos = 0;
    while (pos < len) {
      let v = 0;
      while (pos < len) {
        const c = data.charCodeAt(pos);
        if (c === 44) break; // ','
        v = v * 10 + (c - 48);
        pos++;
      }
      xs[idx] = v;
      pos++; // skip comma

      v = 0;
      while (pos < len) {
        const c = data.charCodeAt(pos);
        if (c === 44) break;
        v = v * 10 + (c - 48);
        pos++;
      }
      ys[idx] = v;
      pos++; // skip comma

      v = 0;
      while (pos < len && data.charCodeAt(pos) !== 10) {
        v = v * 10 + (data.charCodeAt(pos) - 48);
        pos++;
      }
      zs[idx] = v;
      pos++; // skip newline
      idx++;
    }
    n = idx;

    // Use the 10 closest pairs for the tiny sample (mirrors the walkthrough), otherwise 1000.
    const connectionGoal = n <= 50 ? 10 : 1000;
    const target = Math.min(connectionGoal, (n * (n - 1)) / 2);

    // Max-heap keeping the 1000 smallest distances
    const hDist = new Float64Array(target);
    const hA = new Int32Array(target);
    const hB = new Int32Array(target);
    let hSize = 0;

    const heapifyUp = (startIdx: number): void => {
      let i = startIdx;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (hDist[p] >= hDist[i]) break;
        const td = hDist[p];
        hDist[p] = hDist[i];
        hDist[i] = td;

        const ta = hA[p];
        hA[p] = hA[i];
        hA[i] = ta;

        const tb = hB[p];
        hB[p] = hB[i];
        hB[i] = tb;
        i = p;
      }
    };

    const heapifyDown = (): void => {
      let i = 0;
      while (true) {
        const l = (i << 1) + 1;
        if (l >= hSize) break;
        let largest = l;
        const r = l + 1;
        if (r < hSize && hDist[r] > hDist[l]) largest = r;
        if (hDist[i] >= hDist[largest]) break;

        const td = hDist[i];
        hDist[i] = hDist[largest];
        hDist[largest] = td;

        const ta = hA[i];
        hA[i] = hA[largest];
        hA[largest] = ta;

        const tb = hB[i];
        hB[i] = hB[largest];
        hB[largest] = tb;
        i = largest;
      }
    };

    if (target > 0) {
      for (let i = 0; i < n - 1; i++) {
        const xi = xs[i];
        const yi = ys[i];
        const zi = zs[i];
        for (let j = i + 1; j < n; j++) {
          const dx = xi - xs[j];
          const dy = yi - ys[j];
          const dz = zi - zs[j];
          const d = dx * dx + dy * dy + dz * dz;

          if (hSize < target) {
            hDist[hSize] = d;
            hA[hSize] = i;
            hB[hSize] = j;
            heapifyUp(hSize);
            hSize++;
          } else if (d < hDist[0]) {
            hDist[0] = d;
            hA[0] = i;
            hB[0] = j;
            heapifyDown();
          }
        }
      }
    }

    const m = hSize;
    const order: number[] = new Array(m);
    for (let i = 0; i < m; i++) order[i] = i;
    if (m > 1) order.sort((a, b) => hDist[a] - hDist[b]);

    const parent = new Int32Array(n);
    const size = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      parent[i] = i;
      size[i] = 1;
    }

    const find = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]];
        v = parent[v];
      }
      return v;
    };

    for (let k = 0; k < m; k++) {
      const idxEdge = order[k];
      const a = hA[idxEdge];
      const b = hB[idxEdge];
      let ra = find(a);
      let rb = find(b);
      if (ra === rb) continue;
      if (size[ra] < size[rb]) {
        const tmp = ra;
        ra = rb;
        rb = tmp;
      }
      parent[rb] = ra;
      size[ra] += size[rb];
    }

    let top1 = 0;
    let top2 = 0;
    let top3 = 0;
    for (let i = 0; i < n; i++) {
      if (parent[i] !== i) continue;
      const s = size[i];
      if (s >= top1) {
        top3 = top2;
        top2 = top1;
        top1 = s;
      } else if (s >= top2) {
        top3 = top2;
        top2 = s;
      } else if (s > top3) {
        top3 = s;
      }
    }

    const result = top1 * top2 * top3;

    return String(result);
  },
};
