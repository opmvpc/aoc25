/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
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
    // TODO: Implement solution
    long long result = 0;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
