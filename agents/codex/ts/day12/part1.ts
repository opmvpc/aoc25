/**
 * 🎄 Advent of Code 2025 - Day 12 Part 1
 * @see https://adventofcode.com/2025/day/12
 */

import type { ISolver } from "../../tools/runner/types.js";

const POPCNT_9 = (() => {
  const pc = new Uint8Array(512);
  for (let m = 1; m < 512; m++) pc[m] = (pc[m >> 1] as number) + (m & 1);
  return pc;
})();

const DIV3 = (() => {
  const d = new Uint8Array(256);
  for (let i = 0; i < 256; i++) d[i] = (i / 3) | 0;
  return d;
})();

const TRANSFORM_MAP_3X3 = (() => {
  const map = new Uint8Array(8 * 9);
  for (let t = 0; t < 8; t++) {
    const mirror = t >> 2; // 0/1
    const rot = t & 3;
    for (let p = 0; p < 9; p++) {
      let x = p % 3;
      let y = (p / 3) | 0;
      if (mirror) x = 2 - x;
      let nx = x;
      let ny = y;
      if (rot === 1) {
        nx = 2 - y;
        ny = x;
      } else if (rot === 2) {
        nx = 2 - x;
        ny = 2 - y;
      } else if (rot === 3) {
        nx = y;
        ny = 2 - x;
      }
      map[t * 9 + p] = ny * 3 + nx;
    }
  }
  return map;
})();

function transformMask3x3(mask: number, t: number): number {
  let out = 0;
  const base = t * 9;
  for (let p = 0; p < 9; p++) {
    if (mask & (1 << p)) out |= 1 << TRANSFORM_MAP_3X3[base + p]!;
  }
  return out;
}

