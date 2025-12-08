#include "../../tools/runner/c/common.h"
#include <immintrin.h>
#include <stdbool.h>

#define MAX_LINES 32
#define MAX_WIDTH 4096

__attribute__((target("avx2")))
int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);

    // 1. Geometry Scan (Scalar)
    // ---------------------------------------------------------
    char* line_starts[MAX_LINES];
    int line_lens[MAX_LINES];
    int num_lines = 0;
    int max_width = 0;

    char* ptr = input;
    while (*ptr && num_lines < MAX_LINES) {
        line_starts[num_lines] = ptr;
        
        // Find EOL
        char* eol = ptr;
        // Basic scan is fast enough for small N lines
        while (*eol && *eol != '\n') eol++;
        
        int len = eol - ptr;
        if (len > 0 && ptr[len-1] == '\r') len--;
        
        line_lens[num_lines] = len;
        if (len > max_width) max_width = len;
        
        num_lines++;
        if (*eol) ptr = eol + 1;
        else break;
    }
    if (num_lines > 0 && line_lens[num_lines-1] == 0) num_lines--;

    if (num_lines == 0) {
        AOC_RESULT_INT(0);
        aoc_cleanup(input);
        return 0;
    }

    // 2. Data Layout (Aligned Stack)
    // ---------------------------------------------------------
    int aligned_width = (max_width + 31) & ~31;
    
    // Using int32 for all columns to match register width
    _Alignas(32) int parsed_nums[MAX_WIDTH];
    _Alignas(32) int col_ops[MAX_WIDTH];
    _Alignas(32) int col_has_digit[MAX_WIDTH];
    _Alignas(32) int col_is_non_empty[MAX_WIDTH];
    _Alignas(32) char grid[MAX_LINES * MAX_WIDTH];

    // Padding grid
    // We only strictly need to pad the edges of the used width, 
    // but memset is cheap for 128KB.
    memset(grid, ' ', num_lines * aligned_width);
    for (int i = 0; i < num_lines; i++) {
        memcpy(grid + i * aligned_width, line_starts[i], line_lens[i]);
    }

    // 3. SIMD Processing (AVX2)
    // ---------------------------------------------------------
    const __m256i v_zero = _mm256_setzero_si256();
    const __m256i v_char_0 = _mm256_set1_epi32('0');
    const __m256i v_char_plus = _mm256_set1_epi32('+');
    const __m256i v_char_mul = _mm256_set1_epi32('*');
    const __m256i v_char_0_minus_1 = _mm256_set1_epi32('0' - 1);
    const __m256i v_char_9_plus_1 = _mm256_set1_epi32('9' + 1);
    const __m256i v_char_space = _mm256_set1_epi32(' ');
    const __m256i v_minus_1 = _mm256_set1_epi32(-1);

    for (int c = 0; c < aligned_width; c += 8) {
        __m256i v_acc = v_zero;
        __m256i v_has_d = v_zero;
        __m256i v_ops = v_zero;
        __m256i v_non_empty = v_zero;

        // Fully unrolled loop for small fixed height (e.g., 5-6 lines)?
        // Compiler usually unrolls this small loop automatically.
        for (int r = 0; r < num_lines; r++) {
            // Load 8 chars -> 8 ints
            __m256i v_c = _mm256_cvtepu8_epi32(_mm_loadl_epi64((__m128i const*)(grid + r * aligned_width + c)));
            
            // Digit Mask
            __m256i v_is_digit = _mm256_and_si256(
                _mm256_cmpgt_epi32(v_c, v_char_0_minus_1),
                _mm256_cmpgt_epi32(v_char_9_plus_1, v_c)
            );
            
            // Accumulate: acc = acc*10 + digit
            __m256i v_acc_10 = _mm256_add_epi32(_mm256_slli_epi32(v_acc, 3), _mm256_slli_epi32(v_acc, 1));
            __m256i v_digit = _mm256_sub_epi32(v_c, v_char_0);
            __m256i v_next_acc = _mm256_add_epi32(v_acc_10, v_digit);
            v_acc = _mm256_blendv_epi8(v_acc, v_next_acc, v_is_digit);
            
            v_has_d = _mm256_or_si256(v_has_d, v_is_digit);
            
            // Op Mask
            __m256i v_is_op = _mm256_or_si256(
                _mm256_cmpeq_epi32(v_c, v_char_plus),
                _mm256_cmpeq_epi32(v_c, v_char_mul)
            );
            v_ops = _mm256_blendv_epi8(v_ops, v_c, v_is_op);
            
            // Non-empty Mask
            v_non_empty = _mm256_or_si256(v_non_empty, 
                _mm256_xor_si256(_mm256_cmpeq_epi32(v_c, v_char_space), v_minus_1)
            );
        }

        _mm256_store_si256((__m256i*)(parsed_nums + c), v_acc);
        _mm256_store_si256((__m256i*)(col_ops + c), v_ops);
        _mm256_store_si256((__m256i*)(col_has_digit + c), v_has_d);
        _mm256_store_si256((__m256i*)(col_is_non_empty + c), v_non_empty);
    }

    // 4. Aggregation (Optimized Scan)
    // ---------------------------------------------------------
    long long grand_total = 0;
    int c = 0;
    
    // We can skip empty columns 8 at a time
    while (c < max_width) {
        // Fast skip empty
        if (!col_is_non_empty[c]) {
            // Check if we can skip 8 aligned
            if ((c & 7) == 0 && (c + 8 <= max_width)) {
                 __m256i v_check = _mm256_load_si256((__m256i const*)(col_is_non_empty + c));
                 if (_mm256_testz_si256(v_check, v_check)) {
                     c += 8;
                     continue;
                 }
            }
            c++;
            continue;
        }

        // Start of block
        int start = c;
        
        // Find end of block
        // Scan 8 at a time
        while (c < max_width) {
             if (!col_is_non_empty[c]) break;
             // Optim: Check 8 at a time if aligned
             if ((c & 7) == 0 && (c + 8 <= max_width)) {
                 __m256i v_check = _mm256_load_si256((__m256i const*)(col_is_non_empty + c));
                 // If all non-empty, v_check is all -1. 
                 // testc returns 1 if (NOT a) AND b is 0. 
                 // We want to know if ALL are set.
                 // movemask is easier.
                 int mask = _mm256_movemask_epi8(v_check);
                 if (mask == -1) { // All bytes are FF -> all ints are -1
                     c += 8;
                     continue;
                 }
             }
             c++;
        }
        int end = c;

        // Process block [start, end)
        int op = 0;
        // Search op
        for (int k = start; k < end; k++) {
            if (col_ops[k]) {
                op = col_ops[k];
                break;
            }
        }
        
        long long block_val = 0;
        bool first = true;
        
        // Aggregate
        for (int k = start; k < end; k++) {
            if (col_has_digit[k]) {
                if (first) {
                    block_val = parsed_nums[k];
                    first = false;
                } else {
                    if (op == '*') block_val *= parsed_nums[k];
                    else block_val += parsed_nums[k];
                }
            }
        }
        grand_total += block_val;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(grand_total);
    
    aoc_cleanup(input);
    return 0;
}
