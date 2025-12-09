#include "tools/runner/c/common.h"
#include <immintrin.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------
#define MAX_N 1024
__attribute__((aligned(32))) int32_t xs[MAX_N];
__attribute__((aligned(32))) int32_t ys[MAX_N];
int n_points = 0;

// -----------------------------------------------------------------------------
// Algorithms
// -----------------------------------------------------------------------------

// 1. Brute Force Scalar
long long solve_scalar(int n) {
    long long max_area = 0;
    for (int i = 0; i < n; i++) {
        int xi = xs[i];
        int yi = ys[i];
        for (int j = i + 1; j < n; j++) {
            int w = abs(xi - xs[j]);
            int h = abs(yi - ys[j]);
            long long area = (long long)(w + 1) * (h + 1);
            if (area > max_area) max_area = area;
        }
    }
    return max_area;
}

// 2. SIMD AVX2
__attribute__((target("avx2")))
long long solve_simd(int n) {
    int padded_n = (n + 7) & ~7;
    // Pad
    for (int i = n; i < padded_n; i++) { xs[i] = xs[0]; ys[i] = ys[0]; }
    
    __m256i global_max = _mm256_setzero_si256();
    __m256i v_one = _mm256_set1_epi32(1);

    for (int i = 0; i < n; i++) {
        __m256i v_xi = _mm256_set1_epi32(xs[i]);
        __m256i v_yi = _mm256_set1_epi32(ys[i]);
        
        for (int j = 0; j < padded_n; j += 8) {
            __m256i v_xj = _mm256_load_si256((__m256i*)&xs[j]);
            __m256i v_yj = _mm256_load_si256((__m256i*)&ys[j]);
            
            __m256i diff_x = _mm256_add_epi32(_mm256_abs_epi32(_mm256_sub_epi32(v_xi, v_xj)), v_one);
            __m256i diff_y = _mm256_add_epi32(_mm256_abs_epi32(_mm256_sub_epi32(v_yi, v_yj)), v_one);
            
            __m128i dx_lo_128 = _mm256_castsi256_si128(diff_x);
            __m128i dy_lo_128 = _mm256_castsi256_si128(diff_y);
            __m256i dx_lo_64 = _mm256_cvtepu32_epi64(dx_lo_128);
            __m256i dy_lo_64 = _mm256_cvtepu32_epi64(dy_lo_128);
            __m256i area_lo = _mm256_mul_epu32(dx_lo_64, dy_lo_64);
            
            __m128i dx_hi_128 = _mm256_extracti128_si256(diff_x, 1);
            __m128i dy_hi_128 = _mm256_extracti128_si256(diff_y, 1);
            __m256i dx_hi_64 = _mm256_cvtepu32_epi64(dx_hi_128);
            __m256i dy_hi_64 = _mm256_cvtepu32_epi64(dy_hi_128);
            __m256i area_hi = _mm256_mul_epu32(dx_hi_64, dy_hi_64);
            
            __m256i mask_lo = _mm256_cmpgt_epi64(area_lo, global_max);
            global_max = _mm256_blendv_epi8(global_max, area_lo, mask_lo);
            __m256i mask_hi = _mm256_cmpgt_epi64(area_hi, global_max);
            global_max = _mm256_blendv_epi8(global_max, area_hi, mask_hi);
        }
    }
    
    uint64_t tmp[4];
    _mm256_storeu_si256((__m256i*)tmp, global_max);
    uint64_t max_val = tmp[0];
    if (tmp[1] > max_val) max_val = tmp[1];
    if (tmp[2] > max_val) max_val = tmp[2];
    if (tmp[3] > max_val) max_val = tmp[3];
    return (long long)max_val;
}

// 3. Convex Hull Approach (Graham Scan or Monotone Chain)
typedef struct { int32_t x, y; } Point;
Point hull[MAX_N];

long long cross_product(Point a, Point b, Point o) {
    return (long long)(a.x - o.x) * (b.y - o.y) - (long long)(a.y - o.y) * (b.x - o.x);
}

int cmp_point(const void* a, const void* b) {
    Point* p1 = (Point*)a;
    Point* p2 = (Point*)b;
    if (p1->x != p2->x) return p1->x - p2->x;
    return p1->y - p2->y;
}

long long solve_hull(int n) {
    Point pts[MAX_N];
    for(int i=0; i<n; i++) { pts[i].x = xs[i]; pts[i].y = ys[i]; }
    
    qsort(pts, n, sizeof(Point), cmp_point);
    
    int k = 0;
    // Build Lower Hull
    for (int i = 0; i < n; ++i) {
        while (k >= 2 && cross_product(pts[i], hull[k-1], hull[k-2]) <= 0) k--;
        hull[k++] = pts[i];
    }
    // Build Upper Hull
    for (int i = n - 2, t = k + 1; i >= 0; i--) {
        while (k >= t && cross_product(pts[i], hull[k-1], hull[k-2]) <= 0) k--;
        hull[k++] = pts[i];
    }
    
    // Hull has k points (last is duplicate of first)
    // Brute force on Hull
    long long max_area = 0;
    for (int i = 0; i < k; i++) {
        for (int j = i + 1; j < k; j++) {
             long long w = abs(hull[i].x - hull[j].x);
             long long h = abs(hull[i].y - hull[j].y);
             long long area = (w + 1) * (h + 1);
             if (area > max_area) max_area = area;
        }
    }
    return max_area;
}


// -----------------------------------------------------------------------------
// Main Bench
// -----------------------------------------------------------------------------
int main() {
    // Read stdin
    char* input = aoc_read_input();
    
    // Parse
    int n = 0;
    int num = 0;
    int is_parsing = 0;
    int is_y = 0;
    char* p = input;
    while (*p) {
        if (*p >= '0') {
            num = num * 10 + (*p - '0');
            is_parsing = 1;
        } else {
            if (is_parsing) {
                if (!is_y) { xs[n] = num; is_y = 1; } 
                else { ys[n] = num; is_y = 0; n++; }
                num = 0; is_parsing = 0;
            }
        }
        p++;
    }
    if (is_parsing) { ys[n] = num; n++; }
    n_points = n;
    
    printf("N = %d\n", n);

    // Warmup
    solve_scalar(n);
    
    #define RUNS 1000
    
    // Bench Scalar
    AOC_TIMER_START(scalar);
    long long r1 = 0;
    for(int i=0; i<RUNS; i++) r1 = solve_scalar(n);
    AOC_TIMER_END(scalar);
    
    // Bench SIMD
    AOC_TIMER_START(simd);
    long long r2 = 0;
    for(int i=0; i<RUNS; i++) r2 = solve_simd(n);
    AOC_TIMER_END(simd);
    
    // Bench Hull
    AOC_TIMER_START(hull);
    long long r3 = 0;
    for(int i=0; i<RUNS; i++) r3 = solve_hull(n);
    AOC_TIMER_END(hull);
    
    printf("Scalar Result: %lld\n", r1);
    printf("SIMD Result:   %lld\n", r2);
    printf("Hull Result:   %lld\n", r3);
    
    return 0;
}