function canPackTight(
  W: number,
  H: number,
  shapeAreas: Int32Array,
  shapeOrients: number[][],
  countsIn: Int32Array,
): boolean {
  let totalPieces = 0;
  let remainingArea = 0;
  for (let t = 0; t < countsIn.length; t++) {
    const c = countsIn[t]!;
    totalPieces += c;
    remainingArea += c * shapeAreas[t]!;
  }
  if (totalPieces === 0) return true;
  if (W < 3 || H < 3) return false;

  const cap = W * H;
  if (remainingArea > cap) return false;

  // Precompute shifts for 3-bit row masks at each x.
  const maxX = W - 3;
  const shiftLo = new Uint32Array(8 * (maxX + 1));
  const shiftHi = new Uint32Array(8 * (maxX + 1));
  for (let bits = 0; bits < 8; bits++) {
    const base = bits * (maxX + 1);
    for (let x = 0; x <= maxX; x++) {
      let lo = 0;
      let hi = 0;
      if (x < 32) {
        lo = (bits << x) >>> 0;
        hi = x ? (bits >>> (32 - x)) >>> 0 : 0;
      } else {
        lo = 0;
        hi = (bits << (x - 32)) >>> 0;
      }
      shiftLo[base + x] = lo;
      shiftHi[base + x] = hi;
    }
  }

  // placements[t] is packed as [y, lo0, hi0, lo1, hi1, lo2, hi2] * N
  const placements: Uint32Array[] = new Array(countsIn.length);
  for (let t = 0; t < countsIn.length; t++) {
    if (countsIn[t] === 0) {
      placements[t] = new Uint32Array(0);
      continue;
    }
    const orients = shapeOrients[t]!;
    const perOrient = (W - 2) * (H - 2);
    const buf = new Uint32Array(orients.length * perOrient * 7);
    let o = 0;
    for (let oi = 0; oi < orients.length; oi++) {
      const m = orients[oi]!;
      const r0 = m & 7;
      const r1 = (m >>> 3) & 7;
      const r2 = (m >>> 6) & 7;
      const b0 = r0 * (maxX + 1);
      const b1 = r1 * (maxX + 1);
      const b2 = r2 * (maxX + 1);
      for (let y = 0; y <= H - 3; y++) {
        for (let x = 0; x <= maxX; x++) {
          buf[o++] = y;
          buf[o++] = shiftLo[b0 + x]!;
          buf[o++] = shiftHi[b0 + x]!;
          buf[o++] = shiftLo[b1 + x]!;
          buf[o++] = shiftHi[b1 + x]!;
          buf[o++] = shiftLo[b2 + x]!;
          buf[o++] = shiftHi[b2 + x]!;
        }
      }
    }
    placements[t] = buf;
  }

  const counts = new Int32Array(countsIn.length);
  counts.set(countsIn);

  const occLo = new Uint32Array(H);
  const occHi = new Uint32Array(H);
  let usedArea = 0;

  const dfs = (): boolean => {
    if (totalPieces === 0) return true;
    if (remainingArea > cap - usedArea) return false;

    let bestT = -1;
    let bestFit = 1e9;

    for (let t = 0; t < counts.length; t++) {
      if (counts[t] === 0) continue;
      const pl = placements[t]!;
      let fit = 0;
      for (let p = 0; p < pl.length; p += 7) {
        const y = pl[p]!;
        const y1 = y + 1;
        const y2 = y + 2;
        if (
          ((occLo[y]! & pl[p + 1]!) |
            (occHi[y]! & pl[p + 2]!) |
            (occLo[y1]! & pl[p + 3]!) |
            (occHi[y1]! & pl[p + 4]!) |
            (occLo[y2]! & pl[p + 5]!) |
            (occHi[y2]! & pl[p + 6]!)) === 0
        ) {
          fit++;
          if (fit >= bestFit) break;
        }
      }
      if (fit === 0) return false;
      if (fit < bestFit) {
        bestFit = fit;
        bestT = t;
        if (fit === 1) break;
      }
    }

    const pl = placements[bestT]!;
    const a = shapeAreas[bestT]!;

    for (let p = 0; p < pl.length; p += 7) {
      const y = pl[p]!;
      const y1 = y + 1;
      const y2 = y + 2;
      const lo0 = pl[p + 1]!;
      const hi0 = pl[p + 2]!;
      const lo1 = pl[p + 3]!;
      const hi1 = pl[p + 4]!;
      const lo2 = pl[p + 5]!;
      const hi2 = pl[p + 6]!;

      if (
        ((occLo[y]! & lo0) |
          (occHi[y]! & hi0) |
          (occLo[y1]! & lo1) |
          (occHi[y1]! & hi1) |
          (occLo[y2]! & lo2) |
          (occHi[y2]! & hi2)) !== 0
      )
        continue;

      occLo[y] |= lo0;
      occHi[y] |= hi0;
      occLo[y1] |= lo1;
      occHi[y1] |= hi1;
      occLo[y2] |= lo2;
      occHi[y2] |= hi2;

      counts[bestT]--;
      totalPieces--;
      remainingArea -= a;
      usedArea += a;

      if (dfs()) return true;

      usedArea -= a;
      remainingArea += a;
      totalPieces++;
      counts[bestT]++;

      occLo[y] ^= lo0;
      occHi[y] ^= hi0;
      occLo[y1] ^= lo1;
      occHi[y1] ^= hi1;
      occLo[y2] ^= lo2;
      occHi[y2] ^= hi2;
    }

    return false;
  };

  return dfs();
}

