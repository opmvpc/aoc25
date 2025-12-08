#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdint.h>
#include <immintrin.h>

// Max width supported for bitboards (3 * 64 = 192)
#define MAX_WIDTH 192

__attribute__((target("avx2,popcnt"))) 
int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);

    // 1. Setup
    // ---------------------------------------------------------
    // Detect width and S
    char* ptr = input;
    char* eol = strchr(ptr, '\n');
    int width = eol ? (eol - ptr) : strlen(ptr);
    if (width > 0 && ptr[width-1] == '\r') width--;
    
    int stride = eol ? (eol - ptr + 1) : width; // Distance to next line start
    
    // Check for S in first line? Or scan lines.
    // Assuming S is found quickly.
    
    uint64_t active[3] = {0, 0, 0};
    long long split_count = 0;
    
    // Find S and init
    // Scan all input for S if not in first line
    char* s_ptr = strchr(input, 'S');
    if (s_ptr) {
        // Calculate coordinate
        // This requires knowing which row/col.
        // But we simulate row by row.
        // We need to start simulation at the row containing S.
        
        // Let's find S, calculate x, and start ptr at next line.
        // To find x: (s_ptr - input) % (stride).
        // BUT stride might vary (last line?).
        // Safe way: Scan lines loop until S found.
        
        ptr = input;
        while (*ptr) {
            // Check this line
            char* line_end = ptr + width; // approximation
            if (s_ptr >= ptr && s_ptr < ptr + stride) {
                // Found S in this line
                int x = s_ptr - ptr;
                active[x/64] |= (1ULL << (x%64));
                ptr += stride; // Start simulation from next line
                break;
            }
            ptr += stride;
        }
    } else {
        // No S?
        ptr += strlen(ptr); // Skip to end
    }

    // 2. Simulation Loop (Bitboard)
    // ---------------------------------------------------------
    while (*ptr) {
        // Construct split mask for this row
        uint64_t split[3] = {0, 0, 0};
        
        // We assume width is constant (rectangular grid).
        // Use AVX2 to find '^'
        int i = 0;
        int limit = width - 31;
        for (; i < limit; i += 32) {
            __m256i v_data = _mm256_loadu_si256((__m256i const*)(ptr + i));
            uint32_t mask = _mm256_movemask_epi8(_mm256_cmpeq_epi8(v_data, _mm256_set1_epi8('^')));
            split[i/64] |= ((uint64_t)mask << (i%64));
        }
        for (; i < width; i++) {
            if (ptr[i] == '^') split[i/64] |= (1ULL << (i%64));
        }
        
        // Calculate hits
        uint64_t hits[3];
        hits[0] = active[0] & split[0];
        hits[1] = active[1] & split[1];
        hits[2] = active[2] & split[2];
        
        // Count
        split_count += _mm_popcnt_u64(hits[0]);
        split_count += _mm_popcnt_u64(hits[1]);
        split_count += _mm_popcnt_u64(hits[2]);
        
        // Propagate
        uint64_t normal[3];
        normal[0] = active[0] & ~split[0];
        normal[1] = active[1] & ~split[1];
        normal[2] = active[2] & ~split[2];
        
        // Left Shift (x+1) -> Bitwise Left << 1
        // Word 0 gets 0 at bit 0.
        // Word 1 gets Word 0 bit 63 at bit 0.
        uint64_t left[3];
        left[0] = (hits[0] << 1);
        left[1] = (hits[1] << 1) | (hits[0] >> 63);
        left[2] = (hits[2] << 1) | (hits[1] >> 63);
        
        // Right Shift (x-1) -> Bitwise Right >> 1
        // Word 0 gets Word 1 bit 0 at bit 63.
        // Word 2 gets 0 at bit 63.
        uint64_t right[3];
        right[0] = (hits[0] >> 1) | (hits[1] << 63);
        right[1] = (hits[1] >> 1) | (hits[2] << 63);
        right[2] = (hits[2] >> 1);
        
        active[0] = normal[0] | left[0] | right[0];
        active[1] = normal[1] | left[1] | right[1];
        active[2] = normal[2] | left[2] | right[2];
        
        if ((active[0] | active[1] | active[2]) == 0) break;
        
        ptr += stride;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(split_count);
    
    aoc_cleanup(input);
    return 0;
}
