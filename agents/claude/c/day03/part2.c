/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Compile: clang -O3 -march=native -o part2 part2.c
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
    unsigned long long total = 0;

    for (int l = 0; l < line_count; l++) {
        const char* line = lines[l];
        int len = strlen(line);

        unsigned long long joltage = 0;
        int last_pos = -1;

        // Greedy: for each position, choose max digit and accumulate directly
        for (int p = 0; p < 12; p++) {
            int start = last_pos + 1;
            int end = len - 12 + p;

            char max_digit = '0';
            int max_pos = start;

            // Find max digit in valid range
            for (int i = start; i <= end; i++) {
                if (line[i] > max_digit) {
                    max_digit = line[i];
                    max_pos = i;
                }
            }

            // Accumulate directly: joltage = joltage * 10 + digit
            joltage = joltage * 10 + (max_digit - '0');
            last_pos = max_pos;
        }

        total += joltage;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_UINT(total);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
