/**
 * 🎄 Advent of Code 2025 - Day 01 Part 2
 * Count ALL zero crossings (during and at end of rotations)
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    int pos = 50;
    long long count = 0;
    char c;

    while ((c = *ptr)) {
        // Fast skip non-L/R
        if (c != 'L' && c != 'R') {
            ptr++;
            continue;
        }

        int isLeft = (c == 'L');
        ptr++;

        // Fast parse
        long dist = 0;
        while ((c = *ptr) >= '0') {
            dist = dist * 10 + (c - '0');
            ptr++;
        }

        if (isLeft) {
            // Full rotations + partial crossing
            long fullRot = dist / 100;
            int rem = dist % 100;
            count += fullRot;
            count += (rem >= pos) & (pos != 0);
            pos = ((pos - rem) % 100 + 100) % 100;
        } else {
            // (pos + dist) / 100 = number of crossings
            count += (pos + dist) / 100;
            pos = (pos + dist) % 100;
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
