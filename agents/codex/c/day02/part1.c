/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct {
    unsigned long long lo;
    unsigned long long hi;
} Range;

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
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    unsigned long long pow10[20];
    pow10[0] = 1;
    for (int i = 1; i < 20; i++) pow10[i] = pow10[i - 1] * 10ULL;

    int mMax = digit_count(maxR) / 2;
    unsigned __int128 total = 0;

    for (int idx = 0; idx < rc; idx++) {
        unsigned long long L = ranges[idx].lo;
        unsigned long long R = ranges[idx].hi;
        for (int m = 1; m <= mMax; m++) {
            unsigned long long k = pow10[m] + 1ULL;
            unsigned long long xLo = (L + k - 1) / k;
            unsigned long long xHi = R / k;
            unsigned long long lower = pow10[m - 1];
            unsigned long long upper = pow10[m] - 1;
            if (xLo < lower) xLo = lower;
            if (xHi > upper) xHi = upper;
            if (xLo > xHi) continue;

            unsigned long long count = xHi - xLo + 1;
            unsigned __int128 sumX = (unsigned __int128)(xLo + xHi) * (unsigned __int128)count / 2;
            total += (unsigned __int128)k * sumX;
        }
    }
    AOC_TIMER_END(solve);

    fputs("ANSWER:", stdout);
    print_u128(total);
    putchar('\n');

    aoc_cleanup(input);
    return 0;
}
