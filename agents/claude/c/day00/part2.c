/**
 * 🎄 Advent of Code 2025 - Day 00 Part 2
 * Number Cruncher - Sum of products of valid pairs
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping with sum tracking
 * Uses 128-bit integers for large products
 */

#include "../../tools/runner/c/common.h"

#define MAX_K 1000000

// Group data: count, sum, and sum of squares
static long long group_count[MAX_K];
static __int128 group_sum[MAX_K];
static __int128 group_sum_sq[MAX_K];

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int n, k;
    char* ptr = input;
    n = (int)strtol(ptr, &ptr, 10);
    k = (int)strtol(ptr, &ptr, 10);

    // Reset groups
    memset(group_count, 0, k * sizeof(long long));
    memset(group_sum, 0, k * sizeof(__int128));
    memset(group_sum_sq, 0, k * sizeof(__int128));

    // Group numbers by remainder
    for (int i = 0; i < n; i++) {
        long long num = strtoll(ptr, &ptr, 10);
        int rem = ((num % k) + k) % k;
        group_count[rem]++;
        group_sum[rem] += num;
        group_sum_sq[rem] += (__int128)num * num;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    __int128 total = 0;

    // Pairs within remainder 0 group
    if (group_count[0] >= 2) {
        __int128 s = group_sum[0];
        total += (s * s - group_sum_sq[0]) / 2;
    }

    // Pairs between groups r and k-r
    for (int r = 1; r < (k + 1) / 2; r++) {
        total += group_sum[r] * group_sum[k - r];
    }

    // If K is even, pairs within K/2 group
    if (k % 2 == 0 && group_count[k / 2] >= 2) {
        __int128 s = group_sum[k / 2];
        total += (s * s - group_sum_sq[k / 2]) / 2;
    }

    AOC_TIMER_END(solve);

    // Print 128-bit integer
    char buf[64];
    if (total == 0) {
        printf("ANSWER:0\n");
    } else {
        int i = 63;
        buf[i--] = '\0';
        __int128 t = total;
        while (t > 0) {
            buf[i--] = '0' + (t % 10);
            t /= 10;
        }
        printf("ANSWER:%s\n", &buf[i + 1]);
    }

    aoc_cleanup(input);
    return 0;
}
