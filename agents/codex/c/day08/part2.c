/**
 * 🎄 Advent of Code 2025 - Day 08 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef struct {
    uint64_t d;
    int a;
    int b;
} Edge;

static inline int edge_less(const Edge* x, const Edge* y) {
    if (x->d != y->d) return x->d < y->d;
    if (x->a != y->a) return x->a < y->a;
    return x->b < y->b;
}

static inline void edge_swap(Edge* x, Edge* y) {
    Edge tmp = *x;
    *x = *y;
    *y = tmp;
}

// In-place quicksort with insertion sort for tiny partitions
static void edge_sort(Edge* edges, int n) {
    if (n <= 1) return;
    int stack[64];
    int top = 0;
    stack[top++] = 0;
    stack[top++] = n - 1;

    while (top) {
        int right = stack[--top];
        int left = stack[--top];
        while (right - left > 16) {
            int mid = (left + right) >> 1;
            Edge pivot = edges[mid];
            int i = left;
            int j = right;
            while (i <= j) {
                while (edge_less(&edges[i], &pivot)) i++;
                while (edge_less(&pivot, &edges[j])) j--;
                if (i <= j) {
                    edge_swap(&edges[i], &edges[j]);
                    i++;
                    j--;
                }
            }
            if (j - left < right - i) {
                if (i < right) {
                    stack[top++] = i;
                    stack[top++] = right;
                }
                right = j;
            } else {
                if (left < j) {
                    stack[top++] = left;
                    stack[top++] = j;
                }
                left = i;
            }
        }

        for (int i = left + 1; i <= right; i++) {
            Edge key = edges[i];
            int j = i - 1;
            while (j >= left && edge_less(&key, &edges[j])) {
                edges[j + 1] = edges[j];
                j--;
            }
            edges[j + 1] = key;
        }
    }
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

    if (n < 2) {
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

    int64_t m = (int64_t)n * (n - 1) / 2;
    Edge* edges = (Edge*)malloc((size_t)m * sizeof(Edge));
    int64_t eidx = 0;
    for (int i = 0; i < n - 1; i++) {
        const int xi = xs[i];
        const int yi = ys[i];
        const int zi = zs[i];
        for (int j = i + 1; j < n; j++) {
            const int dx = xi - xs[j];
            const int dy = yi - ys[j];
            const int dz = zi - zs[j];
            edges[eidx].d = (uint64_t)((int64_t)dx * (int64_t)dx + (int64_t)dy * (int64_t)dy + (int64_t)dz * (int64_t)dz);
            edges[eidx].a = i;
            edges[eidx].b = j;
            eidx++;
        }
    }
    m = eidx;

    edge_sort(edges, (int)m);

    int* parent = (int*)malloc((size_t)n * sizeof(int));
    int* size = (int*)malloc((size_t)n * sizeof(int));
    for (int i = 0; i < n; i++) {
        parent[i] = i;
        size[i] = 1;
    }

    int components = n;
    int last_a = 0;
    int last_b = 0;
    for (int i = 0; i < m && components > 1; i++) {
        int ra = dsu_find(edges[i].a, parent);
        int rb = dsu_find(edges[i].b, parent);
        if (ra == rb) continue;
        if (size[ra] < size[rb]) {
            int tmp = ra;
            ra = rb;
            rb = tmp;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
        components--;
        last_a = edges[i].a;
        last_b = edges[i].b;
    }

    long long result = (long long)xs[last_a] * (long long)xs[last_b];
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(xs);
    free(ys);
    free(zs);
    free(edges);
    free(parent);
    free(size);
    aoc_cleanup(input);
    return 0;
}
