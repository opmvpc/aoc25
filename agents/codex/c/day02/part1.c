/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Compile: clang -O3 -march=native -flto -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct { unsigned long long lo, hi; } Range;

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
    unsigned long long pow10[11];
    pow10[0] = 1;
    for (int i = 1; i <= 10; i++) pow10[i] = pow10[i - 1] * 10ULL;

    int digitsMax = 0;
    unsigned long long t = maxR;
    do { digitsMax++; t /= 10ULL; } while (t);

    unsigned __int128 total = 0;
    int mMax = digitsMax >> 1;
    for (int m = 1; m <= mMax; m++) {
        unsigned long long k = pow10[m] + 1ULL;
        unsigned long long baseMin = pow10[m - 1];
        unsigned long long baseMax = pow10[m] - 1;
        for (int i = 0; i < rc; i++) {
            unsigned long long xLo = ranges[i].lo / k;
            if (ranges[i].lo % k) xLo++;
            if (xLo < baseMin) xLo = baseMin;
            unsigned long long xHi = ranges[i].hi / k;
            if (xHi > baseMax) xHi = baseMax;
            if (xLo > xHi) continue;
            unsigned long long cnt = xHi - xLo + 1ULL;
            unsigned __int128 sumX = (unsigned __int128)(xLo + xHi) * cnt;
            if (cnt & 1ULL) sumX /= 2ULL;
            else sumX = (sumX >> 1);
            total += (unsigned __int128)k * sumX;
        }
    }
    AOC_TIMER_END(solve);

    // Output
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
