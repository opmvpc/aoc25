#include "../../tools/runner/c/common.h"
#include <immintrin.h>
#include <string.h>

// Assumes input lines are 100 chars + 1 newline
#define LINE_LEN 100
#define STRIDE 101

__attribute__((target("avx2")))
int main(void) {
    char* input = aoc_read_input();
    
    // Ensure we don't segfault on SIMD loads near the end of buffer
    // aoc_read_input allocates a large buffer, so usually safe, 
    // but technically we should be careful.
    // The puzzle input has 200+ lines, it's fine.

    AOC_TIMER_START(solve);
    long long total = 0;
    char* cursor = input;
    
    // Constants
    const __m256i zeros = _mm256_setzero_si256();
    // Line length is 100. We need max of first 99 chars (indices 0..98).
    // 3 loads of 32 bytes cover 0..95.
    // The last few bytes (96..98) need handling.
    
    while (*cursor) {
        // 1. Find Max d1 in [0..98]
        
        // Unaligned loads are fine on modern CPUs
        __m256i v0 = _mm256_loadu_si256((__m256i*)(cursor));      // 0..31
        __m256i v1 = _mm256_loadu_si256((__m256i*)(cursor + 32)); // 32..63
        __m256i v2 = _mm256_loadu_si256((__m256i*)(cursor + 64)); // 64..95
        
        // For the tail (96..98), we can just load the last 32 bytes ending at 98
        // i.e., from 99 - 32 = 67. But that overlaps heavily with v2.
        // Or simpler: Just process the last 3 bytes scalar, or mask a load.
        // Let's load from 67 (index 67..98) to catch the end.
        // Wait, line len is 100. Valid d1 indices: 0 to 98.
        // Bytes at 96, 97, 98.
        // Let's load v3 covering the end, masking out index 99 (last char).
        // Simpler: Load vector ending at 98 (inclusive).
        // Address: cursor + 99 - 32 = cursor + 67.
        // This covers 67..98.
        __m256i v3 = _mm256_loadu_si256((__m256i*)(cursor + 67));
        
        // Find max char in all vectors
        __m256i max_v = _mm256_max_epu8(v0, v1);
        max_v = _mm256_max_epu8(max_v, v2);
        max_v = _mm256_max_epu8(max_v, v3);
        
        // Horizontal max to get single char
        // Permute and max until we have the max in all bytes
        __m256i perm = _mm256_permute2x128_si256(max_v, max_v, 1); // Swap 128-bit lanes
        __m256i m1 = _mm256_max_epu8(max_v, perm);
        perm = _mm256_shuffle_epi32(m1, _MM_SHUFFLE(1, 0, 3, 2)); // Swap 64-bit halves
        __m256i m2 = _mm256_max_epu8(m1, perm);
        perm = _mm256_shuffle_epi32(m2, _MM_SHUFFLE(2, 3, 0, 1)); // Swap 32-bit
        __m256i m3 = _mm256_max_epu8(m2, perm);
        perm = _mm256_shuffle_epi32(m3, _MM_SHUFFLE(0, 1, 2, 3)); // Check vs shifted? No, shuffle_epi32 works on 32-bit granularity.
        // Need byte granularity shuffle or just extract.
        // Easier: extract 32-bit int and do bytes.
        // Or use _mm256_extract_epi8 (AVX2 doesn't have 256 extract, only 128).
        // m3 has the max result in every 32-bit lane? Not quite.
        // Let's refine horizontal max.
        
        // Better approach for HMax on AVX2:
        // 1. y = _mm256_permute2x128_si256(x, x, 1); m1 = max(x, y);
        // 2. y = _mm256_shuffle_epi32(m1, _MM_SHUFFLE(1, 0, 3, 2)); m2 = max(m1, y); // Swap 64-bit
        // 3. y = _mm256_shufflelo_epi16(m2, _MM_SHUFFLE(1, 0, 3, 2)); m3 = max(m2, y); // Swap 32-bit? No.
        // 4. y = _mm256_shufflelo_epi16(m3, _MM_SHUFFLE(0, 1, 0, 1)); ...
        //
        // Alternative: Extract low 128 lane of m1, then usual SSE HMax.
        __m128i low = _mm256_castsi256_si128(m1); // m1 is max of high/low 128.
        // Now reduce low 128.
        __m128i max128 = _mm_max_epu8(low, _mm_alignr_epi8(low, low, 8));
        max128 = _mm_max_epu8(max128, _mm_alignr_epi8(max128, max128, 4));
        max128 = _mm_max_epu8(max128, _mm_alignr_epi8(max128, max128, 2));
        max128 = _mm_max_epu8(max128, _mm_alignr_epi8(max128, max128, 1));
        int d1_char = _mm_extract_epi8(max128, 0);
        
        // Now find the FIRST index of d1_char
        __m256i target = _mm256_set1_epi8((char)d1_char);
        int firstIdx = -1;
        
        unsigned int mask = _mm256_movemask_epi8(_mm256_cmpeq_epi8(v0, target));
        if (mask) {
            firstIdx = __builtin_ctz(mask);
        } else {
            mask = _mm256_movemask_epi8(_mm256_cmpeq_epi8(v1, target));
            if (mask) {
                firstIdx = 32 + __builtin_ctz(mask);
            } else {
                mask = _mm256_movemask_epi8(_mm256_cmpeq_epi8(v2, target));
                if (mask) {
                    firstIdx = 64 + __builtin_ctz(mask);
                } else {
                    // Check last part (cursor + 67)
                    // We need to be careful because this overlaps.
                    // We want the first occurance in 0..98.
                    // We checked 0..95. Remaining is 96, 97, 98.
                    // v3 covers 67..98.
                    mask = _mm256_movemask_epi8(_mm256_cmpeq_epi8(v3, target));
                    // mask bits correspond to 67, 68... 98.
                    // We only care about bits >= (96 - 67) = 29.
                    // Actually, if we found nothing before 96, it MUST be in 96, 97, 98.
                    // So just take the first bit in mask that is >= 29.
                    // Wait, standard ctz finds the first bit.
                    // If the char exists at 67 (already checked in v2), it will trigger.
                    // But we know it wasn't in v2 (indices 64..95).
                    // So in v3 (indices 67..98), the char can only be at 96, 97, 98.
                    // (Because 67..95 were covered by v2 and yielded no match).
                    // So valid bits are at indices corresponding to 96, 97, 98 relative to 67.
                    // 96 - 67 = 29.
                    // So we can just ctz(mask) and add 67?
                    // Yes, because `mask` will only have bits set for indices >= 96.
                    // Why? Because indices < 96 were checked in v2 and failed.
                    // PROOF: v2 covers 64..95. v3 covers 67..98.
                    // Overlap is 67..95. If d1 was there, v2 check would have caught it.
                    // So mask for v3 can only have bits set at 29, 30, 31.
                    firstIdx = 67 + __builtin_ctz(mask);
                }
            }
        }
        
        // 2. Find Max d2 in [firstIdx+1 ... 99]
        // Start searching from firstIdx + 1.
        int start_offset = firstIdx + 1;
        int remaining = 100 - start_offset;
        
        int d2_char = '0';
        
        // Simple scalar loop for d2 might be fast enough if remaining is small,
        // but it can be up to 99.
        // Let's use SIMD if remaining >= 32.
        // But unaligned loads from start_offset are easiest.
        
        char* p2 = cursor + start_offset;
        
        // Optimization: If d1 is '9', d2 is likely found quickly or computed.
        // Just run a tight loop or SIMD max.
        // Given we already payed for SIMD setup, let's just use scalar for simplicity/code size unless slow.
        // Actually, for max performance, SIMD the tail too.
        
        // Tail SIMD:
        // Calculate max of p2 ... cursor+100
        // We can load unaligned vectors from p2 until end.
        
        __m256i max_d2_v = _mm256_setzero_si256(); // or set1('0')
        
        int r = remaining;
        int off = 0;
        while (r >= 32) {
             __m256i v = _mm256_loadu_si256((__m256i*)(p2 + off));
             max_d2_v = _mm256_max_epu8(max_d2_v, v);
             off += 32;
             r -= 32;
        }
        if (r > 0) {
            // Load last 32 bytes of the line (ending at 99)
            // cursor + 100 - 32 = cursor + 68.
            // Be careful: we only want to consider chars >= p2.
            // If we load from before p2, we might pick up d1 or earlier stuff.
            // So we must mask or use scalar for the rest.
            // Scalar for < 32 items is extremely fast (unrolled).
            for (int k = 0; k < r; k++) {
                char c = p2[off + k];
                if (c > d2_char) d2_char = c;
            }
        }
        
        // Reduce max_d2_v
        if (remaining >= 32) {
            __m128i low2 = _mm256_castsi256_si128(max_d2_v); // low 128
            __m128i high2 = _mm256_extracti128_si256(max_d2_v, 1);
            low2 = _mm_max_epu8(low2, high2);
            low2 = _mm_max_epu8(low2, _mm_alignr_epi8(low2, low2, 8));
            low2 = _mm_max_epu8(low2, _mm_alignr_epi8(low2, low2, 4));
            low2 = _mm_max_epu8(low2, _mm_alignr_epi8(low2, low2, 2));
            low2 = _mm_max_epu8(low2, _mm_alignr_epi8(low2, low2, 1));
            int max_simd = _mm_extract_epi8(low2, 0);
            if (max_simd > d2_char) d2_char = max_simd;
        }

        total += (d1_char - '0') * 10 + (d2_char - '0');
        
        // Advance cursor
        // Check if we have next line
        if (*(cursor + 100) == '\0') break; 
        cursor += STRIDE;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total);
    aoc_cleanup(input);
    return 0;
}
