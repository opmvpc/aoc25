/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

static inline int is_invalid_id(long long n) {
    // Fast manual conversion to string
    char s[32];
    int len = 0;
    long long temp = n;

    // Convert to string
    if (temp == 0) {
        s[len++] = '0';
    } else {
        long long t = temp;
        while (t > 0) {
            len++;
            t /= 10;
        }

        for (int i = len - 1; i >= 0; i--) {
            s[i] = '0' + (temp % 10);
            temp /= 10;
        }
    }

    // Try all possible pattern lengths
    for (int patternLen = 1; patternLen <= len / 2; patternLen++) {
        // Length must be divisible by pattern length
        if (len % patternLen != 0) continue;

        int repeatCount = len / patternLen;
        // Must have at least 2 repetitions
        if (repeatCount < 2) continue;

        // Check if pattern has leading zero
        if (s[0] == '0') continue;

        // Check if entire string is pattern repeated
        int isRepeated = 1;
        for (int i = patternLen; i < len; i++) {
            if (s[i] != s[i % patternLen]) {
                isRepeated = 0;
                break;
            }
        }

        if (isRepeated) return 1;
    }

    return 0;
}

int main(void) {
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

        // Parse start number
        char* end;
        long long start = strtoll(ptr, &end, 10);
        ptr = end;

        // Skip dash
        if (*ptr == '-') ptr++;

        // Parse end number
        long long endNum = strtoll(ptr, &end, 10);
        ptr = end;

        // Check all numbers in range
        for (long long n = start; n <= endNum; n++) {
            if (is_invalid_id(n)) {
                sum += n;
            }
        }
    }

    long long result = sum;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
