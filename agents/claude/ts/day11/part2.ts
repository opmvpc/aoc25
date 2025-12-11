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

    // Separate memo per target for better cache locality
    const countPathsTo = (target: string): (from: string) => number => {
      const memo = new Map<string, number>([[target, 1]]);
      const fn = (from: string): number => {
        const cached = memo.get(from);
        if (cached !== undefined) return cached;
        const outputs = graph.get(from);
        if (!outputs) { memo.set(from, 0); return 0; }
        let total = 0;
        for (let i = 0, n = outputs.length; i < n; i++) {
          total += fn(outputs[i]);
        }
        memo.set(from, total);
        return total;
      };
      return fn;
    };

    // Precompute path counters for each target we need
    const toDac = countPathsTo("dac");
    const toFft = countPathsTo("fft");
    const toOut = countPathsTo("out");

    // Case 1: svr -> dac -> fft -> out
    // Case 2: svr -> fft -> dac -> out
    const result = toDac("svr") * toFft("dac") * toOut("fft") +
                   toFft("svr") * toDac("fft") * toOut("dac");

    return result.toString();
  },
};
