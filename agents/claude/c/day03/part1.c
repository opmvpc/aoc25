/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Compile: clang -O3 -march=native -o part1 part1.c
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
    long long result = 0;

    for (int l = 0; l < line_count; l++) {
        const char* line = lines[l];

        // Compute length inline to avoid strlen call
        int len = 0;
        while (line[len] >= '0' && line[len] <= '9') len++;
        if (len < 2) continue;

        // O(n) optimization: precompute max digit after each position
        int max_after[256]; // stack allocation for speed
        max_after[len - 1] = 0;

        // Build max_after array in reverse
        for (int i = len - 2; i >= 0; i--) {
            int digit = line[i + 1] - '0';
            max_after[i] = (digit > max_after[i + 1]) ? digit : max_after[i + 1];
        }

        // Find max joltage: 10 * digit[i] + max_after[i]
        int max_joltage = 0;
        for (int i = 0; i < len - 1; i++) {
            int joltage = (line[i] - '0') * 10 + max_after[i];
            if (joltage > max_joltage) {
                max_joltage = joltage;
            }
        }

        result += max_joltage;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
