/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * @see https://adventofcode.com/2025/day/4
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const grid = input.trim().split(/\r?\n/);
    const rows = grid.length;
    if (rows === 0) return "0";
    const cols = grid[0].length;
    
    let accessibleRolls = 0;

    // Define the 8 directions for neighbors (including diagonals)
    const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dc = [-1, 0, 1, -1, 1, -1, 0, 1];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== '@') continue;

        let adjacentPaperRolls = 0;

        for (let i = 0; i < 8; i++) {
          const nr = r + dr[i];
          const nc = c + dc[i];

          // Check boundaries
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            // Check if neighbor is a roll
            if (grid[nr][nc] === '@') {
              adjacentPaperRolls++;
            }
          }
        }

        if (adjacentPaperRolls < 4) {
          accessibleRolls++;
        }
      }
    }

    return accessibleRolls.toString();
  },
};
