/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O3 -march=native -flto -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct { unsigned long long lo, hi; } Range;

static unsigned long long pow10[11];

static inline unsigned __int128 sum_interval(unsigned long long a, unsigned long long b) {
    unsigned long long n = b - a + 1ULL;
    unsigned __int128 s = (unsigned __int128)(a + b) * (unsigned __int128)n;
    if (n & 1ULL) return s / 2ULL;
    return s >> 1;
}

static unsigned __int128 primitive_sum(
    int len,
    unsigned long long lo,
    unsigned long long hi,
    unsigned long long mults[][3],
    int divs[][3],
    int divCount[]
) {
    if (lo > hi) return 0;
    unsigned long long min = pow10[len - 1];
    unsigned long long max = pow10[len] - 1;
    if (lo < min) lo = min;
    if (hi > max) hi = max;
    if (lo > hi) return 0;

    if (len == 1) {
        if (lo < 1) lo = 1;
        if (hi > 9) hi = 9;
        if (lo > hi) return 0;
        return sum_interval(lo, hi);
    }

    unsigned __int128 total = sum_interval(lo, hi);
    for (int i = 0; i < divCount[len]; i++) {
        int d = divs[len][i];
        unsigned long long factor = mults[len][i];
        unsigned long long yLo = lo / factor;
        if (lo % factor) yLo++;
        unsigned long long yHi = hi / factor;
        unsigned __int128 sub = primitive_sum(d, yLo, yHi, mults, divs, divCount);
        total -= sub * (unsigned __int128)factor;
    }
    return total;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    Range ranges[128];
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
        rc++;
        if (hi > maxR) maxR = hi;
        ranges[rc - 1].hi = hi;
        while (*p == ',' || *p == '\n' || *p == '\r') p++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    pow10[0] = 1;
    for (int i = 1; i <= 10; i++) pow10[i] = pow10[i - 1] * 10ULL;

    int digitsMax = 0;
    unsigned long long tmp = maxR;
    do { digitsMax++; tmp /= 10ULL; } while (tmp);

    // Möbius-style recursion to get sum of primitive bases in interval
    int divs[6][3];
    int divCount[6] = {0};
    unsigned long long mults[6][3];
    for (int len = 1; len <= 5; len++) {
        for (int d = 1; d * 2 <= len; d++) {
            if (len % d == 0) {
                divs[len][divCount[len]] = d;
                mults[len][divCount[len]] = (pow10[len] - 1ULL) / (pow10[d] - 1ULL);
                divCount[len]++;
            }
        }
    }

    unsigned __int128 total = 0;
    for (int len = 1; len <= 5; len++) {
        for (int rep = 2; len * rep <= digitsMax; rep++) {
            unsigned long long factor = (pow10[len * rep] - 1ULL) / (pow10[len] - 1ULL);
            for (int i = 0; i < rc; i++) {
                unsigned long long xLo = ranges[i].lo / factor;
                if (ranges[i].lo % factor) xLo++;
                unsigned long long xHi = ranges[i].hi / factor;
                unsigned __int128 sumBase = primitive_sum(len, xLo, xHi, mults, divs, divCount);
                total += (unsigned __int128)factor * sumBase;
            }
        }
    }
    AOC_TIMER_END(solve);

    char buf[40];
    int idx = 39;
    buf[idx] = '\0';
    unsigned __int128 tmpTotal = total;
    if (tmpTotal == 0) buf[--idx] = '0';
    else {
        while (tmpTotal > 0) {
            unsigned int digit = (unsigned int)(tmpTotal % 10);
            buf[--idx] = (char)('0' + digit);
            tmpTotal /= 10;
        }
    }
    fputs("ANSWER:", stdout);
    fputs(buf + idx, stdout);
    putchar('\n');

    aoc_cleanup(input);
    return 0;
}
