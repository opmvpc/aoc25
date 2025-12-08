/**
 * 🎄 Advent of Code 2025 - Day 08 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

#define TOP_K 1000

static inline void heapify_up(int idx, uint64_t* dist, int* a, int* b) {
    while (idx > 0) {
        int parent = (idx - 1) >> 1;
        if (dist[parent] >= dist[idx]) break;
        uint64_t td = dist[parent];
        dist[parent] = dist[idx];
        dist[idx] = td;

        int ta = a[parent];
        a[parent] = a[idx];
        a[idx] = ta;

        int tb = b[parent];
        b[parent] = b[idx];
        b[idx] = tb;
        idx = parent;
    }
}

static inline void heapify_down(int size, uint64_t* dist, int* a, int* b) {
    int idx = 0;
    while (1) {
        int left = (idx << 1) + 1;
        if (left >= size) break;
        int largest = left;
        int right = left + 1;
        if (right < size && dist[right] > dist[left]) largest = right;
        if (dist[idx] >= dist[largest]) break;

        uint64_t td = dist[idx];
        dist[idx] = dist[largest];
        dist[largest] = td;

        int ta = a[idx];
        a[idx] = a[largest];
        a[largest] = ta;

        int tb = b[idx];
        b[idx] = b[largest];
        b[largest] = tb;
        idx = largest;
    }
}

static inline void heap_pop(uint64_t* dist, int* a, int* b, int* size_ptr, uint64_t* out_d, int* out_a, int* out_b) {
    *out_d = dist[0];
    *out_a = a[0];
    *out_b = b[0];
    int size = *size_ptr - 1;
    if (size > 0) {
        dist[0] = dist[size];
        a[0] = a[size];
        b[0] = b[size];
        heapify_down(size, dist, a, b);
    }
    *size_ptr = size;
}

static inline int dsu_find(int v, int* parent) {
    while (parent[v] != v) {
        parent[v] = parent[parent[v]];
        v = parent[v];
    }
    return v;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int n = 0;
    char prev = '\0';
    for (char* p = input; *p; ++p) {
        if (*p == '\n') n++;
        prev = *p;
    }
    if (prev != '\0' && prev != '\n') n++;

    if (n == 0) {
        AOC_TIMER_END(parse);
        AOC_TIMER_START(solve);
        long long result = 0;
        AOC_TIMER_END(solve);
        AOC_RESULT_INT(result);
        aoc_cleanup(input);
        return 0;
    }

    int* xs = (int*)malloc((size_t)n * sizeof(int));
    int* ys = (int*)malloc((size_t)n * sizeof(int));
    int* zs = (int*)malloc((size_t)n * sizeof(int));

    int idx = 0;
    char* ptr = input;
    while (*ptr) {
        int x = 0;
        while (*ptr && *ptr != ',') {
            x = x * 10 + (*ptr - '0');
            ptr++;
        }
        if (*ptr == ',') ptr++;

        int y = 0;
        while (*ptr && *ptr != ',') {
            y = y * 10 + (*ptr - '0');
            ptr++;
        }
        if (*ptr == ',') ptr++;

        int z = 0;
        while (*ptr && *ptr != '\n') {
            z = z * 10 + (*ptr - '0');
            ptr++;
        }
        if (*ptr == '\n') ptr++;

        xs[idx] = x;
        ys[idx] = y;
        zs[idx] = z;
        idx++;
    }
    n = idx;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long pair_count = (long long)n * (n - 1) / 2;
    // Tiny inputs mirror the example's 10 connections; real input uses 1000.
    int goal = n <= 50 ? 10 : TOP_K;
    int target = pair_count < goal ? (int)pair_count : goal;

    uint64_t* hdist = target > 0 ? (uint64_t*)malloc((size_t)target * sizeof(uint64_t)) : NULL;
    int* ha = target > 0 ? (int*)malloc((size_t)target * sizeof(int)) : NULL;
    int* hb = target > 0 ? (int*)malloc((size_t)target * sizeof(int)) : NULL;
    int hsize = 0;

    if (target > 0) {
        for (int i = 0; i < n - 1; i++) {
            const int xi = xs[i];
            const int yi = ys[i];
            const int zi = zs[i];
            for (int j = i + 1; j < n; j++) {
                const int dx = xi - xs[j];
                const int dy = yi - ys[j];
                const int dz = zi - zs[j];
                const uint64_t d = (uint64_t)dx * (uint64_t)dx + (uint64_t)dy * (uint64_t)dy + (uint64_t)dz * (uint64_t)dz;

                if (hsize < target) {
                    hdist[hsize] = d;
                    ha[hsize] = i;
                    hb[hsize] = j;
                    heapify_up(hsize, hdist, ha, hb);
                    hsize++;
                } else if (d < hdist[0]) {
                    hdist[0] = d;
                    ha[0] = i;
                    hb[0] = j;
                    heapify_down(hsize, hdist, ha, hb);
                }
            }
        }
    }

    int m = hsize;
    uint64_t* edist = (uint64_t*)malloc((size_t)m * sizeof(uint64_t));
    int* ea = (int*)malloc((size_t)m * sizeof(int));
    int* eb = (int*)malloc((size_t)m * sizeof(int));

    for (int k = m - 1; k >= 0; k--) {
        heap_pop(hdist, ha, hb, &hsize, &edist[k], &ea[k], &eb[k]);
    }

    int* parent = (int*)malloc((size_t)n * sizeof(int));
    int* size = (int*)malloc((size_t)n * sizeof(int));
    for (int i = 0; i < n; i++) {
        parent[i] = i;
        size[i] = 1;
    }

    for (int k = 0; k < m; k++) {
        int ra = dsu_find(ea[k], parent);
        int rb = dsu_find(eb[k], parent);
        if (ra == rb) continue;
        if (size[ra] < size[rb]) {
            int tmp = ra;
            ra = rb;
            rb = tmp;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
    }

    int top1 = 0, top2 = 0, top3 = 0;
    for (int i = 0; i < n; i++) {
        if (parent[i] != i) continue;
        int s = size[i];
        if (s >= top1) {
            top3 = top2;
            top2 = top1;
            top1 = s;
        } else if (s >= top2) {
            top3 = top2;
            top2 = s;
        } else if (s > top3) {
            top3 = s;
        }
    }

    long long result = (long long)top1 * (long long)top2 * (long long)top3;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(xs);
    free(ys);
    free(zs);
    free(hdist);
    free(ha);
    free(hb);
    free(edist);
    free(ea);
    free(eb);
    free(parent);
    free(size);
    aoc_cleanup(input);
    return 0;
}
