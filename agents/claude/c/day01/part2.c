/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int position = 50;
    long long count = 0;

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
        long distance = 0;
        while ((c = *ptr) >= '0' && c <= '9') {
            distance = distance * 10 + (c - '0');
            ptr++;
        }

        // Process based on direction
        if (dir == 'L') {
            // Left rotation
            long quotient = distance / 100;
            count += quotient;
            int remainder = distance % 100;
            count += (remainder >= position) & (position != 0);
            position = (position - remainder + 100) % 100;
        } else {
            // Right rotation
            count += (position + distance) / 100;
            position = (position + distance) % 100;
        }
    }

    long long result = count;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
