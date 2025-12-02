/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Manual parsing: input lines are <L|R><distance>
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int position = 50;
    int hits = 0;

    while (*ptr) {
        char dir = *ptr++; // 'L' or 'R'
        int value = 0;

        // Parse distance
        while (*ptr >= '0' && *ptr <= '9') {
            value = value * 10 + (*ptr - '0');
            ptr++;
        }

        // Skip newline characters (\r?\n)
        if (*ptr == '\r') ptr++;
        if (*ptr == '\n') ptr++;

        const int step = value % 100; // dial size
        if (dir == 'L') {
            position -= step;
            if (position < 0) position += 100;
        } else { // 'R'
            position += step;
            if (position >= 100) position -= 100;
        }

        if (position == 0) hits++;
    }

    long long result = hits;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
