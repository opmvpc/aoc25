/**
 * Advent of Code 2025 - Day 09 Part 1
 * Movie Theater - Find largest rectangle area using two red tiles as corners
 *
 * Ultra-optimized O(n²) - simple scalar, compiler does the rest
 */

#include "../../tools/runner/c/common.h"

#define MAX_POINTS 600

static int px[MAX_POINTS];
static int py[MAX_POINTS];

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int n = 0;
    char* p = input;
    while (*p) {
        int x = 0;
        while (*p >= '0' && *p <= '9') x = x * 10 + (*p++ - '0');
        p++;
        int y = 0;
        while (*p >= '0' && *p <= '9') y = y * 10 + (*p++ - '0');
        if (*p == '\n') p++;
        px[n] = x;
        py[n] = y;
        n++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long maxArea = 0;

    for (int i = 0; i < n; i++) {
        int xi = px[i], yi = py[i];
        for (int j = i + 1; j < n; j++) {
            int dx = xi - px[j];
            int dy = yi - py[j];
            int adx = dx < 0 ? -dx : dx;
            int ady = dy < 0 ? -dy : dy;
            long long area = (long long)(adx + 1) * (ady + 1);
            if (area > maxArea) maxArea = area;
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(maxArea);

    aoc_cleanup(input);
    return 0;
}
