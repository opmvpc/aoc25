/**
 * 🎄 Advent of Code 2025 - Day 04 Part 1
 * Optimized with AVX2 SIMD
 */

#include "../../tools/runner/c/common.h"
#include <immintrin.h>

__attribute__((target("avx2")))
static long long solve_avx2(uint8_t* grid, int w, int h, int pw, int stride_input, char* input) {
    long long count = 0;
    
    // AVX2 Processing
    int o_tl = -pw - 1; int o_t = -pw; int o_tr = -pw + 1;
    int o_l  = -1;                     int o_r  = 1;
    int o_bl = pw - 1;  int o_b = pw;  int o_br = pw + 1;
    
    __m256i v_neg_4 = _mm256_set1_epi8(-4);
    
    for (int r = 1; r <= h; r++) {
        uint8_t* row_ptr = grid + r * pw + 1;
        int c = 0;
        
        // Process 32 blocks
        for (; c <= w - 32; c += 32) {
            uint8_t* p = row_ptr + c;
            __m256i center = _mm256_loadu_si256((__m256i*)p);
            
            if (_mm256_testz_si256(center, center)) continue;
            
            __m256i sum = _mm256_loadu_si256((__m256i*)(p + o_tl));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_t)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_tr)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_l)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_r)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_bl)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_b)));
            sum = _mm256_add_epi8(sum, _mm256_loadu_si256((__m256i*)(p + o_br)));
            
            __m256i mask = _mm256_cmpgt_epi8(sum, v_neg_4);
            mask = _mm256_and_si256(mask, center);
            
            unsigned int bits = _mm256_movemask_epi8(mask);
            count += __builtin_popcount(bits);
        }
        
        // Cleanup
        for (; c < w; c++) {
            uint8_t* p = row_ptr + c;
            if (*p) {
                int adj = 0;
                adj += (p[o_tl] & 1); adj += (p[o_t] & 1); adj += (p[o_tr] & 1);
                adj += (p[o_l] & 1);                       adj += (p[o_r] & 1);
                adj += (p[o_bl] & 1); adj += (p[o_b] & 1); adj += (p[o_br] & 1);
                if (adj < 4) count++;
            }
        }
    }
    return count;
}

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);

    char* p = input;
    int w = 0;
    while (*p && *p != '\n' && *p != '\r') { w++; p++; }
    if (w == 0) { aoc_cleanup(input); return 0; }
    
    int stride_input = w;
    if (*p == '\r') stride_input++;
    if (*p == '\n') stride_input++;
    else if (*(p+1) == '\n') stride_input += 2;

    p = input;
    while (*p && *p != '\n') p++;
    if (*p == '\n') stride_input = (p - input) + 1;
    else stride_input = w;

    int h = 0;
    int len = 0;
    p = input;
    while (*p) { if (*p == '\n') h++; len++; p++; }
    if (len > 0 && input[len-1] != '\n') h++;

    int row_padding = 32;
    int stride = (w + row_padding + 31) & ~31;
    int pw = stride;
    int ph = h + 2;
    
    uint8_t* grid = (uint8_t*)aligned_alloc(32, pw * ph);
    memset(grid, 0, pw * ph); 
    
    for (int r = 0; r < h; r++) {
        char* src = input + r * stride_input;
        uint8_t* dst = grid + (r + 1) * pw + 1;
        for (int c = 0; c < w; c++) {
            dst[c] = (src[c] == '@') ? 0xFF : 0x00;
        }
    }
    
    long long count = solve_avx2(grid, w, h, pw, stride_input, input);

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(count);
    free(grid);
    aoc_cleanup(input);
    return 0;
}