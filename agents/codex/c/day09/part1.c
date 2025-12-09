/**
 * 🎄 Advent of Code 2025 - Day 09 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    size_t len = strlen(input);

    AOC_TIMER_START(parse);
    // Count points to allocate once.
    int point_count = 0;
    for (size_t i = 0; i < len; i++) {
        if (input[i] == '\n') point_count++;
    }
    if (len > 0 && input[len - 1] != '\n') point_count++;  // last line without newline

    int* xs = (int*)malloc((size_t)point_count * sizeof(int));
    int* ys = (int*)malloc((size_t)point_count * sizeof(int));

    // Manual parsing: numbers formatted as "x,y" per line, possibly negative.
    int idx = 0;
    int val = 0;
    int sign = 1;
    int parsing_x = 1;
    for (size_t i = 0; i <= len; i++) {
        char c = (i == len) ? '\n' : input[i];
        if (c == '-') {
            sign = -1;
        } else if (c >= '0' && c <= '9') {
            val = val * 10 + (c - '0');
        } else if (c == ',') {
            xs[idx] = sign * val;
            val = 0;
            sign = 1;
            parsing_x = 0;
        } else {
            if (!parsing_x) {
                ys[idx] = sign * val;
                idx++;
            }
            val = 0;
            sign = 1;
            parsing_x = 1;
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long best = 0;
    for (int i = 0; i < idx; i++) {
        const int xi = xs[i];
        const int yi = ys[i];
        for (int j = i + 1; j < idx; j++) {
            int dx = xs[j] - xi;
            if (dx < 0) dx = -dx;
            int dy = ys[j] - yi;
            if (dy < 0) dy = -dy;
            long long area = (long long)(dx + 1) * (long long)(dy + 1);
            if (area > best) best = area;
        }
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(best);

    free(xs);
    free(ys);
    aoc_cleanup(input);
    return 0;
}
