#include "../../tools/runner/c/common.h"
#include <immintrin.h>
#include <string.h>

#define K 12

__attribute__((target("avx2")))
int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);
    unsigned long long total = 0;
    char* cursor = input;
    
    while (*cursor) {
        char* eol = strchr(cursor, '\n');
        int line_len = eol ? (int)(eol - cursor) : (int)strlen(cursor);
        
        if (line_len >= K) {
            int current_pos = 0;
            unsigned long long current_val = 0;
            
            for (int k = 0; k < K; k++) {
                // We need to choose 1 digit.
                // Remaining digits to choose after this: K - 1 - k
                // We must leave enough space: line_len - next_pos >= remaining
                // So max index we can pick is: line_len - remaining - 1
                // end = line_len - (K - k)
                
                int remaining_needed = K - 1 - k;
                int end_index = line_len - 1 - remaining_needed;
                
                // Search max in [cursor + current_pos, cursor + end_index]
                // length = end_index - current_pos + 1
                char* start_ptr = cursor + current_pos;
                int len = end_index - current_pos + 1;
                
                // 1. Find Max Value
                char found_max = '0';
                
                if (len >= 32) {
                    int sim_len = len & ~31;
                    __m256i max_v = _mm256_setzero_si256();
                    
                    for (int i = 0; i < sim_len; i += 32) {
                         __m256i v = _mm256_loadu_si256((__m256i*)(start_ptr + i));
                         max_v = _mm256_max_epu8(max_v, v);
                    }
                    // Reduce max_v
                    __m128i low = _mm256_castsi256_si128(max_v);
                    __m128i high = _mm256_extracti128_si256(max_v, 1);
                    low = _mm_max_epu8(low, high);
                    low = _mm_max_epu8(low, _mm_alignr_epi8(low, low, 8));
                    low = _mm_max_epu8(low, _mm_alignr_epi8(low, low, 4));
                    low = _mm_max_epu8(low, _mm_alignr_epi8(low, low, 2));
                    low = _mm_max_epu8(low, _mm_alignr_epi8(low, low, 1));
                    found_max = (char)_mm_extract_epi8(low, 0);
                    
                    // Handle remaining bytes scalar for max value
                    for (int i = sim_len; i < len; i++) {
                        if (start_ptr[i] > found_max) found_max = start_ptr[i];
                    }
                } else {
                    // Fully scalar for short ranges
                    for (int i = 0; i < len; i++) {
                        if (start_ptr[i] > found_max) found_max = start_ptr[i];
                    }
                }
                
                // 2. Find First Occurrence of found_max
                // We need the FIRST index in [0, len).
                // memchr is highly optimized (often SIMD).
                char* pos = (char*)memchr(start_ptr, found_max, len);
                // pos is guaranteed to be non-null since we just found the max from the data
                
                current_val = current_val * 10 + (found_max - '0');
                current_pos += (pos - start_ptr) + 1;
            }
            total += current_val;
        }
        
        if (!eol) break;
        cursor = eol + 1;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_UINT(total);
    aoc_cleanup(input);
    return 0;
}