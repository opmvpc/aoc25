/**
 * 🎄 Advent of Code 2025 - Day 07 Part 2 - FUSED PARSE+SOLVE
 * Compile: clang -O3 -march=native -ffast-math -o part2 part2.c
 *
 * Ultimate optimization: process splitters AS WE PARSE!
 * Single pass through the input.
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

#define MAX_COLS 256

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);

    static long long timelines[MAX_COLS];
    memset(timelines, 0, sizeof(timelines));

    int width = 0;

    char* p = input;
    int col = 0;

    // First row: find S
    while (*p && *p != '\n') {
        if (*p == 'S') {
            timelines[col] = 1;
        }
        col++;
        p++;
    }
    width = col;
    if (*p == '\n') p++;

    // Remaining rows: process splitters on the fly
    // Need to be careful: splitters on same row can interfere
    // Process left-to-right, but need temp storage for this row's splits

    col = 0;
    while (*p) {
        if (*p == '\n') {
            col = 0;
        } else {
            if (*p == '^') {
                long long t = timelines[col];
                if (t > 0) {
                    timelines[col] = 0;
                    if (col > 0) timelines[col - 1] += t;
                    if (col < width - 1) timelines[col + 1] += t;
                }
            }
            col++;
        }
        p++;
    }

    // Sum
    long long total = 0;
    for (int c = 0; c < width; c++) {
        total += timelines[c];
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
