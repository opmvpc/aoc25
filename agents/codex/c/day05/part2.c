/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct {
    int64_t s;
    int64_t e;
} Range;

static void sort_ranges(Range* a, int left, int right) {
    int i = left;
    int j = right;
    const int64_t pivot = a[(left + right) >> 1].s;
    while (i <= j) {
        while (a[i].s < pivot) i++;
        while (a[j].s > pivot) j--;
        if (i <= j) {
            const Range tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
            i++;
            j--;
        }
    }
    if (left < j) sort_ranges(a, left, j);
    if (i < right) sort_ranges(a, i, right);
}

// Single-pass parser: reads ranges only; ignores numbers after blank line.
static void parse_input_fast(const char* s, size_t len, int64_t** ranges_out, int* range_cnt_out) {
    const size_t cap = (len >> 1) + 2;
    int64_t* buf = (int64_t*)malloc(cap * sizeof(int64_t));
    int idx = 0;
    int split_idx = -1;
    int64_t num = 0;
    int in_num = 0;
    int after_blank = 0;
    int prev_nl = 0;

    for (size_t i = 0; i <= len; i++) {
        const char c = (i < len) ? s[i] : '\n';
        if (c >= '0' && c <= '9') {
            if (!after_blank) {
                num = num * 10 + (c - '0');
                in_num = 1;
            }
            prev_nl = 0;
        } else {
            if (in_num && !after_blank) {
                buf[idx++] = num;
                num = 0;
                in_num = 0;
            }
            if (c == '\n' || c == '\r') {
                if (prev_nl && !after_blank) {
                    split_idx = idx;
                    after_blank = 1;
                }
                prev_nl = 1;
            } else {
                prev_nl = 0;
            }
        }
    }

    if (split_idx == -1) split_idx = idx;
    *ranges_out = buf;
    *range_cnt_out = split_idx >> 1;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int64_t* flat;
    int range_count;
    parse_input_fast(input, strlen(input), &flat, &range_count);
    int64_t* buf_base = flat;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;

    if (range_count > 0) {
        Range* ranges = (Range*)flat; // reuse buffer, first 2*range_count entries

        sort_ranges(ranges, 0, range_count - 1);

        int64_t ms = ranges[0].s;
        int64_t me = ranges[0].e;
        for (int i = 1; i < range_count; i++) {
            const int64_t s = ranges[i].s;
            const int64_t e = ranges[i].e;
            if (s <= me + 1) {
                if (e > me) me = e;
            } else {
                result += (me - ms + 1);
                ms = s;
                me = e;
            }
        }
        result += (me - ms + 1);
    }

    if (buf_base) free(buf_base);
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
