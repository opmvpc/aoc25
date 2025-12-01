/**
 * 🎄 Advent of Code 2025 - Day 00 Part 1
 * Number Cruncher - Count pairs with sum divisible by K
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping
 * Uses fixed-size array for remainders (faster than hash map)
 */

#include "../../tools/runner/c/common.h"

#define MAX_K 1000000

static long long remainder_count[MAX_K];

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int n, k;
    char* ptr = input;
    n = (int)strtol(ptr, &ptr, 10);
    k = (int)strtol(ptr, &ptr, 10);

    // Reset remainder counts
    memset(remainder_count, 0, k * sizeof(long long));

    // Count numbers by remainder
    for (int i = 0; i < n; i++) {
        long long num = strtoll(ptr, &ptr, 10);
        int rem = ((num % k) + k) % k;
        remainder_count[rem]++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long pairs = 0;

    // Pairs where both have remainder 0
    long long c0 = remainder_count[0];
    pairs += (c0 * (c0 - 1)) / 2;

    // Pairs where remainders sum to K
    for (int r = 1; r < (k + 1) / 2; r++) {
        pairs += remainder_count[r] * remainder_count[k - r];
    }

    // If K is even, pairs where both have remainder K/2
    if (k % 2 == 0) {
        long long ch = remainder_count[k / 2];
        pairs += (ch * (ch - 1)) / 2;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(pairs);

    aoc_cleanup(input);
    return 0;
}
