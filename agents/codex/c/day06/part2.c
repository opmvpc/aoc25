/**
 * 🎄 Advent of Code 2025 - Day 06 Part 2
 * Lean two-pass solver using split_lines (right-to-left grouping).
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    int data_rows = line_count - 1;
    char* op_row = lines[data_rows];

    int* lengths = (int*)malloc((size_t)line_count * sizeof(int));
    int max_len = 0;
    for (int i = 0; i < line_count; i++) {
        int len = (int)strlen(lines[i]);
        lengths[i] = len;
        if (len > max_len) max_len = len;
    }
    int op_len = lengths[data_rows];
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    unsigned char* used = (unsigned char*)calloc((size_t)max_len, 1);
    long long* col_val = (long long*)calloc((size_t)max_len, sizeof(long long));

    for (int r = 0; r < line_count; r++) {
        const char* line = lines[r];
        int len = lengths[r];
        for (int c = 0; c < len; c++) {
            char ch = line[c];
            if (ch != ' ') used[c] = 1;
            if (r < data_rows && ch >= '0' && ch <= '9') {
                col_val[c] = col_val[c] * 10 + (long long)(ch - '0');
            }
        }
    }

    long long total = 0;
    int col = max_len - 1;
    while (col >= 0) {
        while (col >= 0 && used[col] == 0) col--;
        if (col < 0) break;
        int end = col + 1;
        while (col >= 0 && used[col]) col--;
        int start = col + 1;

        char op = '+';
        for (int c = end - 1; c >= start; c--) {
            char ch = (c < op_len) ? op_row[c] : ' ';
            if (ch == '+' || ch == '*') {
                op = ch;
                break;
            }
        }

        long long acc = (op == '+') ? 0 : 1;
        for (int c = end - 1; c >= start; c--) {
            long long v = col_val[c];
            if (op == '+') acc += v;
            else acc *= v;
        }
        total += acc;
    }

    free(used);
    free(col_val);
    free(lengths);
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
