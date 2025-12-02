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
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int digitsMax = digit_count(maxR);
    unsigned long long pow10[21];
    pow10[0] = 1;
    for (int i = 1; i <= digitsMax; i++) pow10[i] = pow10[i - 1] * 10ULL;

    // Generate all invalid numbers up to maxR
    size_t cap = 300000;
    unsigned long long* vals = (unsigned long long*)malloc(cap * sizeof(unsigned long long));
    size_t vn = 0;

    for (int m = 1; m * 2 <= digitsMax; m++) {
        unsigned long long baseMin = pow10[m - 1];
        unsigned long long baseMax = pow10[m] - 1;
        unsigned long long denom = pow10[m] - 1;
        for (int r = 2; m * r <= digitsMax; r++) {
            unsigned long long k = (pow10[m * r] - 1ULL) / denom;
            unsigned long long xHi = maxR / k;
            if (xHi > baseMax) xHi = baseMax;
            if (xHi < baseMin) continue;
            for (unsigned long long x = baseMin; x <= xHi; x++) {
                if (vn >= cap) {
                    cap *= 2;
                    vals = (unsigned long long*)realloc(vals, cap * sizeof(unsigned long long));
                }
                vals[vn++] = x * k;
            }
        }
    }

    // Sort and dedup
    qsort(vals, vn, sizeof(unsigned long long), cmpULL);
    size_t un = 0;
    for (size_t i = 0; i < vn; i++) {
        if (un == 0 || vals[i] != vals[un - 1]) vals[un++] = vals[i];
    }

    // Prefix sums
    unsigned __int128* pref = (unsigned __int128*)malloc((un + 1) * sizeof(unsigned __int128));
    pref[0] = 0;
    for (size_t i = 0; i < un; i++) pref[i + 1] = pref[i] + (unsigned __int128)vals[i];

    // Binary search helpers
    unsigned __int128 total = 0;
    for (int idx = 0; idx < rc; idx++) {
        unsigned long long L = ranges[idx].lo;
        unsigned long long R = ranges[idx].hi;
        size_t i1 = lower_bound_ull(vals, un, L);
        size_t i2 = lower_bound_ull(vals, un, R + 1ULL);
        if (i1 < i2) total += pref[i2] - pref[i1];
    }

    free(pref);
    free(vals);
    AOC_TIMER_END(solve);

    fputs("ANSWER:", stdout);
    print_u128(total);
    putchar('\n');

    aoc_cleanup(input);
    return 0;
}
