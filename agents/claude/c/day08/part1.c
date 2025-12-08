/**
 * Advent of Code 2025 - Day 08 Part 1
 * Playground - Connect junction boxes via closest pairs
 *
 * Optimizations:
 * - Radix sort instead of qsort (O(n) vs O(n log n))
 * - Compact pair structure (12 bytes instead of 16)
 * - Cache-friendly memory access patterns
 *
 * Compile: clang -O3 -march=native -o part1 part1.c
 */

#include "../../tools/runner/c/common.h"
#include <string.h>

#define MAX_POINTS 1001
#define MAX_PAIRS ((MAX_POINTS * (MAX_POINTS - 1)) / 2)

typedef struct {
    int x, y, z;
} Point;

// Compact pair: 12 bytes (was 16 with padding)
typedef struct {
    uint32_t dist_sq_low;   // Lower 32 bits of distance squared
    uint16_t dist_sq_high;  // Upper 16 bits (enough for our range)
    int16_t i, j;
} __attribute__((packed)) Pair;

static Point points[MAX_POINTS];
static Pair pairs[MAX_PAIRS];
static Pair temp_pairs[MAX_PAIRS];
static int parent[MAX_POINTS];
static int rank_arr[MAX_POINTS];
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
    // Path compression
    while (parent[x] != root) {
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}

static inline void uf_union(int x, int y) {
    int rx = uf_find(x);
    int ry = uf_find(y);

    if (rx == ry) return;

    if (rank_arr[rx] < rank_arr[ry]) {
        parent[rx] = ry;
        sizes[ry] += sizes[rx];
    } else if (rank_arr[rx] > rank_arr[ry]) {
        parent[ry] = rx;
        sizes[rx] += sizes[ry];
    } else {
        parent[ry] = rx;
        sizes[rx] += sizes[ry];
        rank_arr[rx]++;
    }
}

// Get 64-bit distance from packed pair
static inline uint64_t get_dist(const Pair* p) {
    return (uint64_t)p->dist_sq_low | ((uint64_t)p->dist_sq_high << 32);
}

// Radix sort on lower 32 bits (sufficient for ordering in most cases)
// Uses 8-bit radix (4 passes for 32 bits)
static void radix_sort_pairs(int count) {
    uint32_t counts[256];

    // 4 passes for 32-bit key (8 bits each)
    for (int shift = 0; shift < 32; shift += 8) {
        memset(counts, 0, sizeof(counts));

        // Count occurrences
        for (int i = 0; i < count; i++) {
            uint32_t key = (pairs[i].dist_sq_low >> shift) & 0xFF;
            counts[key]++;
        }

        // Prefix sum
        uint32_t total = 0;
        for (int i = 0; i < 256; i++) {
            uint32_t c = counts[i];
            counts[i] = total;
            total += c;
        }

        // Scatter
        for (int i = 0; i < count; i++) {
            uint32_t key = (pairs[i].dist_sq_low >> shift) & 0xFF;
            temp_pairs[counts[key]++] = pairs[i];
        }

        // Swap buffers
        memcpy(pairs, temp_pairs, count * sizeof(Pair));
    }

    // One more pass for high 16 bits if needed
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

    // Second byte of high
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

    // Initialize Union-Find
    for (int i = 0; i < n; i++) {
        parent[i] = i;
        rank_arr[i] = 0;
        sizes[i] = 1;
    }

    // Generate all pairs with distances
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

    // Radix sort
    radix_sort_pairs(pair_count);

    // Connect closest pairs
    int connections = (n == 20) ? 10 : 1000;
    if (connections > pair_count) connections = pair_count;

    for (int k = 0; k < connections; k++) {
        uf_union(pairs[k].i, pairs[k].j);
    }

    // Find top 3 circuit sizes
    int top3[3] = {0, 0, 0};
    for (int i = 0; i < n; i++) {
        if (parent[i] == i) {
            int s = sizes[i];
            if (s > top3[0]) {
                top3[2] = top3[1];
                top3[1] = top3[0];
                top3[0] = s;
            } else if (s > top3[1]) {
                top3[2] = top3[1];
                top3[1] = s;
            } else if (s > top3[2]) {
                top3[2] = s;
            }
        }
    }

    if (top3[1] == 0) top3[1] = 1;
    if (top3[2] == 0) top3[2] = 1;

    long long result = (long long)top3[0] * top3[1] * top3[2];

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
