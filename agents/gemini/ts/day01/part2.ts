/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * @see https://adventofcode.com/2025/day/1
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    let position = 50;
    let count = 0;
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Skip whitespace
      while (i < len && input.charCodeAt(i) <= 32) {
        i++;
      }
      if (i >= len) break;

      const dir = input.charCodeAt(i); // 'L' or 'R'
      i++;
      
      let val = 0;
      while (i < len) {
        const c = input.charCodeAt(i);
        if (c < 48 || c > 57) break;
        val = val * 10 + (c - 48);
        i++;
      }

      if (dir === 76) { // 'L'
        // L: negative direction
        // Range of values covered: [position - val, position - 1]
        // We want to count multiples of 100 in this range.
        // Formula: floor(B/100) - floor((A-1)/100)
        // Here B = position - 1, A = position - val
        // Count = floor((position - 1)/100) - floor((position - val - 1)/100)
        
        count += Math.floor((position - 1) / 100) - Math.floor((position - val - 1) / 100);
        
        position = (position - val) % 100;
        if (position < 0) position += 100;
      } else { // 'R' assumed
        // R: positive direction
        // Range of values covered: [position + 1, position + val]
        // Count = floor((position + val)/100) - floor(position/100)
        // Since 0 <= position < 100, floor(position/100) is always 0.
        
        count += Math.floor((position + val) / 100);
        
        position = (position + val) % 100;
      }
    }

    return count.toString();
  },
};
