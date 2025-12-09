/**
 * 🎄 Advent of Code 2025 - Day 09 Part 2
 * @see https://adventofcode.com/2025/day/9
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const trimmed = input.trim();
    if (trimmed.length === 0) return "0";

    // -------- Parsing --------
    // Manual fast parsing into point arrays.
    let count = 1;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed.charCodeAt(i) === 10) count++;
    }

    const xs = new Int32Array(count);
    const ys = new Int32Array(count);

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

    // -------- Coordinate compression (half-integer boundaries) --------
    let minX = xs[0];
    let maxX = xs[0];
    let minY = ys[0];
    let maxY = ys[0];
    for (let i = 1; i < n; i++) {
      const x = xs[i];
      const y = ys[i];
      if (x < minX) minX = x;
      else if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      else if (y > maxY) maxY = y;
    }

    const xSet: number[] = [minX - 1.5, maxX + 1.5];
    const ySet: number[] = [minY - 1.5, maxY + 1.5];
    for (let i = 0; i < n; i++) {
      const x = xs[i];
      const y = ys[i];
      xSet.push(x - 0.5, x + 0.5);
      ySet.push(y - 0.5, y + 0.5);
    }

    xSet.sort((a, b) => a - b);
    ySet.sort((a, b) => a - b);
    // Deduplicate
    const xsBound: number[] = [];
    for (let i = 0; i < xSet.length; i++) {
      if (i === 0 || xSet[i] !== xSet[i - 1]) xsBound.push(xSet[i]);
    }
    const ysBound: number[] = [];
    for (let i = 0; i < ySet.length; i++) {
      if (i === 0 || ySet[i] !== ySet[i - 1]) ysBound.push(ySet[i]);
    }

    const X = xsBound.length;
    const Y = ysBound.length;
    const W = X - 1;
    const H = Y - 1;

    const xIndex = new Map<number, number>();
    for (let i = 0; i < X; i++) xIndex.set(xsBound[i], i);
    const yIndex = new Map<number, number>();
    for (let i = 0; i < Y; i++) yIndex.set(ysBound[i], i);

    const xWidth = new Float64Array(W);
    for (let i = 0; i < W; i++) xWidth[i] = xsBound[i + 1] - xsBound[i];
    const yHeight = new Float64Array(H);
    for (let i = 0; i < H; i++) yHeight[i] = ysBound[i + 1] - ysBound[i];

    // -------- Edges lists --------
    const vertX: number[] = [];
    const vertY1: number[] = [];
    const vertY2: number[] = [];
    const vertRowStart: number[] = [];
    const vertRowEnd: number[] = [];
    const horizY: number[] = [];
    const horizX1: number[] = [];
    const horizX2: number[] = [];
    const horizRow: number[] = [];
    const horizXi1: number[] = [];
    const horizXi2: number[] = [];

    const xLeftIdx = new Int32Array(n);
    const xRightIdx = new Int32Array(n);
    const yDownIdx = new Int32Array(n);
    const yUpIdx = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const x = xs[i];
      const y = ys[i];
      xLeftIdx[i] = xIndex.get(x - 0.5)!;
      xRightIdx[i] = xIndex.get(x + 0.5)!;
      yDownIdx[i] = yIndex.get(y - 0.5)!;
      yUpIdx[i] = yIndex.get(y + 0.5)!;
    }

    for (let i = 0; i < n; i++) {
      const next = i === n - 1 ? 0 : i + 1;
      const x1 = xs[i];
      const y1 = ys[i];
      const x2 = xs[next];
      const y2 = ys[next];
      if (x1 === x2) {
        const aLess = y1 < y2;
        const a = aLess ? y1 : y2;
        const b = aLess ? y2 : y1;
        vertX.push(x1);
        vertY1.push(a);
        vertY2.push(b);
        vertRowStart.push(aLess ? yDownIdx[i] : yDownIdx[next]);
        vertRowEnd.push(aLess ? yDownIdx[next] : yDownIdx[i]);
      } else {
        const aLess = x1 < x2;
        const a = aLess ? x1 : x2;
        const b = aLess ? x2 : x1;
        horizY.push(y1);
        horizX1.push(a);
        horizX2.push(b);
        horizRow.push(yDownIdx[i]);
        horizXi1.push(aLess ? xLeftIdx[i] : xLeftIdx[next]);
        horizXi2.push(aLess ? xRightIdx[next] : xRightIdx[i]);
      }
    }

    // -------- Fill interior (parity scan) --------
    const inside = new Uint8Array(W * H);

    // Precompute vertical edge start/end events to avoid per-row scans.
    const startCnt = new Int32Array(H + 1);
    const endCnt = new Int32Array(H + 1);
    for (let e = 0; e < vertX.length; e++) {
      const sr = vertRowStart[e];
      const er = vertRowEnd[e];
      startCnt[sr]++;
      endCnt[er]++;
    }
    const startOff = new Int32Array(H + 2);
    const endOff = new Int32Array(H + 2);
    for (let i = 0; i < H; i++) {
      startOff[i + 1] = startOff[i] + startCnt[i];
      endOff[i + 1] = endOff[i] + endCnt[i];
    }
    const startData = new Int32Array(startOff[H]);
    const endData = new Int32Array(endOff[H]);
    const tmpStart = startOff.slice();
    const tmpEnd = endOff.slice();
    for (let e = 0; e < vertX.length; e++) {
      const sr = vertRowStart[e];
      const er = vertRowEnd[e];
      startData[tmpStart[sr]++] = vertX[e];
      endData[tmpEnd[er]++] = vertX[e];
    }

    const active = new Int32Array(vertX.length);
    let activeLen = 0;

    const insertSorted = (val: number) => {
      // small active list, simple insertion.
      let lo = 0;
      let hi = activeLen;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (active[mid] < val) lo = mid + 1;
        else hi = mid;
      }
      for (let k = activeLen; k > lo; k--) active[k] = active[k - 1];
      active[lo] = val;
      activeLen++;
    };
    const removeVal = (val: number) => {
      for (let i = 0; i < activeLen; i++) {
        if (active[i] === val) {
          for (let k = i + 1; k < activeLen; k++) active[k - 1] = active[k];
          activeLen--;
          return;
        }
      }
    };

    for (let j = 0; j < H; j++) {
      for (let k = startOff[j]; k < startOff[j + 1]; k++) insertSorted(startData[k]);
      for (let k = endOff[j]; k < endOff[j + 1]; k++) removeVal(endData[k]);

      let p = 0;
      let parity = 0;
      for (let i = 0; i < W; i++) {
        const left = xsBound[i];
        while (p < activeLen && active[p] <= left) {
          parity ^= 1;
          p++;
        }
        if (parity) inside[j * W + i] = 1;
      }
    }

    // Include boundary tiles (edges themselves).
    for (let e = 0; e < horizY.length; e++) {
      const yRow = horizRow[e];
      const xi1 = horizXi1[e];
      const xi2 = horizXi2[e];
      const base = yRow * W;
      for (let i = xi1; i < xi2; i++) inside[base + i] = 1;
    }
    for (let e = 0; e < vertX.length; e++) {
      const xCol = xIndex.get(vertX[e] - 0.5)!;
      const yi1 = vertRowStart[e];
      const yi2 = yIndex.get(vertY2[e] + 0.5)!;
      for (let j = yi1; j < yi2; j++) inside[j * W + xCol] = 1;
    }

    // -------- Prefix sums of green area --------
    const stride = W + 1;
    const prefix = new Float64Array((H + 1) * stride);
    for (let j = 0; j < H; j++) {
      const base = (j + 1) * stride;
      const prev = j * stride;
      const rowHeight = yHeight[j];
      for (let i = 0; i < W; i++) {
        const area = inside[j * W + i] ? xWidth[i] * rowHeight : 0;
        prefix[base + i + 1] =
          area + prefix[base + i] + prefix[prev + i + 1] - prefix[prev + i];
      }
    }

    // -------- Evaluate rectangles --------
    let best = 0;
    for (let a = 0; a < n; a++) {
      const ax = xs[a];
      const ay = ys[a];
      for (let b = a + 1; b < n; b++) {
        const bx = xs[b];
        const by = ys[b];
        if (ax === bx || ay === by) continue; // degenerate
        const x1 = ax < bx ? ax : bx;
        const x2 = ax < bx ? bx : ax;
        const y1 = ay < by ? ay : by;
        const y2 = ay < by ? by : ay;

        const xi1 = ax < bx ? xLeftIdx[a] : xLeftIdx[b];
        const xi2 = ax < bx ? xRightIdx[b] : xRightIdx[a];
        const yi1 = ay < by ? yDownIdx[a] : yDownIdx[b];
        const yi2 = ay < by ? yUpIdx[b] : yUpIdx[a];

        const totalArea = (x2 - x1 + 1) * (y2 - y1 + 1);
        if (totalArea <= best) continue;

        const insideArea =
          prefix[yi2 * stride + xi2] -
          prefix[yi1 * stride + xi2] -
          prefix[yi2 * stride + xi1] +
          prefix[yi1 * stride + xi1];
        if (insideArea === totalArea) best = totalArea;
      }
    }

    return best.toString();
  },
};
