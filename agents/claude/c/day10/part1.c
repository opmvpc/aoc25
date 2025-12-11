/**
 * Advent of Code 2025 - Day 10 Part 1
 * Factory - Minimum button presses via XOR enumeration
 *
 * Ultra-optimized Gray code: O(1) XOR update per iteration.
 * Compile: clang -O3 -march=native -o part1 part1.c
 */

#include "../../tools/runner/c/common.h"

#define MAX_BUTTONS 16
#define MAX_MACHINES 256

static inline __attribute__((always_inline)) int solve_machine(uint32_t target, uint32_t* __restrict__ buttons, int k) {
    if (target == 0) return 0;

    // Check single buttons inline
    for (int i = 0; i < k; i++) {
        if (buttons[i] == target) return 1;
    }

    // Check pairs - very common optimal case
    for (int i = 0; i < k; i++) {
        uint32_t bi = buttons[i];
        for (int j = i + 1; j < k; j++) {
            if ((bi ^ buttons[j]) == target) return 2;
        }
    }

    // Gray code enumeration for 3+ buttons
    uint32_t total = 1u << k;
    int min_presses = k + 1;
    uint32_t state = 0;

    // Start from mask=3 (binary 11) since we checked 1 and 2
    state = buttons[0] ^ buttons[1];  // Initialize for gray(3)

    for (uint32_t i = 3; i < total; i++) {
        // gray(i) differs from gray(i-1) by exactly one bit
        // That bit position is __builtin_ctz(i)
        int btn_idx = __builtin_ctz(i);
        state ^= buttons[btn_idx];

        if (state == target) {
            uint32_t gray = i ^ (i >> 1);
            int presses = __builtin_popcount(gray);
            if (presses < min_presses) {
                min_presses = presses;
                if (presses == 3) return 3;
            }
        }
    }

    return min_presses;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    long long total_presses = 0;
    uint32_t buttons[MAX_BUTTONS];

    char* p = input;
    while (*p) {
        // Skip to '['
        while (*p && *p != '[') p++;
        if (!*p) break;
        p++; // skip '['

        // Parse pattern [.##.] - branchless using subtraction
        uint32_t target = 0;
        int bit = 0;
        while (*p != ']') {
            // '#' = 35, '.' = 46. '#' sets bit, '.' doesn't
            // (*p == '#') is 1 if #, 0 if .
            target |= (uint32_t)(*p == '#') << bit;
            bit++;
            p++;
        }
        p++; // skip ']'

        int btn_count = 0;

        // Parse buttons until we hit '{'
        while (*p != '{') {
            if (*p == '(') {
                p++; // skip '('
                uint32_t mask = 0;

                while (*p != ')') {
                    if (*p >= '0') {  // digits are >= '0', comma is ','
                        int idx = *p++ - '0';
                        while (*p >= '0' && *p <= '9') {
                            idx = idx * 10 + (*p++ - '0');
                        }
                        mask |= (1u << idx);
                    } else {
                        p++; // skip comma
                    }
                }
                p++; // skip ')'
                buttons[btn_count++] = mask;
            } else {
                p++;
            }
        }

        // Solve immediately (better cache locality)
        total_presses += solve_machine(target, buttons, btn_count);

        // Skip to next line
        while (*p && *p != '\n') p++;
        if (*p) p++;
    }

    AOC_TIMER_END(parse);

    AOC_RESULT_INT(total_presses);

    aoc_cleanup(input);
    return 0;
}
