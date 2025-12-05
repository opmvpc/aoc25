/**
 * 🎄 Advent of Code 2025 - Day 05 Part 2
 * PERFORMANCE EDITION - v3
 * Compile: clang -O3 -march=native -funroll-loops -o part2 part2.c
 */

#include "../../tools/runner/c/common.h"

#define MAX_RANGES 4096

typedef struct {
    long min;
    long max;
} Range;

// Custom QuickSort
static void quicksort_ranges(Range* arr, int low, int high) {
    if (low < high) {
        long pivot = arr[high].min;
        int i = (low - 1);
        
        for (int j = low; j <= high - 1; j++) {
            if (arr[j].min < pivot) {
                i++;
                Range temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        Range temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        int pi = i + 1;

        quicksort_ranges(arr, low, pi - 1);
        quicksort_ranges(arr, pi + 1, high);
    }
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(parse);

    Range ranges[MAX_RANGES];
    int count = 0;

    char* p = input;
    
    // Robust fast parsing
    while (*p) {
        // Skip whitespace/newlines to find start of number
        while (*p && (*p < '0' || *p > '9')) {
            if (*p == '\n') {
                char* check = p + 1;
                if (*check == '\r') check++;
                if (*check == '\n') goto parsing_done;
            }
            p++;
        }
        
        if (!*p) break;

        // Parse min
        long val = 0;
        while (*p >= '0' && *p <= '9') {
            val = (val * 10) + (*p++ - '0');
        }
        ranges[count].min = val;

        // Skip to next number (max)
        while (*p && (*p < '0' || *p > '9')) p++;
        
        // Parse max
        val = 0;
        while (*p >= '0' && *p <= '9') {
            val = (val * 10) + (*p++ - '0');
        }
        ranges[count].max = val;
        
        count++;
    }

parsing_done:
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // Sort
    quicksort_ranges(ranges, 0, count - 1);

    // Merge & Sum
    long long total_len = 0;
    
    if (count > 0) {
        long current_min = ranges[0].min;
        long current_max = ranges[0].max;

        for (int i = 1; i < count; i++) {
            if (ranges[i].min <= current_max + 1) {
                if (ranges[i].max > current_max) {
                    current_max = ranges[i].max;
                }
            } else {
                total_len += (current_max - current_min + 1);
                current_min = ranges[i].min;
                current_max = ranges[i].max;
            }
        }
        total_len += (current_max - current_min + 1);
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total_len);
    
    aoc_cleanup(input);
    return 0;
}
