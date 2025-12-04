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

    uint8_t* grid = NULL;
    if (grid_size > 0) {
        grid = (uint8_t*)calloc(grid_size, sizeof(uint8_t));
        if (!grid) {
            fprintf(stderr, "ERROR:Failed to allocate grid\n");
            aoc_cleanup(input);
            return 1;
        }

        char* p = input;
        for (int r = 1; r <= height; r++) {
            size_t idx = (size_t)r * stride + 1;
            int c = 0;
            while (*p && *p != '\n' && c < width) {
                grid[idx++] = (*p == '@');
                p++;
                c++;
            }
            while (*p && *p != '\n') p++;
            if (*p == '\n') p++;
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long removed = 0;

    if (grid) {
        uint8_t* deg = (uint8_t*)calloc(grid_size, sizeof(uint8_t));
        int* queue = (int*)malloc(grid_size * sizeof(int));
        if (!deg || !queue) {
            fprintf(stderr, "ERROR:Failed to allocate buffers\n");
            free(grid);
            free(deg);
            free(queue);
            aoc_cleanup(input);
            return 1;
        }

        int head = 0, tail = 0;

        // Precompute neighbor counts and seed queue
        for (int r = 1; r <= height; r++) {
            size_t base = (size_t)r * stride;
            for (int c = 1; c <= width; c++) {
                size_t pos = base + (size_t)c;
                if (grid[pos] == 0) continue;

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
                if (neighbors < 4) queue[tail++] = (int)pos;
            }
        }

        const int offsets[8] = { -stride - 1, -stride, -stride + 1, -1, 1, stride - 1, stride, stride + 1 };

        while (head < tail) {
            size_t pos = (size_t)queue[head++];
            if (grid[pos] == 0) continue;

            grid[pos] = 0;
            removed++;

            for (int i = 0; i < 8; i++) {
                size_t npos = pos + (size_t)offsets[i];
                if (grid[npos]) {
                    uint8_t nd = --deg[npos];
                    if (nd == 3) queue[tail++] = (int)npos;
                }
            }
        }

        free(deg);
        free(queue);
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(removed);

    free(grid);
    aoc_cleanup(input);
    return 0;
}
