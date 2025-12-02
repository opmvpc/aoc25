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
        // Fast skip whitespace/newlines
        if (*p <= 32) { p++; continue; }
        
        char dir = *p++;
        int val = 0;
        
        // Parse only needed modulo 100 for position update
        // But wait, is val needed for anything else?
        // No, Part 1 only cares about final position == 0.
        while (*p >= '0') {
            val = (val * 10 + (*p++ - '0'));
            // Keep val small? 
            // val = (val * 10 + d) % 100 works strictly for position
            // but (val * 10 + d) might overflow if we don't modulo.
            // However, assuming val fits in int is safe for AoC.
            // But optimizing: we only need val % 100.
            // We can do: if (val >= 100) val %= 100; inside? expensive.
            // Just parse normally, val is small.
        }
        
        // Optimization: Normalize L/R
        // R (82) -> +1, L (76) -> -1 ?
        // if (dir == 'L') val = -val;
        // position = (position + val) % 100;
        
        if (dir == 'L') {
            val = -val;
        }
        
        position = (position + val) % 100;
        // Fix negative modulo result
        if (position < 0) position += 100;
        
        if (position == 0) {
            count++;
        }
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
