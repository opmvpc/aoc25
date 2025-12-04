/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * Count rolls (@) with fewer than 4 neighbors
 */

#include "../../tools/runner/c/common.h"

#define MAX_SIZE 256

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);

    // Find grid dimensions
    int cols = 0;
    while (input[cols] && input[cols] != '\n') cols++;
    int rows = 0;
    char* ptr = input;
    while (*ptr) {
        if (*ptr == '\n') rows++;
        ptr++;
    }
    if (ptr > input && *(ptr-1) != '\n') rows++;

    // Direct pointer access to grid
    // Each row is cols+1 chars (including newline)
    int stride = cols + 1;

    int count = 0;

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (input[r * stride + c] != '@') continue;

            // Count neighbors (8 directions) - unrolled for speed
            int neighbors = 0;

            // Top row
            if (r > 0) {
                if (c > 0 && input[(r-1) * stride + c - 1] == '@') neighbors++;
                if (input[(r-1) * stride + c] == '@') neighbors++;
                if (c < cols-1 && input[(r-1) * stride + c + 1] == '@') neighbors++;
            }
            // Middle row
            if (c > 0 && input[r * stride + c - 1] == '@') neighbors++;
            if (c < cols-1 && input[r * stride + c + 1] == '@') neighbors++;
            // Bottom row
            if (r < rows-1) {
                if (c > 0 && input[(r+1) * stride + c - 1] == '@') neighbors++;
                if (input[(r+1) * stride + c] == '@') neighbors++;
                if (c < cols-1 && input[(r+1) * stride + c + 1] == '@') neighbors++;
            }

            if (neighbors < 4) count++;
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
