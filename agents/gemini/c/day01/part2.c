/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

// Fast floor division by 100 for potentially negative numbers
static inline long long floor_div_100(long long a) {
    return (a >= 0) ? (a / 100) : ((a - 99) / 100);
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    int position = 50;
    long long count = 0;
    char* p = input;
    
    while (*p) {
        // Skip whitespace
        while (*p && *p <= 32) p++;
        if (!*p) break;
        
        char dir = *p++;
        int val = 0;
        
        while (*p >= '0' && *p <= '9') {
            val = val * 10 + (*p++ - '0');
        }
        
        if (dir == 'L') {
            // Count multiples of 100 in [position-val, position-1]
            // Formula: floor((pos - 1) / 100) - floor((pos - val - 1) / 100)
            
            // Optimization: pos is [0, 99].
            // floor((pos - 1) / 100) is 0 unless pos=0, then -1.
            long long term1 = (position == 0) ? -1 : 0;
            
            // term2 can be negative
            long long term2 = floor_div_100(position - val - 1);
            
            count += (term1 - term2);
            
            position = (position - val) % 100;
            if (position < 0) position += 100;
        } else {
            // R
            // Count multiples of 100 in [position+1, position+val]
            // Formula: floor((pos + val) / 100) - floor(pos / 100)
            
            // Optimization: floor(pos / 100) is always 0 since pos in [0, 99]
            // term1 is always positive
            count += (position + val) / 100;
            
            position = (position + val) % 100;
        }
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}