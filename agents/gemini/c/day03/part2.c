/**
 * 🎄 Advent of Code 2025 - Day 03 Part 2
 * Optimized with AVX2 for fast max-digit search (Subsequence)
 */

#include "../../tools/runner/c/common.h"
#include <immintrin.h>

// Same helper
__attribute__((target("avx2")))
static int find_max_idx_avx2(const char* buf, int len) {
    if (len <= 0) return -1; // Should not happen

    __m256i v_max = _mm256_setzero_si256();
    
    int i = 0;
    for (; i <= len - 32; i += 32) {
        __m256i v = _mm256_loadu_si256((const __m256i*)(buf + i));
        v_max = _mm256_max_epu8(v_max, v);
    }
    if (i < len) {
        if (len < 32) {
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
    
    const int K = 12;
    
    while (p < end_input) {
        char* eol = (char*)memchr(p, '\n', end_input - p);
        if (!eol) eol = end_input;
        
        size_t len = eol - p;
        if (len < K) { p = eol + 1; continue; }
        
        long long val = 0;
        char* current_pos = p;
        
        for (int k = 0; k < K; k++) {
            // Find largest digit in valid range
            int rem_needed = K - 1 - k;
            char* search_limit = eol - rem_needed;
            size_t search_len = search_limit - current_pos;
            
            int res = find_max_idx_avx2(current_pos, search_len);
            int d = res >> 8;
            int idx = res & 0xFF;
            
            val = val * 10 + (d - '0');
            current_pos = current_pos + idx + 1;
        }
        
        total += val;
        p = eol + 1;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}