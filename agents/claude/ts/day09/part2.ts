/**
 * Advent of Code 2025 - Day 09 Part 2
 * Movie Theater - Find largest rectangle using only red/green tiles
 *
 * Red points form a rectilinear polygon connected by green segments.
 * Rectangle must be entirely within the colored region.
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const n = lines.length;

    // Parse coordinates
    const px: number[] = [];
    const py: number[] = [];

    for (let i = 0; i < n; i++) {
      const line = lines[i];
      let idx = 0;
      let val = 0;

      while (line.charCodeAt(idx) !== 44) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      px.push(val);
      idx++;
      val = 0;

      while (idx < line.length) {
        val = val * 10 + line.charCodeAt(idx++) - 48;
      }
      py.push(val);
    }

    // Separate H and V segments for better cache locality
    const h_y: number[] = [], h_x1: number[] = [], h_x2: number[] = [];
    const v_x: number[] = [], v_y1: number[] = [], v_y2: number[] = [];

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = px[i], y1 = py[i];
      const x2 = px[j], y2 = py[j];
      if (y1 === y2) {
        h_y.push(y1);
        h_x1.push(x1 < x2 ? x1 : x2);
        h_x2.push(x1 > x2 ? x1 : x2);
      } else {
        v_x.push(x1);
        v_y1.push(y1 < y2 ? y1 : y2);
        v_y2.push(y1 > y2 ? y1 : y2);
      }
    }
    const nh = h_y.length, nv = v_x.length;

    // Single-pass rectangle validation
    function isValidRect(minX: number, maxX: number, minY: number, maxY: number): boolean {
      let cross_bl = 0, cross_br = 0, cross_tl = 0, cross_tr = 0;
      let on_bl = 0, on_br = 0, on_tl = 0, on_tr = 0;

      // Horizontal segments
      for (let i = 0; i < nh; i++) {
        const sy = h_y[i], sx1 = h_x1[i], sx2 = h_x2[i];
        if (minY === sy && minX >= sx1 && minX <= sx2) on_bl = 1;
        if (minY === sy && maxX >= sx1 && maxX <= sx2) on_br = 1;
        if (maxY === sy && minX >= sx1 && minX <= sx2) on_tl = 1;
        if (maxY === sy && maxX >= sx1 && maxX <= sx2) on_tr = 1;
        if (minX > sx1 && minX < sx2 && sy > minY && sy < maxY) return false;
        if (maxX > sx1 && maxX < sx2 && sy > minY && sy < maxY) return false;
      }

      // Vertical segments
      for (let i = 0; i < nv; i++) {
        const sx = v_x[i], sy1 = v_y1[i], sy2 = v_y2[i];
        if (minX === sx && minY >= sy1 && minY <= sy2) on_bl = 1;
        if (maxX === sx && minY >= sy1 && minY <= sy2) on_br = 1;
        if (minX === sx && maxY >= sy1 && maxY <= sy2) on_tl = 1;
        if (maxX === sx && maxY >= sy1 && maxY <= sy2) on_tr = 1;
        if (minY > sy1 && minY <= sy2 && minX < sx) cross_bl++;
        if (minY > sy1 && minY <= sy2 && maxX < sx) cross_br++;
        if (maxY > sy1 && maxY <= sy2 && minX < sx) cross_tl++;
        if (maxY > sy1 && maxY <= sy2 && maxX < sx) cross_tr++;
        if (minY > sy1 && minY < sy2 && sx > minX && sx < maxX) return false;
        if (maxY > sy1 && maxY < sy2 && sx > minX && sx < maxX) return false;
      }

      if (!on_bl && !(cross_bl & 1)) return false;
      if (!on_br && !(cross_br & 1)) return false;
      if (!on_tl && !(cross_tl & 1)) return false;
      if (!on_tr && !(cross_tr & 1)) return false;
      return true;
    }

    // For each pair of red points, check if rectangle is valid
    let maxArea = 0;

    for (let i = 0; i < n; i++) {
      const x1 = px[i], y1 = py[i];
      for (let j = i + 1; j < n; j++) {
        const x2 = px[j], y2 = py[j];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const adx = dx < 0 ? -dx : dx;
        const ady = dy < 0 ? -dy : dy;

        const area = (adx + 1) * (ady + 1);
        if (area <= maxArea) continue;

        const minX = x1 < x2 ? x1 : x2, maxX = x1 > x2 ? x1 : x2;
        const minY = y1 < y2 ? y1 : y2, maxY = y1 > y2 ? y1 : y2;

        if (isValidRect(minX, maxX, minY, maxY)) {
          maxArea = area;
        }
      }
    }

    return maxArea.toString();
  },
};
