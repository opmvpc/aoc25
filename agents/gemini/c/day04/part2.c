/**
 * 🎄 Advent of Code 2025 - Day 04 Part 2
 * Optimized with AVX2 Init + Fast Queue
 */

#include "../../tools/runner/c/common.h"
#include <immintrin.h>

__attribute__((target("avx2"))) 
static void init_avx2(uint8_t* grid, int w, int h, int pw, uint16_t* queue, int* q_tail) {
    int o_tl = -pw - 1; int o_t = -pw; int o_tr = -pw + 1;
    int o_l  = -1;                     int o_r  = 1;
    int o_bl = pw - 1;  int o_b = pw;  int o_br = pw + 1;
    
    __m256i v_zero = _mm256_setzero_si256();
    __m256i v_neg_4 = _mm256_set1_epi8(-4);
    
    int tail = *q_tail;

    for (int r = 1; r <= h; r++) {
        uint8_t* row_ptr = grid + r * pw + 1;
        int c = 0;
        
        for (; c <= w - 32; c += 32) {
            uint8_t* p = row_ptr + c;
            __m256i center = _mm256_loadu_si256((__m256i*)p);
            if (_mm256_testz_si256(center, center)) continue;
            
            __m256i sum = v_zero;
            
            #define ACC(offset) \
                sum = _mm256_add_epi8(sum, _mm256_cmpgt_epi8(v_zero, _mm256_loadu_si256((__m256i*)(p + offset))))
            
            ACC(o_tl); ACC(o_t); ACC(o_tr);
            ACC(o_l);            ACC(o_r);
            ACC(o_bl); ACC(o_b); ACC(o_br);
            
            __m256i count = _mm256_sub_epi8(v_zero, sum);
            __m256i result = _mm256_or_si256(center, count);
            _mm256_storeu_si256((__m256i*)p, result);
            
            __m256i mask = _mm256_cmpgt_epi8(sum, v_neg_4);
            mask = _mm256_and_si256(mask, center);
            
            unsigned int bits = _mm256_movemask_epi8(mask);
            while (bits) {
                int idx = __builtin_ctz(bits);
                queue[tail++] = (r * pw + 1 + c + idx);
                bits &= ~(1 << idx);
            }
        }
        
        for (; c < w; c++) {
            uint8_t* p = row_ptr + c;
            if (*p & 0x80) {
                int cnt = 0;
                #define SCALAR_ACC(off) cnt += (p[off] >> 7)
                SCALAR_ACC(o_tl); SCALAR_ACC(o_t); SCALAR_ACC(o_tr);
                SCALAR_ACC(o_l);             SCALAR_ACC(o_r);
                SCALAR_ACC(o_bl); SCALAR_ACC(o_b); SCALAR_ACC(o_br);
                
                *p |= cnt;
                if (cnt < 4) {
                    queue[tail++] = (r * pw + 1 + c);
                }
            }
        }
    }
    *q_tail = tail;
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
    int size = pw * ph;
    
    uint8_t* grid = (uint8_t*)aligned_alloc(32, size);
    memset(grid, 0, size);
    
    uint16_t* queue = (uint16_t*)malloc(size * sizeof(uint16_t));
    int q_head = 0;
    int q_tail = 0;
    
    for (int r = 0; r < h; r++) {
        char* src = input + r * stride_input;
        uint8_t* dst = grid + (r + 1) * pw + 1;
        for (int c = 0; c < w; c++) {
            dst[c] = (src[c] == '@') ? 0x80 : 0x00;
        }
    }
    
    init_avx2(grid, w, h, pw, queue, &q_tail);
    
    long long total_removed = 0;
    
    int o_tl = -pw - 1; int o_t = -pw; int o_tr = -pw + 1;
    int o_l  = -1;                     int o_r  = 1;
    int o_bl = pw - 1;  int o_b = pw;  int o_br = pw + 1;
    
    const int offsets[8] = {o_tl, o_t, o_tr, o_l, o_r, o_bl, o_b, o_br};
    const int IS_ROLL = 0x80;
    const int COUNT_MASK = 0x0F;
    
    while (q_head < q_tail) {
        int idx = queue[q_head++];
        
        grid[idx] &= ~IS_ROLL; 
        total_removed++;
        
        #define UPDATE(i) \
        {\
            int n_idx = idx + offsets[i]; \
            uint8_t val = grid[n_idx]; \
            if (val & IS_ROLL) { \
                val--; \
                grid[n_idx] = val; \
                if ((val & COUNT_MASK) == 3) { \
                    queue[q_tail++] = n_idx; \
                } \
            } \
        }\
        
        UPDATE(0); UPDATE(1); UPDATE(2);
        UPDATE(3);            UPDATE(4);
        UPDATE(5); UPDATE(6); UPDATE(7);
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(total_removed);
    
    free(queue);
    free(grid);
    aoc_cleanup(input);
    return 0;
}