/**
 * 🎄 Advent of Code 2025 - Day 08 Part 2
 * @see https://adventofcode.com/2025/day/8
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const data = input.trim();
    const len = data.length;
    if (len === 0) return "0";

    // Count coordinates to size arrays
    let n = 1;
    for (let i = 0; i < len; i++) {
      if (data.charCodeAt(i) === 10) n++;
    }

    const xs = new Int32Array(n);
    const ys = new Int32Array(n);
    const zs = new Int32Array(n);

    // Manual parsing for speed
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
      pos++;

      v = 0;
      while (pos < len) {
        const c = data.charCodeAt(pos);
        if (c === 44) break;
        v = v * 10 + (c - 48);
        pos++;
      }
      ys[idx] = v;
      pos++;

      v = 0;
    while (pos < len && data.charCodeAt(pos) !== 10) {
      v = v * 10 + (data.charCodeAt(pos) - 48);
      pos++;
    }
    zs[idx] = v;
    pos++; // newline
    idx++;
  }
  n = idx;
  if (n < 2) return "0";

    const m = (n * (n - 1)) >> 1;
    const dist = new Float64Array(m);
    const ea = new Int32Array(m);
    const eb = new Int32Array(m);

    let eIdx = 0;
    for (let i = 0; i < n - 1; i++) {
      const xi = xs[i];
      const yi = ys[i];
      const zi = zs[i];
      for (let j = i + 1; j < n; j++) {
        const dx = xi - xs[j];
        const dy = yi - ys[j];
        const dz = zi - zs[j];
        dist[eIdx] = dx * dx + dy * dy + dz * dz;
        ea[eIdx] = i;
        eb[eIdx] = j;
        eIdx++;
      }
    }

    const swap = (i: number, j: number): void => {
      const td = dist[i];
      dist[i] = dist[j];
      dist[j] = td;
      const ta = ea[i];
      ea[i] = ea[j];
      ea[j] = ta;
      const tb = eb[i];
      eb[i] = eb[j];
      eb[j] = tb;
    };

    const insertionSort = (l: number, r: number): void => {
      for (let i = l + 1; i <= r; i++) {
        let j = i - 1;
        const td = dist[i];
        const ta = ea[i];
        const tb = eb[i];
        while (j >= l && dist[j] > td) {
          const nj = j + 1;
          dist[nj] = dist[j];
          ea[nj] = ea[j];
          eb[nj] = eb[j];
          j--;
        }
        const nj = j + 1;
        dist[nj] = td;
        ea[nj] = ta;
        eb[nj] = tb;
      }
    };

    if (m > 1) {
      const stackL = new Int32Array(64);
      const stackR = new Int32Array(64);
      let sp = 0;
      stackL[sp] = 0;
      stackR[sp] = m - 1;
      sp++;

      while (sp > 0) {
        sp--;
        let l = stackL[sp];
        let r = stackR[sp];
        while (r - l > 16) {
          const mid = (l + r) >> 1;
          const pivot = dist[mid];
          let i = l;
          let j = r;
          while (i <= j) {
            while (dist[i] < pivot) i++;
            while (dist[j] > pivot) j--;
            if (i <= j) {
              swap(i, j);
              i++;
              j--;
            }
          }
          // Tail recursion elimination: process larger partition later
          if (j - l < r - i) {
            if (i < r) {
              stackL[sp] = i;
              stackR[sp] = r;
              sp++;
            }
            r = j;
          } else {
            if (l < j) {
              stackL[sp] = l;
              stackR[sp] = j;
              sp++;
            }
            l = i;
          }
        }
        if (l < r) insertionSort(l, r);
      }
    }

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

    let components = n;
    let lastA = 0;
    let lastB = 0;

    for (let k = 0; k < m && components > 1; k++) {
      let ra = find(ea[k]);
      let rb = find(eb[k]);
      if (ra === rb) continue;
      if (size[ra] < size[rb]) {
        const tmp = ra;
        ra = rb;
        rb = tmp;
      }
      parent[rb] = ra;
      size[ra] += size[rb];
      components--;
      lastA = ea[k];
      lastB = eb[k];
    }

    const result = xs[lastA] * xs[lastB];
    return String(result);
  },
};
