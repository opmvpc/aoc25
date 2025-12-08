#include "../../tools/runner/c/common.h"
#include <stdlib.h>
#include <ctype.h>

typedef struct {
    long long start;
    long long end;
} Range;

int compare_ranges(const void* a, const void* b) {
    const Range* ra = (const Range*)a;
    const Range* rb = (const Range*)b;
    if (ra->start < rb->start) return -1;
    if (ra->start > rb->start) return 1;
    return 0;
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);

    // Estimate number of ranges (max lines)
    // We can just allocate a safe upper bound or count newlines
    int max_ranges = 2000;
    Range* ranges = (Range*)malloc(sizeof(Range) * max_ranges);
    int count = 0;

    char* ptr = input;
    
    while (*ptr) {
        // Skip whitespace/newlines
        while (*ptr && isspace(*ptr)) ptr++;
        if (!*ptr) break;

        // Parse Start
        if (!isdigit(*ptr)) {
            // Might be the blank line break or EOF?
            // Actually ranges are "Num-Num".
            // If we hit something else, maybe we are done with ranges?
            // The format says ranges, then blank line, then IDs.
            // IDs are just "Num". Ranges are "Num-Num".
            // Check for '-'
            break; 
        }

        long long start = 0;
        while (isdigit(*ptr)) {
            start = start * 10 + (*ptr++ - '0');
        }

        if (*ptr != '-') {
            // If no separator, it's not a range line.
            // It might be the start of the ID section (just a number)
            // So we are done with ranges.
            break; 
        }
        ptr++; // Skip '-'

        long long end = 0;
        while (isdigit(*ptr)) {
            end = end * 10 + (*ptr++ - '0');
        }

        ranges[count].start = start;
        ranges[count].end = end;
        count++;
    }

    // Sort ranges
    qsort(ranges, count, sizeof(Range), compare_ranges);

    // Merge and Sum
    long long total_fresh = 0;
    if (count > 0) {
        long long current_start = ranges[0].start;
        long long current_end = ranges[0].end;

        for (int i = 1; i < count; i++) {
            // Check for overlap or adjacency
            // Overlap: next.start <= current.end + 1
            if (ranges[i].start <= current_end + 1) {
                // Merge
                if (ranges[i].end > current_end) {
                    current_end = ranges[i].end;
                }
            } else {
                // Gap found, push current range
                total_fresh += (current_end - current_start + 1);
                // Start new range
                current_start = ranges[i].start;
                current_end = ranges[i].end;
            }
        }
        // Add last range
        total_fresh += (current_end - current_start + 1);
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total_fresh);

    free(ranges);
    aoc_cleanup(input);
    return 0;
}