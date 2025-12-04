/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Count ALL zero crossings (during and at end of rotations)
 * Optimized single-pass: branchless where possible
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    int pos = 50;
    long long count = 0;

    while (*ptr) {
        // Skip until L or R
        while (*ptr && *ptr != 'L' && *ptr != 'R') ptr++;
        if (!*ptr) break;

        char dir = *ptr++;

        // Fast parse - at least one digit guaranteed
        long dist = *ptr++ - '0';
        while (*ptr >= '0' && *ptr <= '9') {
            dist = dist * 10 + (*ptr++ - '0');
        }

        if (dir == 'R') {
            long total = pos + dist;
            long crossings = total / 100;
            count += crossings;
            pos = (int)(total - crossings * 100);
        } else {
            long fullRot = dist / 100;
            int rem = (int)(dist - fullRot * 100);
            count += fullRot + ((rem >= pos) & (pos != 0));
            pos -= rem;
            pos += 100 & -(pos < 0);
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
