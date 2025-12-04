/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Pick 12 batteries to maximize 12-digit joltage
 * Uses sparse table RMQ for O(n log n) preprocessing, O(1) query
 */

#include "../../tools/runner/c/common.h"

#define K 12
#define MAX_LINE 256
#define MAX_LOG 8

// Sparse table storage (reused per line)
static int sparse[MAX_LOG][MAX_LINE];
static unsigned char log2_table[MAX_LINE + 1];

static inline void init_log2(int maxLen) {
    log2_table[0] = 0;
    log2_table[1] = 0;
    for (int i = 2; i <= maxLen; i++) {
        log2_table[i] = log2_table[i >> 1] + 1;
    }
}

int main(void) {
    char* input = aoc_read_input();
    char* ptr = input;

    init_log2(MAX_LINE);

    AOC_TIMER_START(solve);
    unsigned long long total = 0;

    while (*ptr) {
        char* lineStart = ptr;
        while (*ptr >= '0') ptr++;
        int len = ptr - lineStart;

        if (len >= K) {
            // Build sparse table level 0
            for (int i = 0; i < len; i++) {
                sparse[0][i] = i;
            }

            // Build higher levels
            int maxK = log2_table[len];
            for (int k = 1; k <= maxK; k++) {
                int prevLen = len - (1 << k) + 1;
                int half = 1 << (k - 1);
                for (int i = 0; i < prevLen; i++) {
                    int left = sparse[k - 1][i];
                    int right = sparse[k - 1][i + half];
                    sparse[k][i] = (lineStart[left] >= lineStart[right]) ? left : right;
                }
            }

            // Greedy with O(1) RMQ
            unsigned long long joltage = 0;
            int lastPos = -1;

            for (int p = 0; p < K; p++) {
                int start = lastPos + 1;
                int end = len - K + p;
                int length = end - start + 1;
                int k = log2_table[length];
                int left = sparse[k][start];
                int rightStart = end - (1 << k) + 1;
                int right = sparse[k][rightStart];
                int maxIdx = (lineStart[left] >= lineStart[right]) ? left : right;

                joltage = joltage * 10 + (lineStart[maxIdx] - '0');
                lastPos = maxIdx;
            }

            total += joltage;
        }

        if (*ptr) ptr++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_UINT(total);
    aoc_cleanup(input);
    return 0;
}
