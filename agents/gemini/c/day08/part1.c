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

// Parsing helper: similar to fast parsing in other solutions
// Returns number of points
int parse_input(char* input, Point* points) {
    int count = 0;
    char* p = input;
    while (*p) {
        // Skip whitespace
        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;
        if (!*p) break;

        // Parse x
        int x = 0;
        int sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') {
            x = x * 10 + (*p - '0');
            p++;
        }
        points[count].x = x * sign;

        // Skip comma
        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;
        
        // Parse y
        int y = 0;
        sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') {
            y = y * 10 + (*p - '0');
            p++;
        }
        points[count].y = y * sign;

        // Skip comma
        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;

        // Parse z
        int z = 0;
        sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') {
            z = z * 10 + (*p - '0');
            p++;
        }
        points[count].z = z * sign;

        count++;
    }
    return count;
}

int compare_edges(const void* a, const void* b) {
    const Edge* e1 = (const Edge*)a;
    const Edge* e2 = (const Edge*)b;
    if (e1->distSq < e2->distSq) return -1;
    if (e1->distSq > e2->distSq) return 1;
    return 0;
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
    if (dsu->parent[i] != i) {
        dsu->parent[i] = dsu_find(dsu, dsu->parent[i]);
    }
    return dsu->parent[i];
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
    
    // Allocate max possible points (file is small, maybe 2000 lines max)
    // Dynamic allocation would be safer but let's assume max 2000 based on file size
    // Actually let's just count lines first to be safe or realloc
    // Or just alloc enough. 1000 lines -> 1000 points.
    Point* points = (Point*)malloc(5000 * sizeof(Point));
    
    AOC_TIMER_START(parse);
    int n = parse_input(input, points);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    // Use a Max-Heap to keep the smallest K edges
    // We need top K closest, so we maintain a Max-Heap of size K
    // If a new edge is smaller than the max in heap, we replace it.
    
    int limit = 1000;
    if (n == 20) limit = 10; // Sample detection

    Edge* heap = (Edge*)malloc((limit + 1) * sizeof(Edge));
    int heap_size = 0;

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int64_t dx = points[i].x - points[j].x;
            int64_t dy = points[i].y - points[j].y;
            int64_t dz = points[i].z - points[j].z;
            int64_t distSq = dx*dx + dy*dy + dz*dz;

            if (heap_size < limit) {
                // Push to heap
                int k = heap_size++;
                heap[k].u = i;
                heap[k].v = j;
                heap[k].distSq = distSq;
                
                // Bubble up
                while (k > 0) {
                    int p = (k - 1) / 2;
                    if (heap[p].distSq >= heap[k].distSq) break;
                    // Swap
                    Edge tmp = heap[p];
                    heap[p] = heap[k];
                    heap[k] = tmp;
                    k = p;
                }
            } else if (distSq < heap[0].distSq) {
                // Replace max (root)
                heap[0].u = i;
                heap[0].v = j;
                heap[0].distSq = distSq;
                
                // Bubble down
                int k = 0;
                while (1) {
                    int left = 2 * k + 1;
                    int right = 2 * k + 2;
                    int largest = k;

                    if (left < heap_size && heap[left].distSq > heap[largest].distSq)
                        largest = left;
                    if (right < heap_size && heap[right].distSq > heap[largest].distSq)
                        largest = right;

                    if (largest == k) break;

                    Edge tmp = heap[k];
                    heap[k] = heap[largest];
                    heap[largest] = tmp;
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

    free(heap);


    // Collect sizes
    // We can use an array to store sizes of roots
    int* root_sizes = (int*)malloc(n * sizeof(int));
    int unique_count = 0;
    
    // Reset marker array or similar? No, just iterate
    // dsu.size is valid for roots. 
    // Just collect all dsu.size[i] where parent[i] == i
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

    free(points);
    free(dsu.parent);
    free(dsu.size);
    free(root_sizes);
    aoc_cleanup(input);

    return 0;
}