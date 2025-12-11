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

    // Memoization cache
    const memo = new Map<string, number>();

    function countPaths(node: string): number {
      if (node === "out") return 1;
      if (memo.has(node)) return memo.get(node)!;

      const neighbors = graph.get(node);
      if (!neighbors) {
        memo.set(node, 0);
        return 0;
      }

      let total = 0;
      for (const neighbor of neighbors) {
        total += countPaths(neighbor);
      }

      memo.set(node, total);
      return total;
    }

    const result = countPaths("you");
    return result.toString();
  },
};