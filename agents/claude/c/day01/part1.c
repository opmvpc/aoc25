/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Dial at 50, count times it lands on 0 after rotations
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    AOC_TIMER_START(solve);
    int pos = 50;
    int count = 0;
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
        int dist = 0;
        while ((c = *ptr) >= '0') {
            dist = dist * 10 + (c - '0');
            ptr++;
        }

        // Update position
        if (isLeft) {
            pos = ((pos - dist) % 100 + 100) % 100;
        } else {
            pos = (pos + dist) % 100;
        }

        // Branchless count
        count += (pos == 0);
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
