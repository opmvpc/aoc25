/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
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
    long long count = 0;

    while (*ptr) {
        // Skip whitespace
        while (*ptr == ' ' || *ptr == '\t') ptr++;
        if (*ptr == '\0' || *ptr == '\r' || *ptr == '\n') {
            ptr++;
            continue;
        }

        // Parse direction
        char direction = *ptr++;

        // Parse distance using strtol
        char* end;
        long distance = strtol(ptr, &end, 10);
        ptr = end;

        // Count crossings and update position
        if (direction == 'L') {
            // Count crossings for left rotation
            count += distance / 100;
            int remainder = distance % 100;
            if (remainder >= position && position != 0) {
                count++;
            }
            // Update position
            position = (position - remainder + 100) % 100;
        } else {
            // Count crossings for right rotation
            count += (position + distance) / 100;
            // Update position
            position = (position + distance) % 100;
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
