/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2 - ULTRA OPTIMIZED v2
 * Count total unique IDs covered by merged ranges
 * Techniques: fast parsing, shell sort, single-pass merge+sum
 * Compile: clang -O3 -march=native -o part2 part2.c
 */

#include "../../tools/runner/c/common.h"

#define MAX_RANGES 256

static long long starts[MAX_RANGES];
static long long ends[MAX_RANGES];

int main(void) {
    char* input = aoc_read_input();
    const char* p = input;

    AOC_TIMER_START(parse);

    int n = 0;

    // Parse ranges - fast loop
    while (*p >= '0') {
        long long start = 0;
        do { start = start * 10 + (*p - '0'); } while (*++p >= '0');
        p++;
        long long end = 0;
        do { end = end * 10 + (*p - '0'); } while (*++p >= '0');
        starts[n] = start;
        ends[n] = end;
        n++;
        p++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    // Shell sort - faster than insertion for n=172
    static const int gaps[] = {57, 23, 10, 4, 1};
    for (int g = 0; g < 5; g++) {
        int gap = gaps[g];
        for (int i = gap; i < n; i++) {
            long long ts = starts[i], te = ends[i];
            int j = i;
            while (j >= gap && starts[j - gap] > ts) {
                starts[j] = starts[j - gap];
                ends[j] = ends[j - gap];
                j -= gap;
            }
            starts[j] = ts;
            ends[j] = te;
        }
    }

    // Merge and sum in one pass
    long long total = 0;
    long long cur_start = starts[0];
    long long cur_end = ends[0];

    for (int i = 1; i < n; i++) {
        if (starts[i] <= cur_end + 1) {
            if (ends[i] > cur_end) cur_end = ends[i];
        } else {
            total += cur_end - cur_start + 1;
            cur_start = starts[i];
            cur_end = ends[i];
        }
    }
    total += cur_end - cur_start + 1;

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
