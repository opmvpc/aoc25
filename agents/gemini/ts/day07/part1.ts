import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const grid = input.split(/\r?\n/);
    if (grid.length === 0) return "0";
    
    const height = grid.length;
    const width = grid[0].length;

    let startX = -1;
    let startY = -1;

    // Find S
    for (let y = 0; y < height; y++) {
      const idx = grid[y].indexOf('S');
      if (idx !== -1) {
        startX = idx;
        startY = y;
        break;
      }
    }

    if (startX === -1) return "0";

    let activeXs = new Set<number>();
    activeXs.add(startX);

    let splitCount = 0;

    for (let y = startY + 1; y < height; y++) {
      const nextActiveXs = new Set<number>();
      
      // If the row is shorter than width (e.g. empty line at end), handle gracefully
      if (grid[y].length === 0) continue;

      for (const x of activeXs) {
        // Check bounds (though logic should keep them in, except S starts out?)
        if (x < 0 || x >= width) continue;

        // grid lines might be ragged or shorter? assume rect for now, check length
        if (x >= grid[y].length) continue; // Treat as exit/void

        const char = grid[y][x];

        if (char === '^') {
          splitCount++;
          // Split left and right
          // Check bounds for new beams
          if (x - 1 >= 0) nextActiveXs.add(x - 1);
          if (x + 1 < width) nextActiveXs.add(x + 1);
        } else {
          // Continue straight
          nextActiveXs.add(x);
        }
      }
      activeXs = nextActiveXs;
      
      if (activeXs.size === 0) break;
    }

    return splitCount.toString();
  },
};