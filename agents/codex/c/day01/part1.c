/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int pos = 50;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long hits = 0;
    char* p = input;

    while (*p) {
        char dir = *p++;
        int dist = 0;
        while (*p >= '0' && *p <= '9') {
            dist = dist * 10 + (*p - '0');
            p++;
        }
        while (*p == '\n' || *p == '\r') p++;

        int step = dist % 100;
        if (dir == 'R') {
            pos += step;
            if (pos >= 100) pos -= 100;
        } else {
            pos -= step;
            if (pos < 0) pos += 100;
        }

        if (pos == 0) hits++;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(hits);

    aoc_cleanup(input);
    return 0;
}
