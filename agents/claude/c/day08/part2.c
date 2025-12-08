/**
 * Advent of Code 2025 - Day 08 Part 2
 *
 * Ultra-optimized version:
 * - 11-bit radix sort (3 passes instead of 6)
 * - Double buffering (no memcpy)
 * - 8-byte compact pairs
 * - Union by size
 *
 * Compile: clang -O3 -march=native -o part2 part2.c
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

#define MAX_POINTS 1001
#define MAX_PAIRS ((MAX_POINTS * (MAX_POINTS - 1)) / 2)
#define RADIX_BITS 11
#define RADIX_SIZE (1 << RADIX_BITS)
#define RADIX_MASK (RADIX_SIZE - 1)

typedef struct {
    int x, y, z;
} Point;

typedef struct {
    uint32_t dist_sq;
    uint16_t i, j;
} Pair;

static Point points[MAX_POINTS];
static Pair pairs_a[MAX_PAIRS];
static Pair pairs_b[MAX_PAIRS];
static int parent[MAX_POINTS];
static int sizes[MAX_POINTS];

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

    if (sizes[rx] < sizes[ry]) {
        parent[rx] = ry;
        sizes[ry] += sizes[rx];
    } else {
        parent[ry] = rx;
        sizes[rx] += sizes[ry];
    }
    return 1;
}

static Pair* radix_sort_pairs(Pair* src, Pair* dst, int count) {
    uint32_t counts[RADIX_SIZE];

    // Pass 1: bits 0-10
    memset(counts, 0, sizeof(counts));
    for (int i = 0; i < count; i++) {
        counts[src[i].dist_sq & RADIX_MASK]++;
    }
    uint32_t total = 0;
    for (int i = 0; i < RADIX_SIZE; i++) {
        uint32_t c = counts[i];
        counts[i] = total;
        total += c;
    }
    for (int i = 0; i < count; i++) {
        uint32_t key = src[i].dist_sq & RADIX_MASK;
        dst[counts[key]++] = src[i];
    }

    Pair* tmp = src; src = dst; dst = tmp;

    // Pass 2: bits 11-21
    memset(counts, 0, sizeof(counts));
    for (int i = 0; i < count; i++) {
        counts[(src[i].dist_sq >> RADIX_BITS) & RADIX_MASK]++;
    }
    total = 0;
    for (int i = 0; i < RADIX_SIZE; i++) {
        uint32_t c = counts[i];
        counts[i] = total;
        total += c;
    }
    for (int i = 0; i < count; i++) {
        uint32_t key = (src[i].dist_sq >> RADIX_BITS) & RADIX_MASK;
        dst[counts[key]++] = src[i];
    }

    tmp = src; src = dst; dst = tmp;

    // Pass 3: bits 22-32
    memset(counts, 0, sizeof(counts));
    for (int i = 0; i < count; i++) {
        counts[(src[i].dist_sq >> (2 * RADIX_BITS)) & RADIX_MASK]++;
    }
    total = 0;
    for (int i = 0; i < RADIX_SIZE; i++) {
        uint32_t c = counts[i];
        counts[i] = total;
        total += c;
    }
    for (int i = 0; i < count; i++) {
        uint32_t key = (src[i].dist_sq >> (2 * RADIX_BITS)) & RADIX_MASK;
        dst[counts[key]++] = src[i];
    }

    return dst;
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
        sizes[i] = 1;
    }

    int pair_count = 0;
    for (int i = 0; i < n; i++) {
        int xi = points[i].x;
        int yi = points[i].y;
        int zi = points[i].z;
        for (int j = i + 1; j < n; j++) {
            int dx = xi - points[j].x;
            int dy = yi - points[j].y;
            int dz = zi - points[j].z;
            uint64_t d = (uint64_t)dx * dx + (uint64_t)dy * dy + (uint64_t)dz * dz;
            pairs_a[pair_count].dist_sq = (uint32_t)(d >> 8);
            pairs_a[pair_count].i = i;
            pairs_a[pair_count].j = j;
            pair_count++;
        }
    }

    Pair* sorted = radix_sort_pairs(pairs_a, pairs_b, pair_count);

    int components = n;
    int last_i = 0, last_j = 0;

    for (int k = 0; k < pair_count && components > 1; k++) {
        if (uf_union(sorted[k].i, sorted[k].j)) {
            last_i = sorted[k].i;
            last_j = sorted[k].j;
            components--;
        }
    }

    long long result = (long long)points[last_i].x * points[last_j].x;

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
