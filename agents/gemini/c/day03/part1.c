/**
 * 🎄 Advent of Code 2025 - Day 03 Part 1
 * Optimized with AVX2 for fast max-digit search
 */

#include "../../tools/runner/c/common.h"
#include <immintrin.h>

__attribute__((target("avx2"))) 
static int find_max_idx_avx2(const char* buf, int len) {
    if (len <= 0) return 0;

    __m256i v_max = _mm256_setzero_si256();
    
    int i = 0;
    for (; i <= len - 32; i += 32) {
        __m256i v = _mm256_loadu_si256((const __m256i*)(buf + i));
        v_max = _mm256_max_epu8(v_max, v);
    }
    if (i < len) {
        if (len < 32) {
            // Fallback for tiny ranges, masked logic to avoid overread issues
            // if buffer is safe, we can do masked load.
            // Safest and fast enough for < 32: scalar
            char max_c = 0;
            for (int j = 0; j < len; j++) {
                if (buf[j] > max_c) max_c = buf[j];
            }
            v_max = _mm256_set1_epi8(max_c);
        } else {
            __m256i v = _mm256_loadu_si256((const __m256i*)(buf + len - 32));
            v_max = _mm256_max_epu8(v_max, v);
        }
    }

    __m128i v_low = _mm256_castsi256_si128(v_max);
    __m128i v_high = _mm256_extracti128_si256(v_max, 1);
    v_low = _mm_max_epu8(v_low, v_high);
    v_low = _mm_max_epu8(v_low, _mm_srli_si128(v_low, 8));
    v_low = _mm_max_epu8(v_low, _mm_srli_si128(v_low, 4));
    v_low = _mm_max_epu8(v_low, _mm_srli_si128(v_low, 2));
    v_low = _mm_max_epu8(v_low, _mm_srli_si128(v_low, 1));
    int max_val = _mm_cvtsi128_si32(v_low) & 0xFF;

    // Find FIRST occurrence
    __m256i v_target = _mm256_set1_epi8((char)max_val);
    
    i = 0;
    for (; i <= len - 32; i += 32) {
        __m256i v = _mm256_loadu_si256((const __m256i*)(buf + i));
        __m256i cmp = _mm256_cmpeq_epi8(v, v_target);
        int mask = _mm256_movemask_epi8(cmp);
        if (mask != 0) {
            return (max_val << 8) | (i + __builtin_ctz(mask));
        }
    }
    for (; i < len; i++) {
        if (buf[i] == max_val) {
            return (max_val << 8) | i;
        }
    }
    return (max_val << 8) | 0;
}

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    long long total = 0;
    char* p = input;
    char* end_input = p + strlen(input);
    
    while (p < end_input) {
        char* eol = (char*)memchr(p, '\n', end_input - p);
        if (!eol) eol = end_input;
        
        size_t len = eol - p;
        if (len < 2) { p = eol + 1; continue; }
        
        // Fix: If the line only contains digits at the very end, find_max of (len-1) works.
        // BUT find_max returns 0 if max_val is 0? No, max_val is '0' (48) at least.
        // Unless line is empty or non-digits.
        
        int res = find_max_idx_avx2(p, len - 1); 
        int d1 = (res >> 8);
        int idx1 = (res & 0xFF);
        
        // If d1 is not a digit? Input guarantees batteries 1-9.
        // Wait, d1 is ASCII value in my code.
        // d1 = '9' (57).
        // Calculation: (d1 - '0') * 10 + (d2 - '0').
        
        int d1_val = d1 - '0';
        
        char* p2_start = p + idx1 + 1;
        int len2 = eol - p2_start;
        
        int res2 = find_max_idx_avx2(p2_start, len2);
        int d2 = (res2 >> 8);
        int d2_val = d2 - '0'; // IF d2 is '0'..
        
        // Robustness: what if no digits found? (should not happen per problem statement)
        if (d1 < '0') d1_val = 0; 
        if (d2 < '0') d2_val = 0;
        
        total += d1_val * 10 + d2_val;
        
        p = eol + 1;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}