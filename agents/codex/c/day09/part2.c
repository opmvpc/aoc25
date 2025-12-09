/**
 * 🎄 Advent of Code 2025 - Day 09 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define MAXN 1024
#define MAXC 2048
#define MAXAREA (MAXC * MAXC)

static int cmp_int(const void* a, const void* b) {
    int ia = *(const int*)a;
    int ib = *(const int*)b;
    return (ia > ib) - (ia < ib);
}

// Binary search helper (array sorted asc).
static inline int find_index(const int* arr, int len, int value) {
    int lo = 0, hi = len - 1;
    while (lo <= hi) {
        int mid = (lo + hi) >> 1;
        int v = arr[mid];
        if (v == value) return mid;
        if (v < value) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int main(void) {
    char* input = aoc_read_input();
    size_t in_len = strlen(input);

    AOC_TIMER_START(parse);
    // Count points.
    int n = 0;
    for (size_t i = 0; i < in_len; i++) {
        if (input[i] == '\n') n++;
    }
    if (in_len > 0 && input[in_len - 1] != '\n') n++;

    static int px[MAXN];
    static int py[MAXN];

    // Fast manual parsing (coordinates are small, so int is fine).
    int idx = 0;
    char* p = input;
    while (*p) {
        int sign = 1;
        int x = 0;
        if (*p == '-') {
            sign = -1;
            p++;
        }
        while (*p >= '0') {
            x = x * 10 + (*p - '0');
            p++;
        }
        x *= sign;
        if (*p == ',') p++;

        sign = 1;
        int y = 0;
        if (*p == '-') {
            sign = -1;
            p++;
        }
        while (*p >= '0') {
            y = y * 10 + (*p - '0');
            p++;
        }
        y *= sign;
        if (*p == '\n') p++;

        px[idx] = x;
        py[idx] = y;
        idx++;
    }

    // Determine bounds.
    int minX = px[0], maxX = px[0], minY = py[0], maxY = py[0];
    for (int i = 1; i < n; i++) {
        if (px[i] < minX) minX = px[i];
        else if (px[i] > maxX) maxX = px[i];
        if (py[i] < minY) minY = py[i];
        else if (py[i] > maxY) maxY = py[i];
    }

    // Coordinate compression on half-integer boundaries, scaled by 2 to stay integral.
    static int bx[MAXC];
    static int by[MAXC];
    int bx_count = 0, by_count = 0;

    bx[bx_count++] = minX * 2 - 3;  // minX - 1.5
    bx[bx_count++] = maxX * 2 + 3;  // maxX + 1.5
    by[by_count++] = minY * 2 - 3;
    by[by_count++] = maxY * 2 + 3;
    for (int i = 0; i < n; i++) {
        int sx = px[i] * 2;
        int sy = py[i] * 2;
        bx[bx_count++] = sx - 1;
        bx[bx_count++] = sx + 1;
        by[by_count++] = sy - 1;
        by[by_count++] = sy + 1;
    }

    qsort(bx, (size_t)bx_count, sizeof(int), cmp_int);
    qsort(by, (size_t)by_count, sizeof(int), cmp_int);

    // Deduplicate.
    int ux = 1;
    for (int i = 1; i < bx_count; i++) {
        if (bx[i] != bx[ux - 1]) bx[ux++] = bx[i];
    }
    int uy = 1;
    for (int i = 1; i < by_count; i++) {
        if (by[i] != by[uy - 1]) by[uy++] = by[i];
    }
    bx_count = ux;
    by_count = uy;

    int W = bx_count - 1;
    int H = by_count - 1;

    static int xWidth[MAXC];
    static int yHeight[MAXC];
    for (int i = 0; i < W; i++) xWidth[i] = (bx[i + 1] - bx[i]) / 2;
    for (int i = 0; i < H; i++) yHeight[i] = (by[i + 1] - by[i]) / 2;

    // Edges lists.
    static int vertX[MAXN];
    static int vertY1[MAXN];
    static int vertY2[MAXN];
    static int horizY[MAXN];
    static int horizX1[MAXN];
    static int horizX2[MAXN];
    int vcnt = 0, hcnt = 0;

    for (int i = 0; i < n; i++) {
        int x1 = px[i];
        int y1 = py[i];
        int x2 = px[(i + 1) % n];
        int y2 = py[(i + 1) % n];
        if (x1 == x2) {
            int a = y1 < y2 ? y1 : y2;
            int b = y1 < y2 ? y2 : y1;
            vertX[vcnt] = x1 * 2;
            vertY1[vcnt] = a * 2;
            vertY2[vcnt] = b * 2;
            vcnt++;
        } else {
            int a = x1 < x2 ? x1 : x2;
            int b = x1 < x2 ? x2 : x1;
            horizY[hcnt] = y1 * 2;
            horizX1[hcnt] = a * 2;
            horizX2[hcnt] = b * 2;
            hcnt++;
        }
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // Precompute compressed indices for points and edges to avoid binary searches in hot loops.
    static int pXiL[MAXN];
    static int pXiR[MAXN];
    static int pYiD[MAXN];
    static int pYiU[MAXN];
    for (int i = 0; i < n; i++) {
        int sx = px[i] * 2;
        int sy = py[i] * 2;
        pXiL[i] = find_index(bx, bx_count, sx - 1);
        pXiR[i] = find_index(bx, bx_count, sx + 1);
        pYiD[i] = find_index(by, by_count, sy - 1);
        pYiU[i] = find_index(by, by_count, sy + 1);
    }

    static int vRowStart[MAXN];
    static int vRowEnd[MAXN];
    static int vCol[MAXN];
    static int vYTop[MAXN];
    static int hRow[MAXN];
    static int hXi1[MAXN];
    static int hXi2[MAXN];

    int vptr = 0, hptr = 0;
    for (int i = 0; i < n; i++) {
        int ni = (i + 1) % n;
        if (px[i] == px[ni]) {
            // vertical
            vRowStart[vptr] = py[i] < py[ni] ? pYiD[i] : pYiD[ni];
            vRowEnd[vptr] = py[i] < py[ni] ? pYiD[ni] : pYiD[i];
            vCol[vptr] = find_index(bx, bx_count, vertX[vptr] - 1);
            vYTop[vptr] = find_index(by, by_count, vertY2[vptr] + 1);
            vptr++;
        } else {
            // horizontal
            int li = px[i] < px[ni] ? i : ni;
            int ri = px[i] < px[ni] ? ni : i;
            hRow[hptr] = pYiD[i];
            hXi1[hptr] = pXiL[li];
            hXi2[hptr] = pXiR[ri];
            hptr++;
        }
    }

    static uint8_t inside[MAXAREA];
    memset(inside, 0, (size_t)W * (size_t)H);

    // Precompute vertical start/end events to avoid per-row scans.
    static int startCnt[MAXC];
    static int endCnt[MAXC];
    memset(startCnt, 0, (size_t)(H + 1) * sizeof(int));
    memset(endCnt, 0, (size_t)(H + 1) * sizeof(int));
    for (int e = 0; e < vcnt; e++) {
        int sr = vRowStart[e];
        int er = vRowEnd[e];
        startCnt[sr]++;
        endCnt[er]++;
    }
    static int startOff[MAXC];
    static int endOff[MAXC];
    startOff[0] = endOff[0] = 0;
    for (int i = 0; i < H; i++) {
        startOff[i + 1] = startOff[i] + startCnt[i];
        endOff[i + 1] = endOff[i] + endCnt[i];
    }
    static int startData[MAXN];
    static int endData[MAXN];
    memcpy(startCnt, startOff, (size_t)(H + 1) * sizeof(int));
    memcpy(endCnt, endOff, (size_t)(H + 1) * sizeof(int));
    for (int e = 0; e < vcnt; e++) {
        int sr = vRowStart[e];
        int er = vRowEnd[e];
        startData[startCnt[sr]++] = vertX[e];
        endData[endCnt[er]++] = vertX[e];
    }

    static int active[MAXN];
    int activeLen = 0;

    for (int j = 0; j < H; j++) {
        for (int k = startOff[j]; k < startOff[j + 1]; k++) {
            int val = startData[k];
            int lo = 0, hi = activeLen;
            while (lo < hi) {
                int mid = (lo + hi) >> 1;
                if (active[mid] < val) lo = mid + 1;
                else hi = mid;
            }
            for (int m = activeLen; m > lo; m--) active[m] = active[m - 1];
            active[lo] = val;
            activeLen++;
        }
        for (int k = endOff[j]; k < endOff[j + 1]; k++) {
            int val = endData[k];
            for (int m = 0; m < activeLen; m++) {
                if (active[m] == val) {
                    for (int t = m + 1; t < activeLen; t++) active[t - 1] = active[t];
                    activeLen--;
                    break;
                }
            }
        }

        int pidx = 0;
        int parity = 0;
        int base = j * W;
        for (int i = 0; i < W; i++) {
            int left = bx[i];
            while (pidx < activeLen && active[pidx] <= left) {
                parity ^= 1;
                pidx++;
            }
            if (parity) inside[base + i] = 1;
        }
    }

    // Mark boundary tiles (edges are green).
    for (int e = 0; e < hcnt; e++) {
        int yRow = hRow[e];
        int xi1 = hXi1[e];
        int xi2 = hXi2[e];
        int base = yRow * W;
        for (int i = xi1; i < xi2; i++) inside[base + i] = 1;
    }
    for (int e = 0; e < vcnt; e++) {
        int xCol = vCol[e];
        int yi1 = vRowStart[e];
        int yi2 = vYTop[e];
        for (int j = yi1; j < yi2; j++) inside[j * W + xCol] = 1;
    }

    // Prefix sums of green area.
    size_t stride = (size_t)W + 1;
    static int64_t pref[(MAXC + 1) * (MAXC + 1)];
    memset(pref, 0, (size_t)(H + 1) * stride * sizeof(int64_t));
    for (int j = 0; j < H; j++) {
        size_t base = (size_t)(j + 1) * stride;
        size_t prev = (size_t)j * stride;
        int rowH = yHeight[j];
        for (int i = 0; i < W; i++) {
            int64_t area = inside[(size_t)j * W + i] ? (int64_t)xWidth[i] * (int64_t)rowH : 0;
            pref[base + i + 1] = area + pref[base + i] + pref[prev + i + 1] - pref[prev + i];
        }
    }

    int64_t best = 0;
    for (int a = 0; a < n; a++) {
        int ax = px[a];
        int ay = py[a];
        for (int b = a + 1; b < n; b++) {
            int bxv = px[b];
            int byv = py[b];
            if (ax == bxv || ay == byv) continue;
            int x1 = ax < bxv ? ax : bxv;
            int x2 = ax < bxv ? bxv : ax;
            int y1 = ay < byv ? ay : byv;
            int y2 = ay < byv ? byv : ay;

            int xi1 = ax < bxv ? pXiL[a] : pXiL[b];
            int xi2 = ax < bxv ? pXiR[b] : pXiR[a];
            int yi1 = ay < byv ? pYiD[a] : pYiD[b];
            int yi2 = ay < byv ? pYiU[b] : pYiU[a];

            int64_t total = (int64_t)(x2 - x1 + 1) * (int64_t)(y2 - y1 + 1);
            if (total <= best) continue;

            int64_t inside_area = pref[(size_t)yi2 * stride + xi2] - pref[(size_t)yi1 * stride + xi2] -
                                  pref[(size_t)yi2 * stride + xi1] + pref[(size_t)yi1 * stride + xi1];
            if (inside_area == total) best = total;
        }
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(best);

    aoc_cleanup(input);
    return 0;
}
