/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Compile: clang -O3 -march=native -flto -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // No heavy parsing; operate on the raw buffer.
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    const int K = 12;
    long long result = 0;

    // Fast path for uniform 100-digit lines separated by '\n'
    size_t totalLen = 0;
    while (input[totalLen]) totalLen++;
    if (totalLen % 101 == 0 && input[100] == '\n') {
        int lines = (int)(totalLen / 101);
        for (int ln = 0; ln < lines; ln++) {
            char* start = input + ln * 101;

            uint8_t stack[12];
            int top = 0;
            for (int i = 0; i < 100; i++) {
                uint8_t d = (uint8_t)(start[i] - '0');
                int remaining = 99 - i; // digits after current
                while (top > 0 && stack[top - 1] < d && top + remaining >= K) {
                    top--;
                }
                if (top < K) stack[top++] = d;
            }
            unsigned long long val = 0;
            for (int i = 0; i < 12; ++i) {
                val = val * 10ULL + (unsigned long long)stack[i];
            }
            result += (long long)val;
        }
    } else {
        char* p = input;
        while (*p) {
            char* start = p;
            while (*p && *p != '\n' && *p != '\r') p++;
            char* end = p;

            int len = (int)(end - start);
            int drops = len - K;
            if (drops < 0) drops = 0;

            uint8_t stack[12];
            int top = 0;
            for (char* s = start; s < end; ++s) {
                uint8_t d = (uint8_t)(*s - '0');
                while (top > 0 && drops > 0 && stack[top - 1] < d) {
                    top--;
                    drops--;
                }
                if (top < K) {
                    stack[top++] = d;
                } else {
                    drops--;
                }
            }

            unsigned long long val = 0;
            for (int i = 0; i < top; ++i) {
                val = val * 10ULL + (unsigned long long)stack[i];
            }
            result += (long long)val;

            while (*p == '\n' || *p == '\r') p++;
        }
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
