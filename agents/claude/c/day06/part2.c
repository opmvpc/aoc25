/**
 * 🎄 Advent of Code 2025 - Day 06 Part 2 - OPTIMIZED
 * Compile: clang -O3 -march=native -o part2 part2.c
 *
 * Optimizations:
 * - Zero-copy parsing
 * - Branchless digit detection (unsigned subtraction trick)
 * - Separate mul/add code paths to avoid branch in inner loop
 */

#include "../../tools/runner/c/common.h"

// Inline helper - check if column has content in any row
static inline int col_has_content(char** rows, int* lens, int nr, int col) {
    for (int r = 0; r < nr; r++)
        if (col < lens[r] && rows[r][col] != ' ') return 1;
    return 0;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    char* rows[8];
    int lens[8];
    int nr = 0, maxc = 0;

    for (char* p = input; *p && nr < 8; nr++) {
        rows[nr] = p;
        while (*p && *p != '\n') p++;
        lens[nr] = (int)(p - rows[nr]);
        if (lens[nr] > maxc) maxc = lens[nr];
        if (*p) p++;
    }
    while (nr > 0 && lens[nr-1] == 0) nr--;

    const int dr = nr - 1;

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long total = 0;

    for (int c = 0; c < maxc; ) {
        // Skip separator columns
        while (c < maxc && !col_has_content(rows, lens, nr, c)) c++;
        if (c >= maxc) break;

        // Find problem bounds
        int ps = c;
        while (c < maxc && col_has_content(rows, lens, nr, c)) c++;
        int pe = c;

        // Find operator in last row
        char op = '*';
        for (int i = ps; i < pe && i < lens[nr-1]; i++) {
            char ch = rows[nr-1][i];
            if (ch == '+' || ch == '*') { op = ch; break; }
        }

        // Compute - columns right to left
        if (op == '*') {
            long long res = 1;
            for (int col = pe - 1; col >= ps; col--) {
                long long n = 0;
                for (int r = 0; r < dr; r++) {
                    if (col < lens[r]) {
                        unsigned d = (unsigned)(rows[r][col] - '0');
                        if (d <= 9) n = n * 10 + d;
                    }
                }
                if (n) res *= n;
            }
            total += res;
        } else {
            long long res = 0;
            for (int col = pe - 1; col >= ps; col--) {
                long long n = 0;
                for (int r = 0; r < dr; r++) {
                    if (col < lens[r]) {
                        unsigned d = (unsigned)(rows[r][col] - '0');
                        if (d <= 9) n = n * 10 + d;
                    }
                }
                res += n;
            }
            total += res;
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
