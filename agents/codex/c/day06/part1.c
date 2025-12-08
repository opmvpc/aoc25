/**
 * 🎄 Advent of Code 2025 - Day 06 Part 1
 * Lean two-pass solver using split_lines.
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    int last_idx = line_count - 1;
    char* last_line = lines[last_idx];

    int* lengths = (int*)malloc((size_t)line_count * sizeof(int));
    int max_len = 0;
    for (int i = 0; i < line_count; i++) {
        int len = (int)strlen(lines[i]);
        lengths[i] = len;
        if (len > max_len) max_len = len;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    unsigned char* col_used = (unsigned char*)calloc((size_t)max_len, 1);
    for (int r = 0; r < line_count; r++) {
        const char* line = lines[r];
        int len = lengths[r];
        for (int c = 0; c < len; c++) {
            if (line[c] != ' ') col_used[c] = 1;
        }
    }

    long long total = 0;
    int col = 0;
    while (col < max_len) {
        while (col < max_len && col_used[col] == 0) col++;
        if (col >= max_len) break;
        int start = col;
        while (col < max_len && col_used[col]) col++;
        int end = col;

        char op = '+';
        int last_len = lengths[last_idx];
        for (int c = start; c < end; c++) {
            char ch = (c < last_len) ? last_line[c] : ' ';
            if (ch == '+' || ch == '*') {
                op = ch;
                break;
            }
        }

        long long acc = (op == '+') ? 0 : 1;
        for (int r = 0; r < last_idx; r++) {
            const char* line = lines[r];
            int len = lengths[r];
            long long val = 0;
            int has = 0;
            for (int c = start; c < end && c < len; c++) {
                char ch = line[c];
                if (ch >= '0' && ch <= '9') {
                    val = val * 10 + (long long)(ch - '0');
                    has = 1;
                }
            }
            if (has) {
                if (op == '+') acc += val;
                else acc *= val;
            }
        }

        total += acc;
    }

    free(col_used);
    free(lengths);
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
