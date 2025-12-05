/**
 * 🎄 Advent of Code 2025 - Day 05 Part 1
 * PERFORMANCE EDITION
 * Compile: clang -O3 -march=native -funroll-loops -o part1 part1.c
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
    AOC_TIMER_START(total);

    Range ranges[MAX_RANGES];
    int count = 0;
    
    char* p = input;
    
    // 1. Parse Ranges
    while (*p) {
        if (*p == '\n') {
            p++;
            if (*p == '\n') { // Double newline -> switch to IDs
                p++; 
                break;
            }
            continue;
        }
        
        long val = 0;
        while (*p >= '0') {
            val = (val * 10) + (*p++ - '0');
        }
        ranges[count].min = val;
        p++; // skip '-'
        
        val = 0;
        while (*p >= '0') {
            val = (val * 10) + (*p++ - '0');
        }
        ranges[count].max = val;
        count++;
    }

    // 2. Sort Ranges
    quicksort_ranges(ranges, 0, count - 1);

    // 3. Merge Ranges (In-place)
    int merged_count = 0;
    if (count > 0) {
        int write_idx = 0;
        for (int i = 1; i < count; i++) {
            if (ranges[i].min <= ranges[write_idx].max + 1) {
                if (ranges[i].max > ranges[write_idx].max) {
                    ranges[write_idx].max = ranges[i].max;
                }
            } else {
                write_idx++;
                ranges[write_idx] = ranges[i];
            }
        }
        merged_count = write_idx + 1;
    }

    // 4. Parse IDs and Check
    long valid_count = 0;
    
    while (*p) {
        if (*p == '\n') {
            p++;
            continue;
        }
        
        long id = 0;
        while (*p >= '0') {
            id = (id * 10) + (*p++ - '0');
        }
        
        // Binary Search
        int low = 0;
        int high = merged_count - 1;
        while (low <= high) {
            int mid = (low + high) >> 1;
            Range* r = &ranges[mid];
            if (id >= r->min) {
                if (id <= r->max) {
                    valid_count++;
                    break;
                }
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
    }
    
    AOC_TIMER_END(total);
    AOC_RESULT_INT(valid_count);
    aoc_cleanup(input);
    return 0;
}
