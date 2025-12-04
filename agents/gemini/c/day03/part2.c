/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    long long total = 0;
    char* p = input;
    const int K = 12;
    char stack[16]; // K=12, slightly larger buffer safe
    
    while (*p) {
        char* start = p;
        while (*p && *p != '\n') p++;
        char* end = p;
        int len = end - start;
        
        if (len < K) {
            if (*p == '\n') p++;
            continue;
        }
        
        // Stack logic
        // stack array will store characters '0'-'9'
        int top = 0; // number of elements in stack
        
        for (int i = 0; i < len; i++) {
            char c = start[i];
            int remaining = len - i; // includes current char c? No, remaining after current is len-1-i
            // Logic: can pop if stack_size + remaining > K
            // Wait, remaining chars available to add is (len - i). 
            // Because we haven't added c yet.
            // If we keep stack (size top), we can add at most (len - i) chars.
            // Total potential length = top + (len - i).
            // If we pop one, potential length = (top - 1) + (len - i).
            // We can pop if (top - 1) + (len - i) >= K.
            
            while (top > 0 && c > stack[top - 1] && (top - 1) + (len - i) >= K) {
                top--;
            }
            
            if (top < K) {
                stack[top++] = c;
            }
        }
        
        // Parse stack to number
        long long val = 0;
        for (int i = 0; i < K; i++) {
            val = val * 10 + (stack[i] - '0');
        }
        total += val;
        
        if (*p == '\n') p++;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}