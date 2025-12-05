/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Pick 12 batteries to maximize 12-digit joltage
 * Simple greedy with linear scan
 */

#include "../../tools/runner/c/common.h"

#define K 12

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    unsigned long long total = 0;

    while (*ptr) {
        char* line = ptr;
        while (*ptr >= '0') ptr++;
        int len = ptr - line;

        if (len >= K) {
            unsigned long long joltage = 0;
            int lastPos = -1;

            for (int p = 0; p < K; p++) {
                int start = lastPos + 1;
                int end = len - K + p;

                // Linear scan for max in range
                int maxIdx = start;
                char maxVal = line[start];

                for (int j = start + 1; j <= end; j++) {
                    if (line[j] > maxVal) {
                        maxVal = line[j];
                        maxIdx = j;
                    }
                }

                joltage = joltage * 10 + (maxVal - '0');
                lastPos = maxIdx;
            }

            total += joltage;
        }

        if (*ptr) ptr++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_UINT(total);
    aoc_cleanup(input);
    return 0;
}
