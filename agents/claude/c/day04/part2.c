/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * Simulate removing rolls with BFS optimization
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

#define MAX_SIZE 256
#define MAX_QUEUE (MAX_SIZE * MAX_SIZE)

// Direction offsets: 8 neighbors
static const int DR[] = {-1, -1, -1, 0, 0, 1, 1, 1};
static const int DC[] = {-1, 0, 1, -1, 1, -1, 0, 1};

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);

    // Find grid dimensions
    int cols = 0;
    while (input[cols] && input[cols] != '\n') cols++;
    int rows = 0;
    char* ptr = input;
    while (*ptr) {
        if (*ptr == '\n') rows++;
        ptr++;
    }
    if (ptr > input && *(ptr-1) != '\n') rows++;

    int stride = cols + 1;

    // Copy grid for modification (use '.' for removed)
    static char grid[MAX_SIZE * MAX_SIZE];
    for (int r = 0; r < rows; r++) {
        memcpy(&grid[r * cols], &input[r * stride], cols);
    }

    // Count neighbors helper macro
    #define COUNT_NEIGHBORS(r, c) ({ \
        int n = 0; \
        for (int d = 0; d < 8; d++) { \
            int nr = (r) + DR[d], nc = (c) + DC[d]; \
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr * cols + nc] == '@') n++; \
        } \
        n; \
    })

    // Queue for BFS
    static int queue[MAX_QUEUE];
    static char inQueue[MAX_SIZE * MAX_SIZE];
    memset(inQueue, 0, rows * cols);

    int head = 0, tail = 0;

    // Initial pass: find all accessible rolls
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r * cols + c] == '@' && COUNT_NEIGHBORS(r, c) < 4) {
                queue[tail++] = r * cols + c;
                inQueue[r * cols + c] = 1;
            }
        }
    }

    int totalRemoved = 0;

    while (head < tail) {
        int key = queue[head++];
        int r = key / cols, c = key % cols;
        inQueue[key] = 0;

        // Check if still accessible
        if (grid[key] != '@' || COUNT_NEIGHBORS(r, c) >= 4) continue;

        // Remove this roll
        grid[key] = '.';
        totalRemoved++;

        // Check neighbors
        for (int d = 0; d < 8; d++) {
            int nr = r + DR[d], nc = c + DC[d];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                int nkey = nr * cols + nc;
                if (grid[nkey] == '@' && !inQueue[nkey] && COUNT_NEIGHBORS(nr, nc) < 4) {
                    queue[tail++] = nkey;
                    inQueue[nkey] = 1;
                }
            }
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(totalRemoved);
    aoc_cleanup(input);
    return 0;
}
