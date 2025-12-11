/**
 * 🎄 Advent of Code 2025 - Day 10 Part 1
 * @see https://adventofcode.com/2025/day/10
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    let total = 0;

    // Shared buffers sized for the problem constraints (<= 10 lights => 1024 states).
    const maxStates = 1 << 10;
    const dist = new Int16Array(maxStates);
    const queue = new Uint16Array(maxStates);

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (!line) continue;

      const bracketEnd = line.indexOf("]");
      const pattern = line.slice(1, bracketEnd);
      const lights = pattern.length;

      let target = 0;
      for (let i = 0; i < lights; i++) {
        if (pattern.charCodeAt(i) === 35) target |= 1 << i; // '#'
      }
      if (target === 0) {
        continue;
      }

      const braceIdx = line.indexOf("{", bracketEnd);
      const buttonsPart =
        braceIdx === -1 ? line.slice(bracketEnd + 1) : line.slice(bracketEnd + 1, braceIdx);

      const buttons: number[] = [];
      let mask = 0;
      let num = 0;
      let readingNum = false;
      for (let i = 0; i < buttonsPart.length; i++) {
        const c = buttonsPart.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          num = num * 10 + (c - 48);
          readingNum = true;
        } else {
          if (readingNum) {
            mask |= 1 << num;
            num = 0;
            readingNum = false;
          }
          if (c === 41) {
            buttons.push(mask);
            mask = 0;
          }
        }
      }

      const states = 1 << lights;
      dist.fill(-1, 0, states);
      let head = 0;
      let tail = 0;
      queue[tail++] = 0;
      dist[0] = 0;

      let answer = -1;
      while (head < tail) {
        const state = queue[head++];
        const steps = dist[state] as number;
        if (state === target) {
          answer = steps;
          break;
        }
        for (let i = 0; i < buttons.length; i++) {
          const next = state ^ buttons[i]!;
          if (dist[next] === -1) {
            dist[next] = steps + 1;
            queue[tail++] = next;
          }
        }
      }

      if (answer === -1) {
        throw new Error(`Unreachable configuration on line ${li + 1}`);
      }
      total += answer;
    }

    return String(total);
  },
};
