/**
 * Advent of Code 2025 - Day 08 Part 2
 * Connect all junction boxes into one circuit (Kruskal's MST)
 * Return product of X coordinates of the last pair that merges circuits
 *
 * Optimizations:
 * - Radix sort instead of qsort (O(n) vs O(n log n))
 * - Compact pair structure
 * - Iterative path compression
 *
 * Compile: clang -O3 -march=native -o part2 part2.c
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

#define MAX_POINTS 1001
#define MAX_PAIRS ((MAX_POINTS * (MAX_POINTS - 1)) / 2)

typedef struct {
    int x, y, z;
} Point;

typedef struct {
    uint32_t dist_sq_low;
    uint16_t dist_sq_high;
    int16_t i, j;
} __attribute__((packed)) Pair;

static Point points[MAX_POINTS];
static Pair pairs[MAX_PAIRS];
static Pair temp_pairs[MAX_PAIRS];
static int parent[MAX_POINTS];
static int rank_arr[MAX_POINTS];

static inline int parse_int_fast(const char** p) {
    int val = 0;
    while (**p >= '0' && **p <= '9') {
        val = val * 10 + (**p - '0');
        (*p)++;
    }
    return val;
}

static inline int uf_find(int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) {
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}

static inline int uf_union(int x, int y) {
    int rx = uf_find(x);
    int ry = uf_find(y);

    if (rx == ry) return 0;

    if (rank_arr[rx] < rank_arr[ry]) {
        parent[rx] = ry;
    } else if (rank_arr[rx] > rank_arr[ry]) {
        parent[ry] = rx;
    } else {
        parent[ry] = rx;
        rank_arr[rx]++;
    }
    return 1;
}

static void radix_sort_pairs(int count) {
    uint32_t counts[256];

    for (int shift = 0; shift < 32; shift += 8) {
        memset(counts, 0, sizeof(counts));

        for (int i = 0; i < count; i++) {
            uint32_t key = (pairs[i].dist_sq_low >> shift) & 0xFF;
            counts[key]++;
        }

        uint32_t total = 0;
        for (int i = 0; i < 256; i++) {
            uint32_t c = counts[i];
            counts[i] = total;
            total += c;
        }

        for (int i = 0; i < count; i++) {
            uint32_t key = (pairs[i].dist_sq_low >> shift) & 0xFF;
            temp_pairs[counts[key]++] = pairs[i];
        }

        memcpy(pairs, temp_pairs, count * sizeof(Pair));
    }

    // High 16 bits
    memset(counts, 0, sizeof(counts));
    for (int i = 0; i < count; i++) {
        uint32_t key = pairs[i].dist_sq_high & 0xFF;
        counts[key]++;
    }
    uint32_t total = 0;
    for (int i = 0; i < 256; i++) {
        uint32_t c = counts[i];
        counts[i] = total;
        total += c;
    }
    for (int i = 0; i < count; i++) {
        uint32_t key = pairs[i].dist_sq_high & 0xFF;
        temp_pairs[counts[key]++] = pairs[i];
    }
    memcpy(pairs, temp_pairs, count * sizeof(Pair));

    memset(counts, 0, sizeof(counts));
    for (int i = 0; i < count; i++) {
        uint32_t key = (pairs[i].dist_sq_high >> 8) & 0xFF;
        counts[key]++;
    }
    total = 0;
    for (int i = 0; i < 256; i++) {
        uint32_t c = counts[i];
        counts[i] = total;
        total += c;
    }
    for (int i = 0; i < count; i++) {
        uint32_t key = (pairs[i].dist_sq_high >> 8) & 0xFF;
        temp_pairs[counts[key]++] = pairs[i];
    }
    memcpy(pairs, temp_pairs, count * sizeof(Pair));
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    const char* p = input;
    int n = 0;

    while (*p) {
        while (*p == '\n' || *p == ' ') p++;
        if (!*p) break;

        points[n].x = parse_int_fast(&p);
        p++;
        points[n].y = parse_int_fast(&p);
        p++;
        points[n].z = parse_int_fast(&p);
        n++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    for (int i = 0; i < n; i++) {
        parent[i] = i;
        rank_arr[i] = 0;
    }

    int pair_count = 0;
    for (int i = 0; i < n; i++) {
        int xi = points[i].x;
        int yi = points[i].y;
        int zi = points[i].z;
        for (int j = i + 1; j < n; j++) {
            int64_t dx = xi - points[j].x;
            int64_t dy = yi - points[j].y;
            int64_t dz = zi - points[j].z;
            uint64_t dist_sq = dx * dx + dy * dy + dz * dz;
            pairs[pair_count].dist_sq_low = (uint32_t)dist_sq;
            pairs[pair_count].dist_sq_high = (uint16_t)(dist_sq >> 32);
            pairs[pair_count].i = i;
            pairs[pair_count].j = j;
            pair_count++;
        }
    }

    radix_sort_pairs(pair_count);

    int components = n;
    int last_i = 0, last_j = 0;

    for (int k = 0; k < pair_count && components > 1; k++) {
        int i = pairs[k].i;
        int j = pairs[k].j;
        if (uf_union(i, j)) {
            last_i = i;
            last_j = j;
            components--;
        }
    }

    long long result = (long long)points[last_i].x * points[last_j].x;

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
