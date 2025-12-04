/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Sum of "repeated twice" numbers in ranges
 */

#include "../../tools/runner/c/common.h"

// 128-bit integer support for large sums
typedef unsigned __int128 u128;

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    u128 total = 0;
    char* p = input;
    
    while (*p) {
        // Skip non-digits (newlines, etc)
        while (*p && !(*p >= '0' && *p <= '9')) p++;
        if (!*p) break;
        
        // Parse A
        u128 A = 0;
        while (*p >= '0' && *p <= '9') {
            A = A * 10 + (*p - '0');
            p++;
        }
        
        // Expect '-'
        if (*p == '-') p++;
        
        // Parse B
        u128 B = 0;
        while (*p >= '0' && *p <= '9') {
            B = B * 10 + (*p - '0');
            p++;
        }
        
        // Process range [A, B]
        // Find all invalid IDs (X repeated twice)
        // N = X * (10^L + 1). Length of N is 2L.
        // We iterate L. Max range ~10^18 implies L <= 9.
        // But let's go safely up to L=10.
        
        for (int L = 1; L <= 10; L++) {
            u128 powerOf10 = 1;
            for (int k = 0; k < L; k++) powerOf10 *= 10;
            
            u128 multiplier = powerOf10 + 1;
            u128 minX = powerOf10 / 10;
            if (minX == 0) minX = 1; // Should not happen for L>=1 as powerOf10>=10
            if (L == 1) minX = 1; // Explicitly 1..9
            
            u128 maxX = powerOf10 - 1;
            
            // We need k * multiplier in [A, B]
            // k * M >= A  =>  k >= (A + M - 1) / M
            // k * M <= B  =>  k <= B / M
            
            u128 k_min_needed = (A + multiplier - 1) / multiplier;
            u128 k_max_needed = B / multiplier;
            
            u128 k_start = (k_min_needed > minX) ? k_min_needed : minX;
            u128 k_end = (k_max_needed < maxX) ? k_max_needed : maxX;
            
            if (k_start <= k_end) {
                u128 count = k_end - k_start + 1;
                u128 sumK = (k_start + k_end) * count / 2;
                total += sumK * multiplier;
            }
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT((long long)total);
    aoc_cleanup(input);
    return 0;
}