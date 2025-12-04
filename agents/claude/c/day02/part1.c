/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Find IDs that are pattern repeated exactly twice
 * Uses arithmetic sequence sum formula for O(1) per range
 */

#include "../../tools/runner/c/common.h"

static long long POW10[20];

static inline void init_pow10(void) {
    POW10[0] = 1;
    for (int i = 1; i < 20; i++) POW10[i] = POW10[i-1] * 10;
}

static inline int count_digits(long long n) {
    if (n < 10) return 1;
    if (n < 100) return 2;
    if (n < 1000) return 3;
    if (n < 10000) return 4;
    if (n < 100000) return 5;
    if (n < 1000000) return 6;
    if (n < 10000000) return 7;
    if (n < 100000000) return 8;
    if (n < 1000000000) return 9;
    if (n < 10000000000LL) return 10;
    int c = 10;
    n /= 10000000000LL;
    while (n) { c++; n /= 10; }
    return c;
}

int main(void) {
    init_pow10();
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    long long sum = 0;

    while (*ptr) {
        // Skip non-digits
        while (*ptr && (*ptr < '0' || *ptr > '9')) ptr++;
        if (!*ptr) break;

        // Fast parse start
        long long start = 0;
        while (*ptr >= '0' && *ptr <= '9') {
            start = start * 10 + (*ptr++ - '0');
        }

        // Skip dash
        while (*ptr == '-') ptr++;

        // Fast parse end
        long long endNum = 0;
        while (*ptr >= '0' && *ptr <= '9') {
            endNum = endNum * 10 + (*ptr++ - '0');
        }

        int startLen = count_digits(start);
        int endLen = count_digits(endNum);

        for (int totalLen = startLen; totalLen <= endLen; totalLen++) {
            if (totalLen & 1) continue; // Must be even

            int patternLen = totalLen >> 1;
            long long multiplier = POW10[patternLen] + 1;
            long long minPattern = POW10[patternLen - 1];
            long long maxPattern = POW10[patternLen] - 1;

            // Clamp to range
            long long minFromStart = (start + multiplier - 1) / multiplier;
            long long maxFromEnd = endNum / multiplier;
            if (minFromStart > minPattern) minPattern = minFromStart;
            if (maxFromEnd < maxPattern) maxPattern = maxFromEnd;

            if (minPattern <= maxPattern) {
                // Arithmetic sum: n * (first + last) / 2
                long long n = maxPattern - minPattern + 1;
                long long first = minPattern * multiplier;
                long long last = maxPattern * multiplier;
                sum += n * (first + last) / 2;
            }
        }
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(sum);
    aoc_cleanup(input);
    return 0;
}
