import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const grid = input.split(/\r?\n/);
    if (grid.length === 0) return "0";
    
    const height = grid.length;
    // Assuming constant width based on first line, but handling ragged edges safely
    const width = grid[0].length;

    let startX = -1;
    let startY = -1;

    for (let y = 0; y < height; y++) {
      const idx = grid[y].indexOf('S');
      if (idx !== -1) {
        startX = idx;
        startY = y;
        break;
      }
    }

    if (startX === -1) return "0";

    // Map: column index -> number of timelines (paths) reaching this column
    let counts = new Map<number, number>(); // Using Map for sparse storage if needed, or array
    // Since width is small (141), array is fine.
    // Use Number or BigInt? "40 timelines" in sample. "many-worlds". Exponential growth?
    // 2^140 is huge. We definitely need BigInt.
    
    let activeCounts = new Array(width).fill(0n);
    activeCounts[startX] = 1n;

    let totalExited = 0n;

    for (let y = startY + 1; y < height; y++) {
      const nextActiveCounts = new Array(width).fill(0n);
      const row = grid[y];
      
      // If row is empty/short
      if (!row) {
        // All current active counts are effectively "exiting bottom" or stuck?
        // If empty row means end of manifold, then yes.
        // But loop continues to height.
        // We'll treat short rows as void/empty space? Or exit?
        // "Tachyon beams pass freely through empty space (.)"
        // If row is short, x might be out of bounds -> exit?
        // Let's assume standard grid behavior: if x >= row.length, it's an exit.
      }

      let hasActive = false;

      for (let x = 0; x < width; x++) {
        const count = activeCounts[x];
        if (count === 0n) continue;

        // Check if x is within current row
        if (x >= row.length) {
          // Exited side/void?
          // If the grid is ragged, x >= length means it fell off the "manifold shape".
          // Treat as exit.
          totalExited += count;
          continue;
        }

        const char = row[x];
        if (char === '^') {
          // Split
          // Left
          if (x - 1 >= 0) {
            nextActiveCounts[x - 1] += count;
            hasActive = true;
          } else {
            totalExited += count;
          }
          // Right
          if (x + 1 < width) {
            nextActiveCounts[x + 1] += count;
            hasActive = true;
          } else {
            totalExited += count;
          }
        } else {
          // Continue
          nextActiveCounts[x] += count;
          hasActive = true;
        }
      }
      activeCounts = nextActiveCounts;
      
      if (!hasActive) break;
    }

    // Add remaining active counts (those that reached the bottom)
    for (let x = 0; x < width; x++) {
      totalExited += activeCounts[x];
    }

    return totalExited.toString();
  },
};