#include "../../tools/runner/c/common.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int x, y, z;
} Point;

typedef struct {
    int u, v;
    int64_t distSq;
} Edge;

// Parsing helper
int parse_input(char* input, Point* points) {
    int count = 0;
    char* p = input;
    while (*p) {
        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;
        if (!*p) break;

        int x = 0, sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') { x = x * 10 + (*p - '0'); p++; }
        points[count].x = x * sign;

        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;
        
        int y = 0; sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') { y = y * 10 + (*p - '0'); p++; }
        points[count].y = y * sign;

        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;

        int z = 0; sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') { z = z * 10 + (*p - '0'); p++; }
        points[count].z = z * sign;

        count++;
    }
    return count;
}

// DSU
typedef struct {
    int* parent;
    int* size;
} DSU;

void dsu_init(DSU* dsu, int n) {
    dsu->parent = (int*)malloc(n * sizeof(int));
    dsu->size = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        dsu->parent[i] = i;
        dsu->size[i] = 1;
    }
}

int dsu_find(DSU* dsu, int i) {
    while (dsu->parent[i] != i) {
        dsu->parent[i] = dsu->parent[dsu->parent[i]];
        i = dsu->parent[i];
    }
    return i;
}

void dsu_union(DSU* dsu, int i, int j) {
    int rootI = dsu_find(dsu, i);
    int rootJ = dsu_find(dsu, j);
    if (rootI != rootJ) {
        if (dsu->size[rootI] < dsu->size[rootJ]) {
            dsu->parent[rootI] = rootJ;
            dsu->size[rootJ] += dsu->size[rootI];
        } else {
            dsu->parent[rootJ] = rootI;
            dsu->size[rootI] += dsu->size[rootJ];
        }
    }
}

int compare_ints_desc(const void* a, const void* b) {
    return (*(int*)b - *(int*)a);
}

int main(void) {
    char* input = aoc_read_input();
    Point* points = (Point*)malloc(5000 * sizeof(Point));
    
    AOC_TIMER_START(parse);
    int n = parse_input(input, points);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    // Max-Heap for top K closest
    int limit = 1000;
    if (n == 20) limit = 10;

    // Allocate heap slightly larger
    Edge* heap = (Edge*)malloc((limit + 1) * sizeof(Edge));
    int heap_size = 0;

    // To optimize, we can check max_dist before computing sqrt or even pushing?
    // We maintain max_heap. heap[0] is the largest distance in the set of smallest edges.
    
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int64_t dx = points[i].x - points[j].x;
            int64_t dy = points[i].y - points[j].y;
            int64_t dz = points[i].z - points[j].z;
            int64_t distSq = dx*dx + dy*dy + dz*dz;

            if (heap_size < limit) {
                // Push
                int k = heap_size++;
                heap[k].u = i; heap[k].v = j; heap[k].distSq = distSq;
                while (k > 0) {
                    int p = (k - 1) / 2;
                    if (heap[p].distSq >= heap[k].distSq) break;
                    Edge tmp = heap[p]; heap[p] = heap[k]; heap[k] = tmp;
                    k = p;
                }
            } else if (distSq < heap[0].distSq) {
                // Replace
                heap[0].u = i; heap[0].v = j; heap[0].distSq = distSq;
                int k = 0;
                while (1) {
                    int left = 2 * k + 1;
                    int right = 2 * k + 2;
                    int largest = k;
                    if (left < heap_size && heap[left].distSq > heap[largest].distSq) largest = left;
                    if (right < heap_size && heap[right].distSq > heap[largest].distSq) largest = right;
                    if (largest == k) break;
                    Edge tmp = heap[k]; heap[k] = heap[largest]; heap[largest] = tmp;
                    k = largest;
                }
            }
        }
    }

    DSU dsu;
    dsu_init(&dsu, n);

    for (int i = 0; i < heap_size; i++) {
        dsu_union(&dsu, heap[i].u, heap[i].v);
    }

    int* root_sizes = (int*)malloc(n * sizeof(int));
    int unique_count = 0;
    for (int i = 0; i < n; i++) {
        if (dsu.parent[i] == i) {
            root_sizes[unique_count++] = dsu.size[i];
        }
    }

    qsort(root_sizes, unique_count, sizeof(int), compare_ints_desc);

    long long result = 1;
    if (unique_count > 0) result *= root_sizes[0];
    if (unique_count > 1) result *= root_sizes[1];
    if (unique_count > 2) result *= root_sizes[2];

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(result);

    free(points); free(heap);
    free(dsu.parent); free(dsu.size);
    free(root_sizes);
    aoc_cleanup(input);

    return 0;
}
