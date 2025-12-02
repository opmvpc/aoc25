/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Parse input
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int position = 50;
    long long result = 0;

    for (int i = 0; i < line_count; i++) {
        char direction = lines[i][0];
        int distance = atoi(&lines[i][1]);

        if (direction == 'L') {
            position = ((position - distance) % 100 + 100) % 100;
        } else {
            position = (position + distance) % 100;
        }

        if (position == 0) {
            result++;
        }
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
