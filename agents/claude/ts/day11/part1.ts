import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const graph = new Map<string, string[]>();
    const lines = input.split("\n");
    const len = lines.length;

    for (let i = 0; i < len; i++) {
      const line = lines[i];
      if (line.length < 5) continue;
      graph.set(line.slice(0, 3), line.slice(5).split(" "));
    }

    const memo = new Map<string, number>([["out", 1]]);

    const countPaths = (node: string): number => {
      const cached = memo.get(node);
      if (cached !== undefined) return cached;
      const outputs = graph.get(node);
      if (!outputs) { memo.set(node, 0); return 0; }
      let total = 0;
      for (let i = 0, n = outputs.length; i < n; i++) {
        total += countPaths(outputs[i]);
      }
      memo.set(node, total);
      return total;
    };

    return countPaths("you").toString();
  },
};
