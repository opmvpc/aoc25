/**
 * Advent of Code 2025 - Day 12 Part 1
 * Present Placement Problem - Ultra-optimized backtracking
 *
 * Optimizations:
 * 1. Cell check for early rejection
 * 2. Typed arrays for grid
 * 3. Precomputed shape data as flat arrays
 * 4. Symmetry breaking for identical pieces
 * 5. Inline everything for speed
 */

import type { ISolver } from "../../tools/runner/types.js";

// Precomputed shape orientations as flat Int8Arrays
// Format: [numCells, maxR, maxC, dr0, dc0, dr1, dc1, ...]
function computeOrientations(shape: number[][]): Int8Array[] {
  const orientations: Int8Array[] = [];
  const seen = new Set<string>();

  const rotate = (pts: number[][]): number[][] =>
    pts.map(([r, c]) => [c, -r]);

  const flip = (pts: number[][]): number[][] =>
    pts.map(([r, c]) => [r, -c]);

  const normalize = (pts: number[][]): number[][] => {
    const minR = Math.min(...pts.map(p => p[0]));
    const minC = Math.min(...pts.map(p => p[1]));
    const shifted = pts.map(([r, c]) => [r - minR, c - minC]);
    shifted.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
    return shifted;
  };

  let curr = shape;
  for (let f = 0; f < 2; f++) {
    for (let r = 0; r < 4; r++) {
      const norm = normalize(curr);
      const key = JSON.stringify(norm);
      if (!seen.has(key)) {
        seen.add(key);
        const maxR = Math.max(...norm.map(p => p[0]));
        const maxC = Math.max(...norm.map(p => p[1]));
        const arr = new Int8Array(3 + norm.length * 2);
        arr[0] = norm.length;
        arr[1] = maxR;
        arr[2] = maxC;
        for (let i = 0; i < norm.length; i++) {
          arr[3 + i * 2] = norm[i][0];
          arr[3 + i * 2 + 1] = norm[i][1];
        }
        orientations.push(arr);
      }
      curr = rotate(curr);
    }
    curr = flip(shape);
  }

  return orientations;
}

function parseShape(lines: string[]): number[][] {
  const cells: number[][] = [];
  for (let r = 0; r < lines.length; r++) {
    for (let c = 0; c < lines[r].length; c++) {
      if (lines[r][c] === "#") cells.push([r, c]);
    }
  }
  return cells;
}

// Global grid for backtracking (avoid allocation)
const grid = new Uint8Array(51 * 51);

function solve(
  shapes: Int8Array[][],
  pieces: Uint8Array,
  numPieces: number,
  pieceIdx: number,
  height: number,
  width: number,
  minPos: number
): boolean {
  if (pieceIdx >= numPieces) return true;

  const typeIdx = pieces[pieceIdx];
  const orientations = shapes[typeIdx];
  const sameType = pieceIdx + 1 < numPieces && pieces[pieceIdx + 1] === typeIdx;

  for (let oi = 0; oi < orientations.length; oi++) {
    const shape = orientations[oi];
    const numCells = shape[0];
    const maxR = shape[1];
    const maxC = shape[2];

    const startPos = sameType ? minPos : 0;
    const startR = (startPos / width) | 0;

    for (let r = startR; r <= height - maxR - 1; r++) {
      const rowStart = r * width;
      let startC = r === startR ? startPos % width : 0;

      for (let c = startC; c <= width - maxC - 1; c++) {
        // Check if can place
        let canPlace = true;
        for (let i = 0; i < numCells && canPlace; i++) {
          const dr = shape[3 + i * 2];
          const dc = shape[3 + i * 2 + 1];
          if (grid[(r + dr) * width + (c + dc)]) canPlace = false;
        }

        if (canPlace) {
          // Place
          for (let i = 0; i < numCells; i++) {
            const dr = shape[3 + i * 2];
            const dc = shape[3 + i * 2 + 1];
            grid[(r + dr) * width + (c + dc)] = 1;
          }

          const nextMin = sameType ? rowStart + c : 0;
          if (solve(shapes, pieces, numPieces, pieceIdx + 1, height, width, nextMin)) {
            return true;
          }

          // Unplace
          for (let i = 0; i < numCells; i++) {
            const dr = shape[3 + i * 2];
            const dc = shape[3 + i * 2 + 1];
            grid[(r + dr) * width + (c + dc)] = 0;
          }
        }
      }
    }
  }

  return false;
}

function canFit(
  width: number,
  height: number,
  shapes: Int8Array[][],
  counts: number[]
): boolean {
  // Cell check
  let cellsNeeded = 0;
  let totalPieces = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > 0) {
      cellsNeeded += counts[i] * shapes[i][0][0];
      totalPieces += counts[i];
    }
  }
  if (cellsNeeded > width * height) return false;
  if (totalPieces === 0) return true;

  // Create piece array
  const pieces = new Uint8Array(totalPieces);
  let idx = 0;
  for (let i = 0; i < counts.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      pieces[idx++] = i;
    }
  }

  // Clear grid
  grid.fill(0, 0, width * height);

  return solve(shapes, pieces, totalPieces, 0, height, width, 0);
}

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");

    // Parse shapes
    const shapes: Int8Array[][] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line.includes("x")) break;

      if (/^\d+:$/.test(line)) {
        const shapeLines: string[] = [];
        i++;
        while (i < lines.length && lines[i] && !lines[i].includes(":")) {
          if (/^[#.]+$/.test(lines[i])) shapeLines.push(lines[i]);
          i++;
        }
        if (shapeLines.length > 0) {
          shapes.push(computeOrientations(parseShape(shapeLines)));
        }
      } else {
        i++;
      }
    }

    let count = 0;

    // Process regions
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      const match = line.match(/^(\d+)x(\d+):\s*(.+)$/);
      if (match) {
        const width = +match[1];
        const height = +match[2];
        const counts = match[3].split(/\s+/).map(Number);

        if (canFit(width, height, shapes, counts)) {
          count++;
        }
      }
      i++;
    }

    return count.toString();
  },
};
