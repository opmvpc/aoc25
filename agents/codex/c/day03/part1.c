/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Compile: clang -O3 -march=native -flto -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Nothing heavy to parse; operate directly on the raw buffer.
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;
    char* p = input;
    while (*p) {
        // locate line bounds
        char* start = p;
        while (*p && *p != '\n' && *p != '\r') p++;
        char* end = p;

        if (end - start >= 2) {
            int bestFirst = *start - '0';
            int bestPair = 0;
            for (char* q = start + 1; q < end; ++q) {
                int d = *q - '0';
                int cand = bestFirst * 10 + d;
                if (cand > bestPair) bestPair = cand;
                if (d > bestFirst) bestFirst = d;
            }
            result += bestPair;
        }

        // skip newline sequence
        while (*p == '\n' || *p == '\r') p++;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
