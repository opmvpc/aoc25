/**
 * 🎄 Advent of Code 2025 - Day 07 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);

    int width = 0;
    int start_row = 0;
    int start_col = 0;

    for (int r = 0; r < line_count; r++) {
        const char* line = lines[r];
        int len = (int)strlen(line);
        for (int c = 0; c < len; c++) {
            if (line[c] == 'S') {
                start_row = r;
                start_col = c;
            }
        }
        if (len > width) {
            width = len;
        }
    }
    int segments = (width + 63) >> 6;
    uint64_t last_mask = (width & 63) ? ((1ULL << (width & 63)) - 1ULL) : ~0ULL;
    uint64_t* row_masks = (uint64_t*)calloc((size_t)line_count * segments, sizeof(uint64_t));
    for (int r = 0; r < line_count; r++) {
        const char* row = lines[r];
        uint64_t* mask = row_masks + (size_t)r * segments;
        for (int c = 0; row[c] != '\0'; c++) {
            if (row[c] == '^') {
                mask[c >> 6] |= 1ULL << (c & 63);
            }
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    uint64_t* active = (uint64_t*)calloc((size_t)segments, sizeof(uint64_t));
    uint64_t* split = (uint64_t*)calloc((size_t)segments, sizeof(uint64_t));
    uint64_t* left = (uint64_t*)calloc((size_t)segments, sizeof(uint64_t));
    uint64_t* right = (uint64_t*)calloc((size_t)segments, sizeof(uint64_t));

    active[start_col >> 6] = 1ULL << (start_col & 63);
    long long splits = 0;

    for (int r = start_row + 1; r < line_count; r++) {
        const uint64_t* row_mask = row_masks + (size_t)r * segments;

        for (int i = 0; i < segments; i++) {
            uint64_t s = active[i] & row_mask[i];
            split[i] = s;
            splits += __builtin_popcountll(s);
        }

        uint64_t carry = 0;
        for (int i = segments - 1; i >= 0; i--) {
            uint64_t s = split[i];
            left[i] = (s >> 1) | carry;
            carry = (s & 1ULL) ? 0x8000000000000000ULL : 0;
        }

        carry = 0;
        for (int i = 0; i < segments; i++) {
            uint64_t s = split[i];
            right[i] = (s << 1) | carry;
            carry = s >> 63;
        }
        right[segments - 1] &= last_mask;

        uint64_t any = 0;
        for (int i = 0; i < segments; i++) {
            uint64_t stay = active[i] & ~row_mask[i];
            uint64_t nxt = stay | left[i] | right[i];
            if (i == segments - 1) nxt &= last_mask;
            active[i] = nxt;
            any |= nxt;
        }
        if (any == 0) break;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(splits);

    free(active);
    free(split);
    free(left);
    free(right);
    free(row_masks);
    free(lines);
    aoc_cleanup(input);
    return 0;
}
