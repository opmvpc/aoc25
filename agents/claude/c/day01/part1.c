/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int position = 50;
    int count = 0;

    char c;
    while ((c = *ptr)) {
        // Skip whitespace
        if (c <= ' ') {
            ptr++;
            continue;
        }

        // Parse direction
        char dir = c;
        ptr++;

        // Parse distance
        int distance = 0;
        while ((c = *ptr) >= '0' && c <= '9') {
            distance = distance * 10 + (c - '0');
            ptr++;
        }

        // Update position
        if (dir == 'L') {
            position = (position - distance % 100 + 100) % 100;
        } else {
            position = (position + distance) % 100;
        }

        // Count zeros
        count += (position == 0);
    }

    long long result = count;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
