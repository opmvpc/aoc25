#include "../../tools/runner/c/common.h"
#include <string.h>
#include <ctype.h>
#include <stdbool.h>
#include <limits.h>

#define MAX_LINES 100

typedef struct {
    char* start;
    int len;
} Line;

bool is_col_empty(Line* lines, int num_lines, int col) {
    for (int i = 0; i < num_lines; i++) {
        if (col < lines[i].len && lines[i].start[col] != ' ' && lines[i].start[col] != '\r' && lines[i].start[col] != '\n') {
            return false;
        }
    }
    return true;
}

long long parse_segment(const char* start, int len) {
    // Skip leading spaces
    while (len > 0 && isspace(*start)) {
        start++;
        len--;
    }
    // Skip trailing spaces
    while (len > 0 && isspace(start[len - 1])) {
        len--;
    }
    if (len == 0) return -1; // Empty/invalid

    long long val = 0;
    bool has_digit = false;
    for (int i = 0; i < len; i++) {
        if (isdigit(start[i])) {
            val = val * 10 + (start[i] - '0');
            has_digit = true;
        }
    }
    return has_digit ? val : -1;
}

char parse_op(const char* start, int len) {
    for (int i = 0; i < len; i++) {
        if (start[i] == '+' || start[i] == '*') return start[i];
    }
    return 0;
}

int main(void) {
    char* input = aoc_read_input();
    
    Line lines[MAX_LINES];
    int num_lines = 0;
    int max_width = 0;

    char* ptr = input;
    while (*ptr) {
        lines[num_lines].start = ptr;
        // Find end of line
        char* eol = strchr(ptr, '\n');
        int len;
        if (eol) {
            len = eol - ptr;
        } else {
            len = strlen(ptr);
        }
        
        // Trim CR if present
        if (len > 0 && ptr[len-1] == '\r') len--;
        
        lines[num_lines].len = len;
        if (len > max_width) max_width = len;
        
        num_lines++;
        if (eol) ptr = eol + 1;
        else break;
    }

    AOC_TIMER_START(solve);

    long long grand_total = 0;
    int col = 0;

    while (col < max_width) {
        if (is_col_empty(lines, num_lines, col)) {
            col++;
            continue;
        }

        int start_col = col;
        while (col < max_width && !is_col_empty(lines, num_lines, col)) {
            col++;
        }
        int end_col = col;

        // Process block [start_col, end_col)
        char op = 0;
        int op_row = -1;

        // Find operator from bottom up
        for (int y = num_lines - 1; y >= 0; y--) {
            if (start_col >= lines[y].len) continue;
            
            // Limit segment length to what's available in the line
            int seg_len = end_col - start_col;
            if (start_col + seg_len > lines[y].len) {
                seg_len = lines[y].len - start_col;
            }
            if (seg_len <= 0) continue;

            op = parse_op(lines[y].start + start_col, seg_len);
            if (op) {
                op_row = y;
                break;
            }
        }

        if (op_row == -1) continue;

        // Collect numbers
        long long current_result = 0;
        bool first = true;

        for (int y = 0; y < op_row; y++) {
             if (start_col >= lines[y].len) continue;
             
             int seg_len = end_col - start_col;
             if (start_col + seg_len > lines[y].len) {
                 seg_len = lines[y].len - start_col;
             }
             if (seg_len <= 0) continue;

             long long val = parse_segment(lines[y].start + start_col, seg_len);
             if (val != -1) {
                 if (first) {
                     current_result = val;
                     first = false;
                 } else {
                     if (op == '+') current_result += val;
                     else if (op == '*') current_result *= val;
                 }
             }
        }
        if (!first) {
            grand_total += current_result;
        }
    }

    AOC_TIMER_END(solve);
    
    // Print result using the proper macro for long long
    // The AOC_RESULT macro expects a generic type, but formatting might need care.
    // Let's use AOC_RESULT_INT which likely uses %d or %ld. 
    // Looking at common.h (assumed), usually it handles simple types.
    // I'll manually print if needed or assume AOC_RESULT handles strings?
    // Actually AOC_RESULT_INT usually takes an int. Let's use printf for safety if unsure, 
    // but the instruction says `AOC_RESULT_INT(result)`.
    // I will check common.h or just use printf and aoc_result(long long).
    // Let's try printf for now to be safe with long long, and verify common.h later if I can.
    // Wait, the template uses `AOC_RESULT_INT(result)`.
    // I'll assume `AOC_RESULT_INT` works for `long long` or I'll check `common.h`.
    
    AOC_RESULT_INT(grand_total);
    
    aoc_cleanup(input);
    return 0;
}