export const solver: ISolver = {
  solve(input: string): string {
    const shapeMasks: number[] = [];
    const shapeAreasTmp: number[] = [];
    let shapeCount = 0;
    let countsBuf: Int32Array | null = null;
    let shapeAreas: Int32Array | null = null;
    let shapeOrients: number[][] | null = null;

    let pendingShapeIdx = -1;
    let pendingRow = 0;
    let pendingMask = 0;

    let answer = 0;

    const n = input.length;
    let lineStart = 0;
    let inRegions = false;

    for (let i = 0; i <= n; i++) {
      if (i !== n && input.charCodeAt(i) !== 10) continue;

      let lineEnd = i;
      if (lineEnd > lineStart && input.charCodeAt(lineEnd - 1) === 13) lineEnd--;
      const lineLen = lineEnd - lineStart;

      if (lineLen === 0) {
        lineStart = i + 1;
        continue;
      }

      if (!inRegions) {
        if (pendingShapeIdx !== -1) {
          // Read shape row (assumed 3x3).
          const y = pendingRow;
          for (let x = 0; x < 3; x++) {
            if (input.charCodeAt(lineStart + x) === 35) pendingMask |= 1 << (y * 3 + x);
          }
          pendingRow++;
          if (pendingRow === 3) {
            shapeMasks[pendingShapeIdx] = pendingMask;
            shapeAreasTmp[pendingShapeIdx] = POPCNT_9[pendingMask]!;
            if (pendingShapeIdx + 1 > shapeCount) shapeCount = pendingShapeIdx + 1;
            pendingShapeIdx = -1;
          }
          lineStart = i + 1;
          continue;
        }

        // If line ends with ':', it's a shape header like "0:".
        if (input.charCodeAt(lineEnd - 1) === 58) {
          let v = 0;
          for (let p = lineStart; p < lineEnd - 1; p++) v = v * 10 + (input.charCodeAt(p) - 48);
          pendingShapeIdx = v;
          pendingRow = 0;
          pendingMask = 0;
          lineStart = i + 1;
          continue;
        }

        // Otherwise, we've reached regions.
        inRegions = true;
      }

      // Fast fixed-format path (final input): all region lines are 24 chars, 2-digit dims + 2-digit counts.
      if (
        shapeCount === 6 &&
        lineLen === 24 &&
        input.charCodeAt(lineStart + 2) === 120 && // 'x'
        input.charCodeAt(lineStart + 5) === 58 && // ':'
        input.charCodeAt(lineStart + 6) === 32 && // ' '
        input.charCodeAt(lineStart + 9) === 32 &&
        input.charCodeAt(lineStart + 12) === 32 &&
        input.charCodeAt(lineStart + 15) === 32 &&
        input.charCodeAt(lineStart + 18) === 32 &&
        input.charCodeAt(lineStart + 21) === 32
      ) {
        const step = i + 1 - lineStart; // includes newline (or CRLF)
        const a0 = shapeAreasTmp[0] as number;
        const a1 = shapeAreasTmp[1] as number;
        const a2 = shapeAreasTmp[2] as number;
        const a3 = shapeAreasTmp[3] as number;
        const a4 = shapeAreasTmp[4] as number;
        const a5 = shapeAreasTmp[5] as number;

        for (let pos = lineStart; pos + 23 < n; pos += step) {
          const W =
            (input.charCodeAt(pos) - 48) * 10 + (input.charCodeAt(pos + 1) - 48);
          const H =
            (input.charCodeAt(pos + 3) - 48) * 10 + (input.charCodeAt(pos + 4) - 48);

          const c0 =
            (input.charCodeAt(pos + 7) - 48) * 10 + (input.charCodeAt(pos + 8) - 48);
          const c1 =
            (input.charCodeAt(pos + 10) - 48) * 10 + (input.charCodeAt(pos + 11) - 48);
          const c2 =
            (input.charCodeAt(pos + 13) - 48) * 10 + (input.charCodeAt(pos + 14) - 48);
          const c3 =
            (input.charCodeAt(pos + 16) - 48) * 10 + (input.charCodeAt(pos + 17) - 48);
          const c4 =
            (input.charCodeAt(pos + 19) - 48) * 10 + (input.charCodeAt(pos + 20) - 48);
          const c5 =
            (input.charCodeAt(pos + 22) - 48) * 10 + (input.charCodeAt(pos + 23) - 48);

          const totalPieces = c0 + c1 + c2 + c3 + c4 + c5;
          const blocks = (DIV3[W]! as number) * (DIV3[H]! as number);
          if (totalPieces <= blocks) {
            answer++;
            continue;
          }

          const totalArea = c0 * a0 + c1 * a1 + c2 * a2 + c3 * a3 + c4 * a4 + c5 * a5;
          if (totalArea > W * H) continue;

          if (countsBuf === null) countsBuf = new Int32Array(6);
          countsBuf[0] = c0;
          countsBuf[1] = c1;
          countsBuf[2] = c2;
          countsBuf[3] = c3;
          countsBuf[4] = c4;
          countsBuf[5] = c5;

          if (shapeAreas === null) {
            shapeAreas = new Int32Array(shapeCount);
            for (let t = 0; t < shapeCount; t++) shapeAreas[t] = shapeAreasTmp[t] as number;
          }
          if (shapeOrients === null) {
            shapeOrients = new Array(shapeCount);
            for (let t = 0; t < shapeCount; t++) {
              const baseMask = shapeMasks[t] | 0;
              const uniq: number[] = [];
              for (let k = 0; k < 8; k++) {
                const m = transformMask3x3(baseMask, k);
                let seen = false;
                for (let j = 0; j < uniq.length; j++) {
                  if (uniq[j] === m) {
                    seen = true;
                    break;
                  }
                }
                if (!seen) uniq.push(m);
              }
              shapeOrients[t] = uniq;
            }
          }
          if (canPackTight(W, H, shapeAreas, shapeOrients, countsBuf)) answer++;
        }

        return String(answer);
      }

      // Parse region line: WxH: c0 c1 ...
      let p = lineStart;
      let W = 0;
      while (p < lineEnd) {
        const c = input.charCodeAt(p);
        if (c < 48 || c > 57) break;
        W = W * 10 + (c - 48);
        p++;
      }
      p++; // 'x'
      let H = 0;
      while (p < lineEnd) {
        const c = input.charCodeAt(p);
        if (c < 48 || c > 57) break;
        H = H * 10 + (c - 48);
        p++;
      }
      // Skip ':'.
      while (p < lineEnd && input.charCodeAt(p) !== 58) p++;
      p++;

      let totalPieces = 0;
      if (countsBuf === null) countsBuf = new Int32Array(shapeCount);
      for (let t = 0; t < shapeCount; t++) {
        while (p < lineEnd && input.charCodeAt(p) === 32) p++;
        let v = 0;
        while (p < lineEnd) {
          const c = input.charCodeAt(p);
          if (c < 48 || c > 57) break;
          v = v * 10 + (c - 48);
          p++;
        }
        countsBuf[t] = v;
        totalPieces += v;
      }

      const blocks =
        W < 256 && H < 256 ? (DIV3[W]! as number) * (DIV3[H]! as number) : ((W / 3) | 0) * ((H / 3) | 0);
      if (totalPieces <= blocks) {
        answer++;
      } else {
        let totalArea = 0;
        for (let t = 0; t < shapeCount; t++) {
          totalArea += countsBuf[t]! * (shapeAreasTmp[t] as number);
        }
        if (totalArea > W * H) {
          lineStart = i + 1;
          continue;
        }

        // Tight case: needs real packing search (sample uses this path).
        if (shapeAreas === null) {
          shapeAreas = new Int32Array(shapeCount);
          for (let t = 0; t < shapeCount; t++) shapeAreas[t] = shapeAreasTmp[t] as number;
        }
        if (shapeOrients === null) {
          shapeOrients = new Array(shapeCount);
          for (let t = 0; t < shapeCount; t++) {
            const baseMask = shapeMasks[t] | 0;
            const uniq: number[] = [];
            for (let k = 0; k < 8; k++) {
              const m = transformMask3x3(baseMask, k);
              let seen = false;
              for (let j = 0; j < uniq.length; j++) {
                if (uniq[j] === m) {
                  seen = true;
                  break;
                }
              }
              if (!seen) uniq.push(m);
            }
            shapeOrients[t] = uniq;
          }
        }
        if (canPackTight(W, H, shapeAreas, shapeOrients, countsBuf)) answer++;
      }

      lineStart = i + 1;
    }

    return String(answer);
  },
};
