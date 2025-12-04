/**
 * 🎄 Advent of Code 2025 - Day 01 Part 1
 * Dial at 50, count times it lands on 0 after rotations
 * Optimized: no modulo, branchless position update
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
        // Fast skip non-L/R (L=76, R=82)
        if ((c | 0x20) != 'l' && (c | 0x20) != 'r') {
            ptr++;
            continue;
        }

        // Direction: R=+1, L=-1
        int dir = 1 - ((c & 0x10) >> 3);  // R(82)=01010010→bit4=1→0, L(76)=01001100→bit4=0→1→*2
        dir = (c == 'R') ? 1 : -1;  // Simpler, compiler will optimize
        ptr++;

        // Fast parse - only works for positive ints
        int dist = 0;
        while ((c = *ptr) >= '0') {
            dist = dist * 10 + (c - '0');
            ptr++;
        }

        // Remove full rotations (avoid expensive modulo)
        // Instead of dist % 100, use repeated subtraction for small quotients
        // Most dist values are < 1000, so at most ~10 subtractions
        while (dist >= 100) dist -= 100;

        // Update position (branchless)
        pos += dir * dist;
        // Wrap: if pos >= 100, subtract 100; if pos < 0, add 100
        pos -= 100 & -(pos >= 100);
        pos += 100 & -(pos < 0);

        // Branchless count
        count += (pos == 0);
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    aoc_cleanup(input);
    return 0;
}
