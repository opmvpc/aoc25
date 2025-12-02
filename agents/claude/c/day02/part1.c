/**
 * 🎄 Advent of Code 2025 - Day 02 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

static inline int is_invalid_id(long long n) {
    // Fast manual conversion to string
    char s[32];
    int len = 0;
    long long temp = n;

    // Get length and convert
    if (temp == 0) {
        s[len++] = '0';
    } else {
        // Count digits
        long long t = temp;
        while (t > 0) {
            len++;
            t /= 10;
        }

        // Convert to string
        for (int i = len - 1; i >= 0; i--) {
            s[i] = '0' + (temp % 10);
            temp /= 10;
        }
    }

    // Must be even length
    if (len % 2 != 0) return 0;

    int half = len / 2;

    // Check if first half has leading zero
    if (s[0] == '0') return 0;

    // Compare two halves
    for (int i = 0; i < half; i++) {
        if (s[i] != s[half + i]) return 0;
    }

    return 1;
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
