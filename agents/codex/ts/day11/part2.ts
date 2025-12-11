/**
 * 🎄 Advent of Code 2025 - Day 11 Part 2
 * @see https://adventofcode.com/2025/day/11
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const MAX_NODES = 26 * 26 * 26;
    const outDeg = new Uint16Array(MAX_NODES);
    const fromTmp: number[] = [];
    const toTmp: number[] = [];

    const n = input.length;
    let i = 0;
    while (i < n) {
      const c0 = input.charCodeAt(i);
      if (c0 === 10 || c0 === 13) {
        i++;
        continue;
      }
      const from =
        (c0 - 97) * 676 +
        (input.charCodeAt(i + 1) - 97) * 26 +
        (input.charCodeAt(i + 2) - 97);
      i += 3;
      if (i < n && input.charCodeAt(i) === 58) i++;
      if (i < n && input.charCodeAt(i) === 32) i++;

      while (i < n) {
        const ch = input.charCodeAt(i);
        if (ch === 10 || ch === 13) break;
        const to =
          (ch - 97) * 676 +
          (input.charCodeAt(i + 1) - 97) * 26 +
          (input.charCodeAt(i + 2) - 97);
        i += 3;
        fromTmp.push(from);
        toTmp.push(to);
        outDeg[from]++;
        if (i < n && input.charCodeAt(i) === 32) i++;
      }
      while (i < n) {
        const nl = input.charCodeAt(i);
        if (nl !== 10 && nl !== 13) break;
        i++;
      }
    }

    const start = new Int32Array(MAX_NODES + 1);
    for (let v = 0; v < MAX_NODES; v++) start[v + 1] = start[v] + outDeg[v]!;
    const totalEdges = start[MAX_NODES];
    const edges = new Int32Array(totalEdges);
    const pos = new Int32Array(MAX_NODES);
    pos.set(start.subarray(0, MAX_NODES));
    for (let k = 0; k < toTmp.length; k++) {
      const f = fromTmp[k]!;
      edges[pos[f]++] = toTmp[k]!;
    }

    const enc = (s: string): number =>
      (s.charCodeAt(0) - 97) * 676 +
      (s.charCodeAt(1) - 97) * 26 +
      (s.charCodeAt(2) - 97);
    const SVR = enc("svr");
    const OUT = enc("out");
    const DAC = enc("dac");
    const FFT = enc("fft");

    const special = new Uint8Array(MAX_NODES);
    special[DAC] = 1;
    special[FFT] |= 2;

    // Postorder of nodes reachable from SVR.
    const state = new Uint8Array(MAX_NODES);
    const stackNodes = new Int32Array(MAX_NODES);
    const stackPos = new Int32Array(MAX_NODES);
    let sp = 0;
    stackNodes[0] = SVR;
    stackPos[0] = start[SVR]!;
    state[SVR] = 1;
    sp = 1;

    const order: number[] = [];
    while (sp > 0) {
      const v = stackNodes[sp - 1]!;
      const pEdge = stackPos[sp - 1]!;
      const end = start[v + 1]!;
      if (pEdge < end) {
        const to = edges[pEdge]!;
        stackPos[sp - 1] = pEdge + 1;
        if (state[to] === 0) {
          state[to] = 1;
          stackNodes[sp] = to;
          stackPos[sp] = start[to]!;
          sp++;
        }
      } else {
        state[v] = 2;
        order.push(v);
        sp--;
      }
    }

    const dp0 = new Array<bigint>(MAX_NODES);
    const dp1 = new Array<bigint>(MAX_NODES);
    const dp2 = new Array<bigint>(MAX_NODES);
    const dp3 = new Array<bigint>(MAX_NODES);
    dp0.fill(0n);
    dp1.fill(0n);
    dp2.fill(0n);
    dp3.fill(0n);

    const initMask = special[SVR]!;
    if (initMask === 0) dp0[SVR] = 1n;
    else if (initMask === 1) dp1[SVR] = 1n;
    else if (initMask === 2) dp2[SVR] = 1n;
    else dp3[SVR] = 1n;

    // Forward DP in topological order (reverse postorder).
    for (let idx = order.length - 1; idx >= 0; idx--) {
      const v = order[idx]!;
      const v0 = dp0[v]!;
      const v1 = dp1[v]!;
      const v2 = dp2[v]!;
      const v3 = dp3[v]!;
      if (!v0 && !v1 && !v2 && !v3) continue;

      for (let e = start[v]!; e < start[v + 1]!; e++) {
        const to = edges[e]!;
        const sm = special[to]!;
        if (sm === 0) {
          if (v0) dp0[to] = dp0[to]! + v0;
          if (v1) dp1[to] = dp1[to]! + v1;
          if (v2) dp2[to] = dp2[to]! + v2;
          if (v3) dp3[to] = dp3[to]! + v3;
        } else if (sm === 1) {
          if (v0) dp1[to] = dp1[to]! + v0;
          if (v1) dp1[to] = dp1[to]! + v1;
          if (v2) dp3[to] = dp3[to]! + v2;
          if (v3) dp3[to] = dp3[to]! + v3;
        } else if (sm === 2) {
          if (v0) dp2[to] = dp2[to]! + v0;
          if (v2) dp2[to] = dp2[to]! + v2;
          if (v1) dp3[to] = dp3[to]! + v1;
          if (v3) dp3[to] = dp3[to]! + v3;
        } else {
          if (v0) dp3[to] = dp3[to]! + v0;
          if (v1) dp3[to] = dp3[to]! + v1;
          if (v2) dp3[to] = dp3[to]! + v2;
          if (v3) dp3[to] = dp3[to]! + v3;
        }
      }
    }

    return dp3[OUT]!.toString();
  },
};
