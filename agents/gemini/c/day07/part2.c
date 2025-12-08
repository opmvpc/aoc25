#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdint.h>

#define MAX_WIDTH 256

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);

    // Double buffering
    uint64_t buf1[MAX_WIDTH];
    uint64_t buf2[MAX_WIDTH];
    // Clear initial buffers
    memset(buf1, 0, sizeof(buf1));
    memset(buf2, 0, sizeof(buf2));

    uint64_t* active = buf1;
    uint64_t* next = buf2;

    uint64_t total_exited = 0;

    // 1. Setup
    char* ptr = input;
    // Find width and S
    char* line = ptr;
    char* eol = strchr(ptr, '\n');
    int width = eol ? (eol - ptr) : strlen(ptr);
    if (width > 0 && line[width-1] == '\r') width--;

    // Find S
    int min_x = 0, max_x = 0;
    
    // Scan for S
    // We assume S is on the first line or we scan lines until we find it.
    // The problem implies S is the entry point.
    // We can scan full input for S, but we need row-by-row simulation.
    // State 0: Scan for S. State 1: Simulate.
    
    int state = 0; // 0=Search S, 1=Simulate
    
    // Optimize: Pre-calculate line stride?
    // Assuming constant stride (width + newline).
    int stride = width + 1; // +1 for \n
    // Check for \r
    if (eol && eol < input + strlen(input) && *(eol-1) == '\r') {
        // This is complex if mixed. Assume \n or \r\n consistent.
        // Let's just use `strchr` loop, it's fast enough for 142 lines.
    }

    while (*ptr) {
        // Parse line bounds
        char* curr_line = ptr;
        // Fast skip to next line
        // We can just add stride if constant, but let's be safe with scan
        // Scan for \n
        char* next_ptr = curr_line;
        while (*next_ptr && *next_ptr != '\n') next_ptr++;
        int len = next_ptr - curr_line;
        if (len > 0 && curr_line[len-1] == '\r') len--;
        
        // Prepare next ptr
        if (*next_ptr) ptr = next_ptr + 1;
        else ptr = next_ptr;

        if (len == 0) continue;
        if (len > MAX_WIDTH) len = MAX_WIDTH;

        if (state == 0) {
            // Find S
            char* s_ptr = memchr(curr_line, 'S', len);
            if (s_ptr) {
                int s_idx = s_ptr - curr_line;
                active[s_idx] = 1;
                min_x = s_idx;
                max_x = s_idx;
                state = 1;
            }
        } else {
            // Simulate
            // Only iterate active window [min_x, max_x]
            // We need to write to `next` in range [min_x-1, max_x+1]
            // Ensure bounds
            int start_loop = min_x;
            int end_loop = (max_x < len) ? max_x : len - 1;
            
            // Clear `next` buffer in the range we are about to write to
            // New range could be [min_x-1, max_x+1]
            int clr_min = (min_x > 0) ? min_x - 1 : 0;
            int clr_max = (max_x + 1 < MAX_WIDTH) ? max_x + 1 : MAX_WIDTH - 1;
            // Memset is fast, but for small ranges loop might be faster?
            // Range is small (start 1, grows to ~140).
            // memset is generally optimized.
            memset(next + clr_min, 0, (clr_max - clr_min + 1) * sizeof(uint64_t));

            int new_min = MAX_WIDTH;
            int new_max = -1;
            
            for (int x = start_loop; x <= end_loop; x++) {
                uint64_t cnt = active[x];
                if (cnt == 0) continue;

                if (curr_line[x] == '^') {
                    // Split
                    // Left
                    if (x > 0) {
                        next[x-1] += cnt;
                        if (x-1 < new_min) new_min = x-1;
                        if (x-1 > new_max) new_max = x-1;
                    } else {
                        total_exited += cnt;
                    }
                    // Right
                    if (x + 1 < len) {
                        next[x+1] += cnt;
                        if (x+1 < new_min) new_min = x+1;
                        if (x+1 > new_max) new_max = x+1;
                    } else {
                        total_exited += cnt;
                    }
                } else {
                    // Continue
                    next[x] += cnt;
                    if (x < new_min) new_min = x;
                    if (x > new_max) new_max = x;
                }
            }
            
            // Handle drops if width narrowed (ragged)
            // If previous max_x >= len, those dropped off.
            if (max_x >= len) {
                for (int x = len; x <= max_x; x++) {
                    total_exited += active[x];
                }
            }
            
            if (new_max == -1) {
                // No active beams left on board
                min_x = 0; max_x = -1; // Empty range
            } else {
                min_x = new_min;
                max_x = new_max;
            }

            // Swap pointers
            uint64_t* tmp = active;
            active = next;
            next = tmp;
        }
    }

    // Sum remaining
    if (max_x >= min_x) {
        for (int x = min_x; x <= max_x; x++) {
            total_exited += active[x];
        }
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_UINT(total_exited);
    
    aoc_cleanup(input);
    return 0;
}
