/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Pick 2 batteries to maximize 2-digit joltage
 * Single pass right-to-left: O(n) time, O(1) space
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    long long total = 0;

    while (*ptr) {
        // Find line start and end
        char* lineStart = ptr;
        while (*ptr >= '0') ptr++;
        int len = ptr - lineStart;

        if (len >= 2) {
            // Single pass right-to-left
            // Start with last digit as max (first digit must have a second after it)
            int maxDigit = lineStart[len - 1] - '0';
            int best = 0;

            for (int i = len - 2; i >= 0; i--) {
                int d = lineStart[i] - '0';
                int joltage = d * 10 + maxDigit;
                if (joltage > best) best = joltage;
                if (d > maxDigit) maxDigit = d;
            }

            total += best;
        }

        // Skip newline
        if (*ptr) ptr++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
