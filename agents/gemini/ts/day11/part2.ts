import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const graph = new Map<string, string[]>();

    // Parsing
    const lines = input.trim().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const [src, destsStr] = line.split(": ");
      const dests = destsStr.split(" ");
      graph.set(src, dests);
    }

    // Memoization cache needs to be cleared for each target or include target in key
    // Since we do sequential searches, clearing is easier.
    let memo = new Map<string, number>();

    function countPaths(node: string, target: string): number {
      if (node === target) return 1;
      if (memo.has(node)) return memo.get(node)!;

      const neighbors = graph.get(node);
      if (!neighbors) {
        memo.set(node, 0);
        return 0;
      }

      let total = 0;
      for (const neighbor of neighbors) {
        total += countPaths(neighbor, target);
      }

      memo.set(node, total);
      return total;
    }

    function getPaths(start: string, end: string): number {
      memo.clear();
      return countPaths(start, end);
    }

    // Check path: svr -> dac -> fft -> out
    const path1 = 
      getPaths("svr", "dac") * 
      getPaths("dac", "fft") * 
      getPaths("fft", "out");

    // Check path: svr -> fft -> dac -> out
    const path2 = 
      getPaths("svr", "fft") * 
      getPaths("fft", "dac") * 
      getPaths("dac", "out");

    return (path1 + path2).toString();
  },
};