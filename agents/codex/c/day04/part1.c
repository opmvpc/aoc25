/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int width = 0;
    while (input[width] && input[width] != '\n') width++;

    int height = 0;
    if (input[0] != '\0') {
        char* p = input;
        while (*p) {
            height++;
            while (*p && *p != '\n') p++;
            if (*p == '\n') p++;
        }
    }

    const int stride = width + 2; // padded grid avoids bounds checks
    const size_t grid_rows = (size_t)height + 2;
    const size_t grid_size = (size_t)stride * grid_rows;

    uint8_t* grid = NULL;
    if (grid_size > 0) {
        grid = (uint8_t*)calloc(grid_size, sizeof(uint8_t));
        if (!grid) {
            fprintf(stderr, "ERROR:Failed to allocate grid\n");
            aoc_cleanup(input);
            return 1;
        }

        char* p = input;
        int r = 1;
        while (*p && r <= height) {
            size_t idx = (size_t)r * stride + 1;
            int c = 0;
            while (*p && *p != '\n' && c < width) {
                grid[idx++] = (*p == '@');
                p++;
                c++;
            }
            while (*p && *p != '\n') p++; // skip any trailing characters if present
            if (*p == '\n') p++;
            r++;
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;
    if (grid) {
        for (int r = 1; r <= height; r++) {
            size_t row_base = (size_t)r * stride;
            for (int c = 1; c <= width; c++) {
                size_t pos = row_base + (size_t)c;
                if (grid[pos] == 0) continue;

                int neighbors =
                    grid[pos - stride - 1] +
                    grid[pos - stride] +
                    grid[pos - stride + 1] +
                    grid[pos - 1] +
                    grid[pos + 1] +
                    grid[pos + stride - 1] +
                    grid[pos + stride] +
                    grid[pos + stride + 1];

                if (neighbors < 4) result++;
            }
        }
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(grid);
    aoc_cleanup(input);
    return 0;
}
