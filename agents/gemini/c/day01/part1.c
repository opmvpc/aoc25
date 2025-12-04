/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Optimized Solution
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    long long count = 0;
    int pos = 50;
    char* p = input;
    
    // Heuristic: unrolling loop slightly or just keeping it tight.
    // Tight loop is usually best for cache.
    
    while (*p) {
        // Fast skip whitespace (newlines)
        while (*p <= 32) {
            if (!*p) goto done;
            p++;
        }
        
        // 'L' (76) or 'R' (82)
        // bit 1 of 'L' (...00) is 0
        // bit 1 of 'R' (...10) is 1
        int dir_bit = (*p >> 1) & 1; // 0 for L, 1 for R
        p++;
        
        int val = 0;
        // Parse int: assume at least one digit
        do {
            val = (val * 10) + (*p - '0');
            p++;
        } while (*p >= '0');
        
        // Logic:
        // if R (dir_bit=1): pos += val
        // if L (dir_bit=0): pos -= val
        // sign = dir_bit * 2 - 1; // 1*2-1 = 1, 0*2-1 = -1.
        int sign = (dir_bit << 1) - 1;
        
        pos += sign * val;
        
        // Modulo 100
        // Using fast modulo if possible, but val is unbounded.
        // Standard mod is fine.
        pos %= 100;
        // Fix negative remainder
        // (pos >> 31) is -1 (0xFF...) if pos < 0, 0 if pos >= 0.
        // (-1) & 100 = 100.
        pos += (pos >> 31) & 100;
        
        if (pos == 0) count++;
    }
    
done:
    ;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}