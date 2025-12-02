/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    int position = 50;
    long long count = 0;
    char* p = input;
    
    while (*p) {
        // Fast skip non-command chars
        if (*p <= 32) { p++; continue; }
        
        char dir = *p++;
        int val = 0;
        
        // Fast integer parse
        while (*p >= '0') {
            val = val * 10 + (*p++ - '0');
        }
        
        if (dir & 2) { // 'R' is 82 (01010010), 'L' is 76 (01001100). Bit 1 set for R.
            // R
            count += (position + val) / 100;
            position = (position + val) % 100;
        } else {
            // L
            // Formula: count += (pos==0 ? -1 : 0) - floor((pos - val - 1) / 100)
            long long arg = position - val - 1;
            long long term2 = arg / 100;
            // Branchless floor correction
            // If arg % 100 < 0, decrement term2
            term2 -= (arg % 100 < 0);
            
            // term1 is -1 if position==0, else 0
            // (position == 0) -> 1. We want -1. So -(position == 0).
            count += -(position == 0) - term2;
            
            position = (position - val) % 100;
            // Branchless modulo correction: if negative, add 100
            // (position >> 31) is -1 (all 1s) if neg, 0 if pos
            // & 100 gives 100 if neg, 0 if pos
            position += (position >> 31) & 100;
        }
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
