/**
 * Advent of Code 2025 - Day 09 Part 2
 * Movie Theater - Find largest rectangle using only red/green tiles
 *
 * ULTRA-OPTIMIZED: Sort pairs by area, early exit on first valid
 */

#include "../../tools/runner/c/common.h"
#include <stdlib.h>
#include <immintrin.h>

#define MAX_POINTS 600
#define MAX_PAIRS (MAX_POINTS * MAX_POINTS / 2)

static int px[MAX_POINTS];
static int py[MAX_POINTS];
static int n;

// Separate horizontal and vertical segments (aligned for SIMD)
static int h_y[MAX_POINTS] __attribute__((aligned(32)));
static int h_x1[MAX_POINTS] __attribute__((aligned(32)));
static int h_x2[MAX_POINTS] __attribute__((aligned(32)));
static int v_x[MAX_POINTS] __attribute__((aligned(32)));
static int v_y1[MAX_POINTS] __attribute__((aligned(32)));
static int v_y2[MAX_POINTS] __attribute__((aligned(32)));
static int nh, nv;

// Pairs for sorting
typedef struct { long long area; short i, j; } Pair;
static Pair pairs[MAX_PAIRS];
static int npairs;

// Check if rectangle is valid - AVX2 optimized
__attribute__((target("avx2")))
static int isValidRect(int minX, int maxX, int minY, int maxY) {
    int cross_bl = 0, cross_br = 0, cross_tl = 0, cross_tr = 0;
    int on_bl = 0, on_br = 0, on_tl = 0, on_tr = 0;

    __m256i vminX = _mm256_set1_epi32(minX);
    __m256i vmaxX = _mm256_set1_epi32(maxX);
    __m256i vminY = _mm256_set1_epi32(minY);
    __m256i vmaxY = _mm256_set1_epi32(maxY);

    // H segments: check edge crossing with SIMD
    int i = 0;
    for (; i + 8 <= nh; i += 8) {
        __m256i vsy = _mm256_load_si256((__m256i*)(h_y + i));
        __m256i vsx1 = _mm256_load_si256((__m256i*)(h_x1 + i));
        __m256i vsx2 = _mm256_load_si256((__m256i*)(h_x2 + i));
        // Left edge cross: minX > sx1 && minX < sx2 && sy > minY && sy < maxY
        __m256i c1 = _mm256_and_si256(_mm256_cmpgt_epi32(vminX, vsx1), _mm256_cmpgt_epi32(vsx2, vminX));
        __m256i c2 = _mm256_and_si256(_mm256_cmpgt_epi32(vsy, vminY), _mm256_cmpgt_epi32(vmaxY, vsy));
        __m256i crossL = _mm256_and_si256(c1, c2);
        // Right edge cross
        c1 = _mm256_and_si256(_mm256_cmpgt_epi32(vmaxX, vsx1), _mm256_cmpgt_epi32(vsx2, vmaxX));
        __m256i crossR = _mm256_and_si256(c1, c2);
        if (_mm256_movemask_epi8(_mm256_or_si256(crossL, crossR))) return 0;
    }
    // Scalar for H boundary + remaining
    for (int j = 0; j < nh; j++) {
        int sy = h_y[j], sx1 = h_x1[j], sx2 = h_x2[j];
        if (minY == sy && minX >= sx1 && minX <= sx2) on_bl = 1;
        if (minY == sy && maxX >= sx1 && maxX <= sx2) on_br = 1;
        if (maxY == sy && minX >= sx1 && minX <= sx2) on_tl = 1;
        if (maxY == sy && maxX >= sx1 && maxX <= sx2) on_tr = 1;
    }
    for (; i < nh; i++) {
        int sy = h_y[i], sx1 = h_x1[i], sx2 = h_x2[i];
        if (sy > minY && sy < maxY) {
            if (minX > sx1 && minX < sx2) return 0;
            if (maxX > sx1 && maxX < sx2) return 0;
        }
    }

    // V segments: check edge crossing with SIMD
    i = 0;
    for (; i + 8 <= nv; i += 8) {
        __m256i vsx = _mm256_load_si256((__m256i*)(v_x + i));
        __m256i vsy1 = _mm256_load_si256((__m256i*)(v_y1 + i));
        __m256i vsy2 = _mm256_load_si256((__m256i*)(v_y2 + i));
        // Bottom edge cross: minY > sy1 && minY < sy2 && sx > minX && sx < maxX
        __m256i c1 = _mm256_and_si256(_mm256_cmpgt_epi32(vminY, vsy1), _mm256_cmpgt_epi32(vsy2, vminY));
        __m256i c2 = _mm256_and_si256(_mm256_cmpgt_epi32(vsx, vminX), _mm256_cmpgt_epi32(vmaxX, vsx));
        __m256i crossB = _mm256_and_si256(c1, c2);
        // Top edge cross
        c1 = _mm256_and_si256(_mm256_cmpgt_epi32(vmaxY, vsy1), _mm256_cmpgt_epi32(vsy2, vmaxY));
        __m256i crossT = _mm256_and_si256(c1, c2);
        if (_mm256_movemask_epi8(_mm256_or_si256(crossB, crossT))) return 0;
    }
    // Scalar for V: boundary, ray casting, remaining crossings
    for (int j = 0; j < nv; j++) {
        int sx = v_x[j], sy1 = v_y1[j], sy2 = v_y2[j];
        if (minX == sx && minY >= sy1 && minY <= sy2) on_bl = 1;
        if (maxX == sx && minY >= sy1 && minY <= sy2) on_br = 1;
        if (minX == sx && maxY >= sy1 && maxY <= sy2) on_tl = 1;
        if (maxX == sx && maxY >= sy1 && maxY <= sy2) on_tr = 1;
        if (minY > sy1 && minY <= sy2 && minX < sx) cross_bl++;
        if (minY > sy1 && minY <= sy2 && maxX < sx) cross_br++;
        if (maxY > sy1 && maxY <= sy2 && minX < sx) cross_tl++;
        if (maxY > sy1 && maxY <= sy2 && maxX < sx) cross_tr++;
    }
    for (; i < nv; i++) {
        int sx = v_x[i], sy1 = v_y1[i], sy2 = v_y2[i];
        if (sx > minX && sx < maxX) {
            if (minY > sy1 && minY < sy2) return 0;
            if (maxY > sy1 && maxY < sy2) return 0;
        }
    }

    if (!on_bl && !(cross_bl & 1)) return 0;
    if (!on_br && !(cross_br & 1)) return 0;
    if (!on_tl && !(cross_tl & 1)) return 0;
    if (!on_tr && !(cross_tr & 1)) return 0;
    return 1;
}


