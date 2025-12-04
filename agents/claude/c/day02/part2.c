/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Find IDs that are pattern repeated 2+ times
 */

#include "../../tools/runner/c/common.h"

static long long POW10[20];

static inline void init_pow10(void) {
    POW10[0] = 1;
    for (int i = 1; i < 20; i++) POW10[i] = POW10[i-1] * 10;
}

static inline int count_digits(long long n) {
    if (n < 10) return 1;
    if (n < 100) return 2;
    if (n < 1000) return 3;
    if (n < 10000) return 4;
    if (n < 100000) return 5;
    if (n < 1000000) return 6;
    if (n < 10000000) return 7;
    if (n < 100000000) return 8;
    if (n < 1000000000) return 9;
    if (n < 10000000000LL) return 10;
    int c = 10;
    n /= 10000000000LL;
    while (n) { c++; n /= 10; }
    return c;
}

// Fast hash set with open addressing
#define HASH_SIZE 16381
static long long hash_values[HASH_SIZE];
static char hash_used[HASH_SIZE];

static inline void hash_clear(void) {
    __builtin_memset(hash_used, 0, HASH_SIZE);
}

static inline int hash_insert(long long value) {
    unsigned int idx = (unsigned int)(value % HASH_SIZE);
    while (hash_used[idx]) {
        if (hash_values[idx] == value) return 0;
        idx = (idx + 1) % HASH_SIZE;
    }
    hash_values[idx] = value;
    hash_used[idx] = 1;
    return 1;
}

// Compute multiplier: 1 + 10^p + 10^2p + ... for r terms
static inline long long get_multiplier(int patternLen, int repeatCount) {
    long long mult = 0, power = 1;
    for (int i = 0; i < repeatCount; i++) {
        mult += power;
        power *= POW10[patternLen];
    }
    return mult;
}

int main(void) {
    init_pow10();
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    long long sum = 0;

    while (*ptr) {
        while (*ptr && (*ptr < '0' || *ptr > '9')) ptr++;
        if (!*ptr) break;

        long long start = 0;
        while (*ptr >= '0' && *ptr <= '9') start = start * 10 + (*ptr++ - '0');
        while (*ptr == '-') ptr++;
        long long endNum = 0;
        while (*ptr >= '0' && *ptr <= '9') endNum = endNum * 10 + (*ptr++ - '0');

        hash_clear();

        int startLen = count_digits(start);
        int endLen = count_digits(endNum);

        for (int totalLen = startLen; totalLen <= endLen; totalLen++) {
            for (int patternLen = 1; patternLen <= totalLen / 2; patternLen++) {
                if (totalLen % patternLen != 0) continue;

                int repeatCount = totalLen / patternLen;
                if (repeatCount < 2) continue;

                long long multiplier = get_multiplier(patternLen, repeatCount);
                long long minPattern = POW10[patternLen - 1];
                long long maxPattern = POW10[patternLen] - 1;

                long long minFromStart = (start + multiplier - 1) / multiplier;
                long long maxFromEnd = endNum / multiplier;
                if (minFromStart > minPattern) minPattern = minFromStart;
                if (maxFromEnd < maxPattern) maxPattern = maxFromEnd;

                for (long long pattern = minPattern; pattern <= maxPattern; pattern++) {
                    long long repeated = pattern * multiplier;
                    if (hash_insert(repeated)) {
                        sum += repeated;
                    }
                }
            }
        }
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(sum);
    aoc_cleanup(input);
    return 0;
}
