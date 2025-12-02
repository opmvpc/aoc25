/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

// Pre-computed powers of 10
static long long POW10[20];

static inline void init_pow10() {
    POW10[0] = 1;
    for (int i = 1; i < 20; i++) {
        POW10[i] = POW10[i-1] * 10;
    }
}

static inline int count_digits(long long n) {
    if (n == 0) return 1;
    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;
    }
    return count;
}

int main(void) {
    init_pow10();

    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long sum = 0;

    while (*ptr) {
        // Skip whitespace, commas, newlines
        while (*ptr && (*ptr == ',' || *ptr == ' ' || *ptr == '\n' || *ptr == '\r')) {
            ptr++;
        }

        if (!*ptr) break;

        // Parse range
        char* end;
        long long start = strtoll(ptr, &end, 10);
        ptr = end;

        if (*ptr == '-') ptr++;

        long long endNum = strtoll(ptr, &end, 10);
        ptr = end;

        // Generate invalids directly
        int startLen = count_digits(start);
        int endLen = count_digits(endNum);

        for (int totalLen = startLen; totalLen <= endLen; totalLen++) {
            // Must be even length for part1
            if (totalLen % 2 != 0) continue;

            int patternLen = totalLen / 2;
            long long minPattern = POW10[patternLen - 1];
            long long maxPattern = POW10[patternLen] - 1;

            for (long long pattern = minPattern; pattern <= maxPattern; pattern++) {
                // Build repeated number: pattern * (10^patternLen + 1)
                long long repeated = pattern * (POW10[patternLen] + 1);

                if (repeated >= start && repeated <= endNum) {
                    sum += repeated;
                } else if (repeated > endNum) {
                    break;
                }
            }
        }
    }

    long long result = sum;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