int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    n = 0;
    char* p = input;
    while (*p) {
        int x = 0;
        while (*p >= '0' && *p <= '9') {
            x = x * 10 + (*p++ - '0');
        }
        p++; // comma

        int y = 0;
        while (*p >= '0' && *p <= '9') {
            y = y * 10 + (*p++ - '0');
        }
        if (*p == '\n') p++;

        px[n] = x;
        py[n] = y;
        n++;
    }

    // Build separate H and V segment arrays
    nh = nv = 0;
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        int x1 = px[i], y1 = py[i];
        int x2 = px[j], y2 = py[j];

        if (y1 == y2) {
            // Horizontal
            h_y[nh] = y1;
            h_x1[nh] = x1 < x2 ? x1 : x2;
            h_x2[nh] = x1 > x2 ? x1 : x2;
            nh++;
        } else {
            // Vertical
            v_x[nv] = x1;
            v_y1[nv] = y1 < y2 ? y1 : y2;
            v_y2[nv] = y1 > y2 ? y1 : y2;
            nv++;
        }
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long maxArea = 0;

    for (int i = 0; i < n; i++) {
        int x1 = px[i], y1 = py[i];
        for (int j = i + 1; j < n; j++) {
            int x2 = px[j], y2 = py[j];

            int dx = x1 - x2;
            int dy = y1 - y2;
            int adx = (dx ^ (dx >> 31)) - (dx >> 31);
            int ady = (dy ^ (dy >> 31)) - (dy >> 31);

            long long area = (long long)(adx + 1) * (ady + 1);
            if (area <= maxArea) continue;

            int minX = x1 < x2 ? x1 : x2;
            int maxX = x1 > x2 ? x1 : x2;
            int minY = y1 < y2 ? y1 : y2;
            int maxY = y1 > y2 ? y1 : y2;

            if (isValidRect(minX, maxX, minY, maxY)) {
                maxArea = area;
            }
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(maxArea);

    aoc_cleanup(input);
    return 0;
}
