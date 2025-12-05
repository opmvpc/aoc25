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
        char* line = ptr;
        while (*ptr >= '0') ptr++;
        int len = ptr - line;

        if (len >= 2) {
            int maxRight = line[len - 1] - '0';
            int best = 0;

            for (int i = len - 2; i >= 0; i--) {
                int d = line[i] - '0';
                int joltage = d * 10 + maxRight;
                if (joltage > best) best = joltage;
                if (d > maxRight) maxRight = d;
            }

            total += best;
        }

        if (*ptr) ptr++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
