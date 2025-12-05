/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * @see https://adventofcode.com/2025/day/4
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let grid: string[][] = input.trim().split("\n").map(row => row.split(''));
    const H = grid.length;
    const W = grid[0].length;

    let totalRemovedCount = 0;

    const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dc = [-1, 0, 1, -1, 1, -1, 0, 1];

    while (true) {
      let toRemove: { r: number, c: number }[] = [];

      // Phase 1: Identify accessible rolls
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (grid[r][c] === '@') {
            let adjacentPaperRolls = 0;
            for (let i = 0; i < 8; i++) {
              const nr = r + dr[i];
              const nc = c + dc[i];

              if (nr >= 0 && nr < H && nc >= 0 && nc < W) {
                if (grid[nr][nc] === '@') {
                  adjacentPaperRolls++;
                }
              }
            }

            if (adjacentPaperRolls < 4) {
              toRemove.push({ r, c });
            }
          }
        }
      }

      // Phase 2: Remove identified rolls
      if (toRemove.length === 0) {
        break; // No more rolls can be removed
      }

      for (const { r, c } of toRemove) {
        grid[r][c] = '.'; // Mark as removed
        totalRemovedCount++;
      }
    }

    return totalRemovedCount.toString();
  },
};