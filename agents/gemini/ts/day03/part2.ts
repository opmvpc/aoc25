import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split(/\r?\n/);
    const K = 12;
    let total = 0n;

    for (const line of lines) {
      if (line.length < K) continue;

      // Stack to store the digits of the largest subsequence found so far
      const stack: string[] = [];
      const n = line.length;

      for (let i = 0; i < n; i++) {
        const char = line[i];
        
        // While we have elements, the current digit is better than the last one picked,
        // AND we have enough remaining characters to still fill the quota of K if we drop one.
        // Remaining chars after current index i: n - 1 - i
        // Current stack size after pop: stack.length - 1
        // Need: stack.length - 1 + 1 (current char) + (n - 1 - i) >= K
        // Simplifies to: stack.length + (n - i) > K  (wait, let's re-verify logic)
        
        // Correct logic:
        // We can pop IF: (elements_in_stack + elements_remaining_including_current) > K
        // elements_in_stack = stack.length
        // elements_remaining_including_current = n - i
        
        while (
          stack.length > 0 &&
          char > stack[stack.length - 1] &&
          (stack.length - 1) + (n - i) >= K
        ) {
          stack.pop();
        }

        if (stack.length < K) {
          stack.push(char);
        }
      }
      
      total += BigInt(stack.join(''));
    }

    return total.toString();
  },
};