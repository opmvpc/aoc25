/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Compile: clang -O2 -o part2 part2.c
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
    char* ptr = input;

    while (*ptr) {
        while (*ptr == '\n' || *ptr == '\r') ptr++;
        if (*ptr == '\0') break;

        char* line_start = ptr;
        char* line_end = ptr;
        while (*line_end && *line_end != '\n' && *line_end != '\r') line_end++;

        int len = (int)(line_end - line_start);
        int drops = len - K;
        if (drops < 0) drops = 0;

        int8_t stack[13]; // allow one extra slot before trimming
        int top = 0;
        for (char* p = line_start; p < line_end; ++p) {
            int d = *p - '0';
            while (top > 0 && drops > 0 && stack[top - 1] < d) {
                top--;
                drops--;
            }
            stack[top++] = (int8_t)d;
            if (top > K) {
                top--;
                drops--;
            }
        }

        unsigned long long val = 0;
        for (int i = 0; i < top; ++i) {
            val = val * 10ULL + (unsigned long long)stack[i];
        }
        result += (long long)val;

        ptr = line_end;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
