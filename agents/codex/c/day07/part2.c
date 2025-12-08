/**
 * 🎄 Advent of Code 2025 - Day 07 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int width = 0;
    int start_row = 0;
    int start_col = 0;
    int col = 0;
    int row = 0;
    for (char* p = input;; p++) {
        char ch = *p;
        if (ch == '\n' || ch == '\0') {
            if (col > width) width = col;
            row++;
            col = 0;
            if (ch == '\0') break;
            continue;
        }
        if (ch == 'S') {
            start_row = row;
            start_col = col;
        }
        col++;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    uint64_t* counts_a = (uint64_t*)calloc((size_t)width, sizeof(uint64_t));
    uint64_t* counts_b = (uint64_t*)calloc((size_t)width, sizeof(uint64_t));
    uint16_t* list_a = (uint16_t*)malloc((size_t)width * sizeof(uint16_t));
    uint16_t* list_b = (uint16_t*)malloc((size_t)width * sizeof(uint16_t));

    uint64_t* curr = counts_a;
    uint64_t* next = counts_b;
    uint16_t* curr_list = list_a;
    uint16_t* next_list = list_b;
    int curr_len = 0;

    curr[start_col] = 1;
    curr_list[curr_len++] = (uint16_t)start_col;

    uint64_t outside = 0;

    row = 0;
    for (char* p = input; curr_len > 0;) {
        char* row_start = p;
        int len = 0;
        while (*p != '\n' && *p != '\0') {
            p++;
            len++;
        }

        if (row > start_row) {
            int next_len = 0;
            for (int i = 0; i < curr_len; i++) {
                int c = curr_list[i];
                uint64_t cnt = curr[c];
                char cell = (c < len) ? row_start[c] : '.';
                if (cell == '^') {
                    int left = c - 1;
                    int right = c + 1;
                    if (left >= 0) {
                        if (next[left] == 0) next_list[next_len++] = (uint16_t)left;
                        next[left] += cnt;
                    } else {
                        outside += cnt;
                    }
                    if (right < width) {
                        if (next[right] == 0) next_list[next_len++] = (uint16_t)right;
                        next[right] += cnt;
                    } else {
                        outside += cnt;
                    }
                } else {
                    if (next[c] == 0) next_list[next_len++] = (uint16_t)c;
                    next[c] += cnt;
                }
            }

            for (int i = 0; i < curr_len; i++) {
                curr[curr_list[i]] = 0;
            }

            uint64_t* tmp_c = curr;
            curr = next;
            next = tmp_c;

            uint16_t* tmp_l = curr_list;
            curr_list = next_list;
            next_list = tmp_l;

            curr_len = next_len;
        }

        row++;
        if (*p == '\0') break;
        p++;
    }

    uint64_t total = outside;
    for (int i = 0; i < curr_len; i++) {
        total += curr[curr_list[i]];
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_UINT(total);

    free(counts_a);
    free(counts_b);
    free(list_a);
    free(list_b);
    aoc_cleanup(input);
    return 0;
}
