/**
 * 🎄 Advent of Code 2025 - Day 11 Part 1
 * @see https://adventofcode.com/2025/day/11
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const MAX_NODES = 26 * 26 * 26; // 17576
    const outDeg = new Uint16Array(MAX_NODES);
    const fromTmp: number[] = [];
    const toTmp: number[] = [];

    // Manual single-pass parser. Each token is exactly 3 lowercase letters.
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
      // Skip ':' and optional space.
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
      // Skip newline(s).
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

    const encodeConst = (s: string): number =>
      (s.charCodeAt(0) - 97) * 676 +
      (s.charCodeAt(1) - 97) * 26 +
      (s.charCodeAt(2) - 97);
    const YOU = encodeConst("you");
    const OUT = encodeConst("out");

    // Iterative DFS to get postorder of reachable nodes from YOU.
    const state = new Uint8Array(MAX_NODES);
    const stackNodes = new Int32Array(MAX_NODES);
    const stackPos = new Int32Array(MAX_NODES);
    let sp = 0;
    stackNodes[0] = YOU;
    stackPos[0] = start[YOU]!;
    state[YOU] = 1;
    sp = 1;

    const order: number[] = [];
    while (sp > 0) {
      const v = stackNodes[sp - 1]!;
      let pEdge = stackPos[sp - 1]!;
      if (v === OUT) {
        state[v] = 2;
        order.push(v);
        sp--;
        continue;
      }
      const end = start[v + 1]!;
      if (pEdge < end) {
        const to = edges[pEdge]!;
        stackPos[sp - 1] = pEdge + 1;
        const st = state[to]!;
        if (st === 0) {
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

    const counts: bigint[] = new Array(MAX_NODES);
    counts[OUT] = 1n;
    for (let idx = 0; idx < order.length; idx++) {
      const v = order[idx]!;
      if (v === OUT) continue;
      let sum = 0n;
      for (let e = start[v]!; e < start[v + 1]!; e++) {
        sum += counts[edges[e]!]!;
      }
      counts[v] = sum;
    }

    return (counts[YOU] ?? 0n).toString();
  },
};
