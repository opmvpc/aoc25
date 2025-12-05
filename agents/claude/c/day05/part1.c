/**
 * 🎄 Advent of Code 2025 - Day 05 Part 1 - ULTIMATE v11
 * Key: Shell sort instead of qsort (no function call overhead)
 * + SIMD scan with early exit
 * Compile: clang -O3 -march=native -o part1 part1.c
 */

#include "../../tools/runner/c/common.h"
#include <immintrin.h>

#define MAX_RANGES 256
#define MAX_IDS 1024

typedef struct { long long s, e; } Range;

static long long starts[MAX_RANGES] __attribute__((aligned(64)));
static long long ends[MAX_RANGES] __attribute__((aligned(64)));
static long long ids[MAX_IDS] __attribute__((aligned(64)));
static Range ranges[MAX_RANGES];

// Shell sort - no function call overhead, great for n=172
static inline void shell_sort(Range* arr, int n) {
    // Ciura gap sequence, optimal for n < 500
    static const int gaps[] = {57, 23, 10, 4, 1};

    for (int g = 0; g < 5; g++) {
        int gap = gaps[g];
        for (int i = gap; i < n; i++) {
            Range temp = arr[i];
            int j = i;
            while (j >= gap && arr[j - gap].s > temp.s) {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
    }
}

__attribute__((target("avx2"), hot))
int main(void) {
    char* input = aoc_read_input();
    const char* p = input;

    AOC_TIMER_START(parse);

    int n = 0;
    while (*p >= '0') {
        long long s = 0;
        do { s = s * 10 + (*p - '0'); } while (*++p >= '0');
        p++;
        long long e = 0;
        do { e = e * 10 + (*p - '0'); } while (*++p >= '0');
        ranges[n].s = s;
        ranges[n].e = e;
        n++;
        p++;
    }
    p++;

    int id_count = 0;
    while (*p) {
        long long id = 0;
        do { id = id * 10 + (*p - '0'); } while (*++p >= '0');
        ids[id_count++] = id;
        if (*p) p++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    // Shell sort - faster than qsort for small n
    shell_sort(ranges, n);

    // Merge into aligned arrays
    int m = 0;
    long long cur_s = ranges[0].s, cur_e = ranges[0].e;

    for (int i = 1; i < n; i++) {
        if (ranges[i].s <= cur_e + 1) {
            if (ranges[i].e > cur_e) cur_e = ranges[i].e;
        } else {
            starts[m] = cur_s;
            ends[m] = cur_e;
            m++;
            cur_s = ranges[i].s;
            cur_e = ranges[i].e;
        }
    }
    starts[m] = cur_s;
    ends[m] = cur_e;
    m++;

    // Pad for SIMD
    const int padded = (m + 3) & ~3;
    for (int i = m; i < padded; i++) {
        starts[i] = 0x7FFFFFFFFFFFFFFFLL;
        ends[i] = -1LL;
    }

    // SIMD scan
    int result = 0;

    for (int i = 0; i < id_count; i++) {
        const __m256i vid = _mm256_set1_epi64x(ids[i]);

        for (int j = 0; j < padded; j += 4) {
            const __m256i vs = _mm256_load_si256((const __m256i*)&starts[j]);
            const __m256i ve = _mm256_load_si256((const __m256i*)&ends[j]);

            const __m256i out = _mm256_or_si256(
                _mm256_cmpgt_epi64(vs, vid),
                _mm256_cmpgt_epi64(vid, ve)
            );

            if (_mm256_movemask_epi8(out) != -1) {
                result++;
                goto next;
            }
        }
        next:;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
