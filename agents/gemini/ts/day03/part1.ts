import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split(/\r?\n/);
    let total = 0;

    for (const line of lines) {
      if (line.length < 2) continue;

      let d1 = -1;
      let firstIdx = -1;

      // Find the largest possible first digit (must not be the last char)
      for (let v = 9; v >= 1; v--) {
        const idx = line.indexOf(String(v));
        if (idx !== -1 && idx < line.length - 1) {
          d1 = v;
          firstIdx = idx;
          break;
        }
      }

      if (d1 !== -1) {
        let d2 = 0;
        // Search for max digit after d1
        for (let i = firstIdx + 1; i < line.length; i++) {
          const val = line.charCodeAt(i) - 48; // '0' is 48
          if (val > d2) {
            d2 = val;
            if (d2 === 9) break; // Optimization: can't beat 9
          }
        }
        total += d1 * 10 + d2;
      }
    }

    return total.toString();
  },
};
