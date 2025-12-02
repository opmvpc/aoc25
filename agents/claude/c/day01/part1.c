/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Manual parsing for optimal performance
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int position = 50;
    int count = 0;

    while (*ptr) {
        // Skip whitespace
        while (*ptr == ' ' || *ptr == '\t') ptr++;
        if (*ptr == '\0' || *ptr == '\r' || *ptr == '\n') {
            ptr++;
            continue;
        }

        // Parse direction
        char direction = *ptr++;

        // Parse distance using strtol (faster than atoi)
        char* end;
        int distance = (int)strtol(ptr, &end, 10);
        ptr = end;

        // Update position
        if (direction == 'L') {
            position = (position - distance % 100 + 100) % 100;
        } else {
            position = (position + distance) % 100;
        }

        // Check if at 0
        if (position == 0) {
            count++;
        }

        // Skip to next line
        while (*ptr && *ptr != '\n') ptr++;
        if (*ptr == '\n') ptr++;
    }

    long long result = count;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
