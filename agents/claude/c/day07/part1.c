/**
 * 🎄 Advent of Code 2025 - Day 07 Part 1 - FUSED PARSE+SOLVE
 * Compile: clang -O3 -march=native -o part1 part1.c
 *
 * Ultimate optimization: process splitters AS WE PARSE!
 * No intermediate storage needed.
 */

#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdint.h>

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);

    // Bitset for active columns (256 cols = 4 words)
    uint64_t active[4] = {0};

    #define SET_BIT(c) (active[(c) >> 6] |= (1ULL << ((c) & 63)))
    #define CLR_BIT(c) (active[(c) >> 6] &= ~(1ULL << ((c) & 63)))
    #define GET_BIT(c) ((active[(c) >> 6] >> ((c) & 63)) & 1)

    int width = 0;
    int split_count = 0;
    int row = 0;

    char* p = input;
    int col = 0;

    // First row: find S
    while (*p && *p != '\n') {
        if (*p == 'S') {
            SET_BIT(col);
        }
        col++;
        p++;
    }
    width = col;
    if (*p == '\n') p++;

    // Remaining rows: process splitters on the fly
    col = 0;
    while (*p) {
        if (*p == '\n') {
            col = 0;
        } else {
            if (*p == '^' && GET_BIT(col)) {
                split_count++;
                CLR_BIT(col);
                if (col > 0) SET_BIT(col - 1);
                if (col < width - 1) SET_BIT(col + 1);
            }
            col++;
        }
        p++;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(split_count);
    aoc_cleanup(input);
    return 0;
}
