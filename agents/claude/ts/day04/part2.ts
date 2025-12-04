/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * Simulate removing rolls iteratively until none are accessible
 * Uses BFS optimization: when a roll is removed, only its neighbors may become accessible
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const rows = lines.length;
    const cols = lines[0].length;

    // Create mutable grid
    const grid: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = lines[r][c] === "@";
      }
    }

    // Direction offsets for 8 neighbors
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    // Count neighbors for a cell
    const countNeighbors = (r: number, c: number): number => {
      let count = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
          count++;
        }
      }
      return count;
    };

    // Initial pass: find all accessible rolls
    let queue: [number, number][] = [];
    const inQueue = new Set<number>();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] && countNeighbors(r, c) < 4) {
          queue.push([r, c]);
          inQueue.add(r * cols + c);
        }
      }
    }

    let totalRemoved = 0;

    // Process queue - when we remove a roll, check if neighbors become accessible
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = r * cols + c;
      inQueue.delete(key);

      // Check if still accessible (may have changed since added to queue)
      if (!grid[r][c] || countNeighbors(r, c) >= 4) continue;

      // Remove this roll
      grid[r][c] = false;
      totalRemoved++;

      // Check if any neighbors become accessible
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
          const nkey = nr * cols + nc;
          if (!inQueue.has(nkey) && countNeighbors(nr, nc) < 4) {
            queue.push([nr, nc]);
            inQueue.add(nkey);
          }
        }
      }
    }

    return totalRemoved.toString();
  },
};
