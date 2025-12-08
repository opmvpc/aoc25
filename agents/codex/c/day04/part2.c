/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
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

    const int stride = width + 2; // padded border
    const size_t grid_rows = (size_t)height + 2;
    const size_t grid_size = grid_rows * (size_t)stride;

    if (grid_size == 0) {
        AOC_RESULT_INT(0);
        aoc_cleanup(input);
        return 0;
    }

    uint8_t* grid = (uint8_t*)calloc(grid_size, 1);
    int grid_cap = (int)grid_size;
    uint16_t* active = (uint16_t*)malloc((size_t)grid_cap * sizeof(uint16_t));
    int active_len = 0;
    if (!grid || !active) {
        fprintf(stderr, "ERROR:Failed to allocate buffers\n");
        free(grid);
        free(active);
        aoc_cleanup(input);
        return 1;
    }

    char* p = input;
    for (int r = 1; r <= height; r++) {
        size_t idx = (size_t)r * stride + 1;
        int c = 0;
        while (*p && *p != '\n' && c < width) {
            if (*p == '@') {
                grid[idx] = 1;
                active[active_len++] = (uint16_t)idx;
            }
            idx++;
            p++;
            c++;
        }
        while (*p && *p != '\n') p++;
        if (*p == '\n') p++;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    uint8_t* deg = (uint8_t*)calloc(grid_size, 1);
    uint16_t* queue = (uint16_t*)malloc((size_t)active_len * sizeof(uint16_t));
    if (!deg || !queue) {
        fprintf(stderr, "ERROR:Failed to allocate buffers\n");
        free(grid);
        free(active);
        free(deg);
        free(queue);
        aoc_cleanup(input);
        return 1;
    }

    int head = 0, tail = 0;
    for (int i = 0; i < active_len; i++) {
        size_t pos = (size_t)active[i];
        uint8_t neighbors =
            grid[pos - stride - 1] +
            grid[pos - stride] +
            grid[pos - stride + 1] +
            grid[pos - 1] +
            grid[pos + 1] +
            grid[pos + stride - 1] +
            grid[pos + stride] +
            grid[pos + stride + 1];

        deg[pos] = neighbors;
        if (neighbors < 4) queue[tail++] = (uint16_t)pos;
    }

    const int offsets[8] = { -stride - 1, -stride, -stride + 1, -1, 1, stride - 1, stride, stride + 1 };
    long long removed = 0;

    while (head < tail) {
        size_t pos = (size_t)queue[head++];
        if (grid[pos] == 0) continue;

        grid[pos] = 0;
        removed++;

        for (int i = 0; i < 8; i++) {
            size_t npos = pos + (size_t)offsets[i];
            if (grid[npos]) {
                uint8_t nd = --deg[npos];
                if (nd == 3) queue[tail++] = (uint16_t)npos;
            }
        }
    }

    free(deg);
    free(queue);
    free(active);
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(removed);

    free(grid);
    aoc_cleanup(input);
    return 0;
}
