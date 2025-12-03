/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Nothing heavy to parse; operate directly on the raw buffer.
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;
    char* ptr = input;

    while (*ptr) {
        // Skip newline characters (handles possible trailing newline).
        while (*ptr == '\n' || *ptr == '\r') ptr++;
        if (*ptr == '\0') break;

        char* line_start = ptr;
        char* line_end = ptr;
        while (*line_end && *line_end != '\n' && *line_end != '\r') line_end++;

        // Need at least two digits to form a pair.
        if (line_end - line_start >= 2) {
            int best_second = line_end[-1] - '0';
            int best_pair = 0;
            for (char* r = line_end - 2; r >= line_start; --r) {
                int d = *r - '0';
                int cand = d * 10 + best_second;
                if (cand > best_pair) best_pair = cand;
                if (d > best_second) best_second = d;
            }
            result += best_pair;
        }

        ptr = line_end;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
