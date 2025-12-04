/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Optimized Solution - Method 0x434C49434B (CLICK)
 */

#include "../../tools/runner/c/common.h"

// Branchless floor division by 100 for signed integers
// floor(n / 100)
static inline long floor_div_100(long n) {
    long q = n / 100;
    long r = n % 100;
    // If remainder is negative, we need to subtract 1 from quotient
    // (r >> 63) is -1 (all ones) if r < 0, 0 otherwise (for 64-bit long)
    return q + (r >> 63);
}

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    long long count = 0;
    long pos = 50;
    char* p = input;
    
    while (*p) {
        // Fast skip whitespace
        while (*p <= 32) {
            if (!*p) goto done;
            p++;
        }
        
        // 'L' (76) or 'R' (82)
        // bit 1 of 'L' (...00) is 0
        // bit 1 of 'R' (...10) is 1
        int is_R = (*p >> 1) & 1; // 0 for L, 1 for R
        p++;
        
        long val = 0;
        do {
            val = (val * 10) + (*p - '0');
            p++;
        } while (*p >= '0');
        
        if (is_R) {
            // R: positive direction
            // Count = floor((pos + val)/100)
            // pos is in [0, 99], val >= 0 -> pos+val >= 0. Integer div is floor.
            count += (pos + val) / 100;
            
            pos += val;
        } else {
            // L: negative direction
            // Count = floor((pos - 1)/100) - floor((pos - val - 1)/100)
            
            // floor((pos - 1)/100):
            // if pos > 0 (1..99), pos-1 in 0..98 -> floor is 0.
            // if pos == 0, pos-1 is -1 -> floor is -1.
            // So term1 is -1 if pos==0, else 0.
            long term1 = (pos == 0) ? -1 : 0; // Branchless: (pos == 0) is 0 or 1. -1 * (pos==0)? No, -(pos==0).
            // long term1 = -(pos == 0); 
            
            long dest = pos - val - 1;
            // term2 = floor(dest / 100)
            long term2 = floor_div_100(dest);
            
            count += term1 - term2;
            
            pos -= val;
        }
        
        // Update pos modulo 100
        pos %= 100;
        // Fix negative remainder
        pos += (pos >> 63) & 100;
    }
    
done:
    ;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
