/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef unsigned long long u64;
typedef __int128 u128;

// Calculate sum of invalid IDs <= limit
// Uses u128 internally to prevent overflow during summation logic
static u64 calc_sum(u64 limit) {
    if (limit < 11) return 0;

    u128 total = 0;
    int L = 1;

    while (1) {
        u64 power_of_10 = 1;
        for (int i = 0; i < L; i++) power_of_10 *= 10;
        
        u64 multiplier = power_of_10 + 1;
        u64 min_x = power_of_10 / 10;
        u64 max_x = power_of_10 - 1;
        
        // Check if the smallest number of this length exceeds limit
        // min_val = min_x * multiplier
        // Check for overflow or limit exceed
        if ((u128)min_x * multiplier > limit) break;

        u64 limit_x = limit / multiplier;
        u64 effective_max_x = (limit_x < max_x) ? limit_x : max_x;

        if (effective_max_x >= min_x) {
            u64 count = effective_max_x - min_x + 1;
            // Sum of arithmetic progression: count * (min + max) / 2
            // (min_x + effective_max_x) can be up to 2 * 10^9, fits in u64
            // count fits in u64
            // product might exceed u64, use u128
            u128 sum_x = ((u128)(min_x + effective_max_x) * count) / 2;
            total += sum_x * multiplier;
        }

        L++;
        // Safety break if power_of_10 overflows u64 (approx 19 digits)
        if (L > 18) break; 
    }

    return (u64)total;
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    u64 total_sum = 0;
    char* p = input;
    
    while (*p) {
        // Skip non-digits
        while (*p && (*p < '0' || *p > '9')) p++;
        if (!*p) break;
        
        // Parse min
        u64 min_val = 0;
        while (*p >= '0' && *p <= '9') {
            min_val = min_val * 10 + (*p++ - '0');
        }
        
        // Expect '-'
        if (*p == '-') p++;
        
        // Parse max
        u64 max_val = 0;
        while (*p >= '0' && *p <= '9') {
            max_val = max_val * 10 + (*p++ - '0');
        }
        
        total_sum += calc_sum(max_val) - calc_sum(min_val - 1);
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_UINT(total_sum);
    aoc_cleanup(input);
    return 0;
}