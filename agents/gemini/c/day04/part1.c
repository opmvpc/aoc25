/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * Optimized with Padding and Branchless Neighbor Count
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(parse);
    
    // Detect dimensions
    char* p = input;
    int w = 0;
    while (*p && *p != '\n' && *p != '\r') {
        w++;
        p++;
    }
    if (w == 0) return 0;
    
    int stride_input = w;
    if (*p == '\r') stride_input++;
    if (*p == '\n') stride_input++;
    else if (*(p+1) == '\n') stride_input += 2; 

    p = input;
    while (*p && *p != '\n') p++;
    if (*p == '\n') stride_input = (p - input) + 1;
    else stride_input = w;
    
    int h = 0;
    int len = 0;
    p = input;
    while (*p) {
        if (*p == '\n') h++;
        len++;
        p++;
    }
    if (len > 0 && input[len-1] != '\n') h++;
    
    // Padded Grid
    int pw = w + 2;
    int ph = h + 2;
    char* grid = (char*)calloc(pw * ph, 1);
    
    // Fast copy
    for (int r = 0; r < h; r++) {
        memcpy(grid + (r + 1) * pw + 1, input + r * stride_input, w);
    }
    
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    
    long long count = 0;
    
    int o1 = -pw - 1;
    int o2 = -pw;
    int o3 = -pw + 1;
    int o4 = -1;
    int o5 = 1;
    int o6 = pw - 1;
    int o7 = pw;
    int o8 = pw + 1;
    
    const char target = '@';
    
    // Single loop over the "valid" area
    // We can just iterate the pointer linearly for the whole block?
    // No, we need to skip borders.
    
    for (int r = 1; r <= h; r++) {
        char* row = grid + r * pw + 1;
        char* end = row + w;
        
        // Unroll or keep tight?
        // Branchless sum
        for (; row < end; row++) {
            if (*row == target) {
                int adj = (row[o1] == target) +
                          (row[o2] == target) +
                          (row[o3] == target) +
                          (row[o4] == target) +
                          (row[o5] == target) +
                          (row[o6] == target) +
                          (row[o7] == target) +
                          (row[o8] == target);
                
                // if adj < 4
                // branchless: count += (adj < 4)
                count += (adj < 4);
            }
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    free(grid);
    aoc_cleanup(input);
    return 0;
}