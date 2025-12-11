/**
 * Advent of Code 2025 - Day 10 Part 1
 * Factory - Minimum button presses to toggle lights to target pattern
 *
 * Key insight: XOR algebra on GF(2). Each button press toggles bits.
 * Since toggle(toggle(x)) = x, each button is used 0 or 1 times.
 * Enumerate all 2^k combinations using Gray code for O(1) state updates.
 */

import type { ISolver } from "../../tools/runner/types.js";

// Popcount for 32-bit numbers
function popcount(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  n = (n + (n >>> 4)) & 0x0f0f0f0f;
  n = n + (n >>> 8);
  n = n + (n >>> 16);
  return n & 0x3f;
}

// Count trailing zeros to find which bit flipped in Gray code
function ctz(n: number): number {
  if (n === 0) return 32;
  let c = 0;
  if ((n & 0xffff) === 0) { c += 16; n >>>= 16; }
  if ((n & 0xff) === 0) { c += 8; n >>>= 8; }
  if ((n & 0xf) === 0) { c += 4; n >>>= 4; }
  if ((n & 0x3) === 0) { c += 2; n >>>= 2; }
  if ((n & 0x1) === 0) { c += 1; }
  return c;
}

function solveMachine(target: number, buttons: number[]): number {
  const k = buttons.length;
  const total = 1 << k;

  // Special case: target is already 0 (all lights off)
  if (target === 0) return 0;

  // Check single buttons first
  for (let i = 0; i < k; i++) {
    if (buttons[i] === target) return 1;
  }

  let minPresses = k + 1; // Impossible sentinel
  let state = 0;
  let grayPrev = 0;

  // Gray code enumeration: each step flips exactly one bit
  for (let i = 1; i < total; i++) {
    const gray = i ^ (i >>> 1);
    const changed = gray ^ grayPrev;
    const btnIdx = ctz(changed);
    state ^= buttons[btnIdx];
    grayPrev = gray;

    if (state === target) {
      const presses = popcount(gray);
      if (presses < minPresses) {
        minPresses = presses;
        // Early exit if we found minimum possible for remaining bits
        if (presses === 2) return 2; // Can't beat this after checking singles
      }
    }
  }

  return minPresses;
}

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let totalPresses = 0;

    for (const line of lines) {
      // Parse: [.##.] (3) (1,3) (2) {3,5,4,7}
      const bracketEnd = line.indexOf("]");
      const pattern = line.slice(1, bracketEnd);
      const numLights = pattern.length;

      // Build target bitmask from pattern
      let target = 0;
      for (let i = 0; i < numLights; i++) {
        if (pattern.charCodeAt(i) === 35) { // '#'
          target |= 1 << i;
        }
      }

      // Extract buttons - everything between ] and {
      const braceStart = line.indexOf("{");
      const buttonsSection = line.slice(bracketEnd + 1, braceStart);

      // Parse each (x,y,z) button
      const buttons: number[] = [];
      let idx = 0;
      while (idx < buttonsSection.length) {
        const pStart = buttonsSection.indexOf("(", idx);
        if (pStart === -1) break;
        const pEnd = buttonsSection.indexOf(")", pStart);
        const content = buttonsSection.slice(pStart + 1, pEnd);

        // Parse comma-separated indices
        let mask = 0;
        let val = 0;
        let hasVal = false;
        for (let i = 0; i <= content.length; i++) {
          const c = i < content.length ? content.charCodeAt(i) : 44;
          if (c >= 48 && c <= 57) {
            val = val * 10 + c - 48;
            hasVal = true;
          } else if (hasVal) {
            mask |= 1 << val;
            val = 0;
            hasVal = false;
          }
        }
        buttons.push(mask);
        idx = pEnd + 1;
      }

      totalPresses += solveMachine(target, buttons);
    }

    return totalPresses.toString();
  },
};
