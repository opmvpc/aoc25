/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    int position = 50;
    int count = 0;
    char* p = input;
    
    while (*p) {
        // Skip whitespace
        while (*p && *p <= 32) p++;
        if (!*p) break;
        
        char dir = *p++;
        int val = 0;
        
        // Parse number manually (faster than atoi/strtol)
        while (*p >= '0' && *p <= '9') {
            val = val * 10 + (*p++ - '0');
        }
        
        // Apply rotation
        // 'L' is 76, 'R' is 82
        if (dir == 'L') {
            position = (position - val) % 100;
            // Branchless correction for negative modulo result:
            // if position < 0, we add 100. 
            // (position >> 31) will be -1 if negative, 0 if positive (assuming 32-bit int)
            // But simpler: just if (position < 0) position += 100; is very fast.
            if (position < 0) position += 100;
        } else {
            position = (position + val) % 100;
        }
        
        if (position == 0) {
            count++;
        }
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}