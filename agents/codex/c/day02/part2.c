/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct {
    unsigned long long lo;
    unsigned long long hi;
} Range;

static int cmp_range(const void* a, const void* b) {
    const Range* ra = (const Range*)a;
    const Range* rb = (const Range*)b;
    if (ra->lo < rb->lo) return -1;
    if (ra->lo > rb->lo) return 1;
    if (ra->hi < rb->hi) return -1;
    if (ra->hi > rb->hi) return 1;
    return 0;
}

static int cmpULL(const void* a, const void* b) {
    unsigned long long aa = *(const unsigned long long*)a;
    unsigned long long bb = *(const unsigned long long*)b;
    return (aa > bb) - (aa < bb);
}

static size_t lower_bound_ull(const unsigned long long* arr, size_t n, unsigned long long target) {
    size_t l = 0, r = n;
    while (l < r) {
        size_t mid = (l + r) >> 1;
        if (arr[mid] < target) l = mid + 1;
        else r = mid;
    }
    return l;
}

static inline int digit_count(unsigned long long x) {
    int d = 1;
    while (x >= 10) {
        x /= 10;
        d++;
    }
    return d;
}

static void print_u128(unsigned __int128 value) {
    char buf[40];
    int idx = 39;
    buf[idx] = '\0';
    if (value == 0) {
        putchar('0');
        return;
    }
    while (value > 0) {
        unsigned int digit = (unsigned int)(value % 10);
        buf[--idx] = (char)('0' + digit);
        value /= 10;
    }
    fputs(buf + idx, stdout);
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    Range ranges[256];
    int rc = 0;
    unsigned long long maxR = 0;

    char* p = input;
    while (*p) {
        while (*p && (*p < '0' || *p > '9')) p++;
        if (!*p) break;
        unsigned long long lo = 0, hi = 0;
        while (*p >= '0' && *p <= '9') {
            lo = lo * 10 + (unsigned long long)(*p - '0');
            p++;
        }
        if (*p == '-') p++;
        while (*p >= '0' && *p <= '9') {
            hi = hi * 10 + (unsigned long long)(*p - '0');
            p++;
        }
        ranges[rc].lo = lo;
        ranges[rc].hi = hi;
        if (hi > maxR) maxR = hi;
        rc++;
        while (*p == ',' || *p == '\n' || *p == '\r') p++;
    }

    // Sort and merge ranges
    qsort(ranges, rc, sizeof(Range), cmp_range);
    int mc = 0;
    for (int i = 0; i < rc; i++) {
        if (mc == 0 || ranges[i].lo > ranges[mc - 1].hi + 1) {
            ranges[mc++] = ranges[i];
        } else if (ranges[i].hi > ranges[mc - 1].hi) {
            ranges[mc - 1].hi = ranges[i].hi;
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int digitsMax = digit_count(maxR);
    unsigned long long pow10[21];
    pow10[0] = 1;
    for (int i = 1; i <= digitsMax; i++) pow10[i] = pow10[i - 1] * 10ULL;

    // Precompute divisors and multipliers for primitive check
    int divs[11][6];
    int divCount[11] = {0};
    unsigned long long mults[11][6];
    for (int m = 1; m <= digitsMax; m++) {
        for (int d = 1; d * 2 <= m; d++) {
            if (m % d == 0) {
                divs[m][divCount[m]] = d;
                mults[m][divCount[m]] = (pow10[m] - 1ULL) / (pow10[d] - 1ULL);
                divCount[m]++;
            }
        }
    }

    unsigned __int128 total = 0;

    for (int m = 1; m <= digitsMax; m++) {
        unsigned long long baseMin = pow10[m - 1];
        unsigned long long baseMax = pow10[m] - 1;
        if (baseMin > baseMax) continue;
        for (int r = 2; m * r <= digitsMax; r++) {
            unsigned long long k = (pow10[m * r] - 1ULL) / (pow10[m] - 1ULL);
            unsigned long long xHi = maxR / k;
            if (xHi > baseMax) xHi = baseMax;
            if (xHi < baseMin) continue;

            int idxRange = 0;
            for (unsigned long long x = baseMin; x <= xHi; x++) {
                // primitive check
                int primitive = 1;
                for (int i = 0; i < divCount[m]; i++) {
                    int d = divs[m][i];
                    unsigned long long rep = x / pow10[m - d];
                    if (rep * mults[m][i] == x) {
                        primitive = 0;
                        break;
                    }
                }
                if (!primitive) continue;

                unsigned long long val = x * k;
                while (idxRange < mc && val > ranges[idxRange].hi) idxRange++;
                if (idxRange >= mc) break;
                if (val >= ranges[idxRange].lo) total += val;
            }
        }
    }
    AOC_TIMER_END(solve);

    fputs("ANSWER:", stdout);
    print_u128(total);
    putchar('\n');

    aoc_cleanup(input);
    return 0;
}
