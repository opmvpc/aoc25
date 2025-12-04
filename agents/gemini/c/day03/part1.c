/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    long long total = 0;
    char* p = input;
    
    // Process line by line
    while (*p) {
        char* start = p;
        while (*p && *p != '\n') p++;
        char* end = p;
        int len = end - start;
        
        // Skip empty lines or too short
        if (len < 2) {
            if (*p == '\n') p++;
            continue;
        }
        
        int d1 = -1;
        int firstIdx = -1;
        
        // Find max d1 (digit value 9..1)
        // Need to find the FIRST occurrence of the max digit that is NOT the last char
        // Actually, we iterate v=9..1, check if it exists at index < len-1.
        
        // Optimization: Scan string once to find positions?
        // Or just strchr-like scan for '9', then '8'...
        // Since string is short, multiple scans are fine.
        
        for (char v = '9'; v >= '1'; v--) {
            char* found = NULL;
            for (char* s = start; s < end - 1; s++) {
                if (*s == v) {
                    found = s;
                    break;
                }
            }
            if (found) {
                d1 = v - '0';
                firstIdx = found - start;
                break;
            }
        }
        
        if (d1 != -1) {
            int d2 = 0;
            // Search for max digit after d1
            for (char* s = start + firstIdx + 1; s < end; s++) {
                if (*s >= '0' && *s <= '9') {
                    int val = *s - '0';
                    if (val > d2) d2 = val;
                    if (d2 == 9) break;
                }
            }
            total += d1 * 10 + d2;
        }
        
        if (*p == '\n') p++;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}