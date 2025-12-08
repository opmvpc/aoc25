#include "../../tools/runner/c/common.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <immintrin.h>
#include <float.h>

// Use double for coordinates and distances for AVX2
typedef struct {
    double x, y, z;
} Point;

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
        points[count].x = (double)(x * sign);

        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;
        
        int y = 0; sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') { y = y * 10 + (*p - '0'); p++; }
        points[count].y = (double)(y * sign);

        while (*p && (*p < '0' || *p > '9') && *p != '-') p++;

        int z = 0; sign = 1;
        if (*p == '-') { sign = -1; p++; }
        while (*p >= '0' && *p <= '9') { z = z * 10 + (*p - '0'); p++; }
        points[count].z = (double)(z * sign);

        count++;
    }
    return count;
}

__attribute__((target("avx2,fma")))
long long solve_prim(int n, Point* points) {
    // Structure of Arrays
    double* px = (double*)aligned_alloc(32, n * sizeof(double));
    double* py = (double*)aligned_alloc(32, n * sizeof(double));
    double* pz = (double*)aligned_alloc(32, n * sizeof(double));

    for(int i=0; i<n; i++) {
        px[i] = points[i].x;
        py[i] = points[i].y;
        pz[i] = points[i].z;
    }

    double* min_dist = (double*)aligned_alloc(32, n * sizeof(double));
    int* parent = (int*)malloc(n * sizeof(int));
    uint8_t* visited = (uint8_t*)calloc(n, sizeof(uint8_t));

    for (int i = 0; i < n; i++) {
        min_dist[i] = DBL_MAX;
        parent[i] = -1;
    }

    min_dist[0] = 0;
    
    double max_mst_edge_dist = -1;
    int max_edge_u = -1;
    int max_edge_v = -1;

    for (int i = 0; i < n; i++) {
        int u = -1;
        double min_val = DBL_MAX;

        // Find min unvisited
        // Use scalar for simplicity (N=1000 is small)
        for (int v = 0; v < n; v++) {
            if (!visited[v] && min_dist[v] < min_val) {
                min_val = min_dist[v];
                u = v;
            }
        }

        if (u == -1) break;
        visited[u] = 1;

        if (parent[u] != -1) {
            if (min_dist[u] > max_mst_edge_dist) {
                max_mst_edge_dist = min_dist[u];
                max_edge_u = u;
                max_edge_v = parent[u];
            }
        }

        __m256d xu = _mm256_set1_pd(px[u]);
        __m256d yu = _mm256_set1_pd(py[u]);
        __m256d zu = _mm256_set1_pd(pz[u]);

        int v = 0;
        // Vector loop
        for (; v + 4 <= n; v += 4) {
            // Check if all visited? No easy way.
            // Just compute dist. Computation is cheap.
            
            __m256d xv = _mm256_loadu_pd(&px[v]);
            __m256d yv = _mm256_loadu_pd(&py[v]);
            __m256d zv = _mm256_loadu_pd(&pz[v]);

            __m256d dx = _mm256_sub_pd(xu, xv);
            __m256d dy = _mm256_sub_pd(yu, yv);
            __m256d dz = _mm256_sub_pd(zu, zv);

            // d2 = dx*dx + dy*dy + dz*dz
            __m256d d2 = _mm256_add_pd(_mm256_mul_pd(dx, dx), 
                                       _mm256_add_pd(_mm256_mul_pd(dy, dy), 
                                                     _mm256_mul_pd(dz, dz)));
            
            double temp_d[4];
            _mm256_storeu_pd(temp_d, d2);

            // Scalar update
            // We can check visited[v] here, but it's safe to overwrite visited nodes as they won't be picked again
            if (temp_d[0] < min_dist[v]) { min_dist[v] = temp_d[0]; parent[v] = u; }
            if (temp_d[1] < min_dist[v+1]) { min_dist[v+1] = temp_d[1]; parent[v+1] = u; }
            if (temp_d[2] < min_dist[v+2]) { min_dist[v+2] = temp_d[2]; parent[v+2] = u; }
            if (temp_d[3] < min_dist[v+3]) { min_dist[v+3] = temp_d[3]; parent[v+3] = u; }
        }

        // Cleanup
        for (; v < n; v++) {
            if (!visited[v]) {
                double dx = px[u] - px[v];
                double dy = py[u] - py[v];
                double dz = pz[u] - pz[v];
                double d = dx*dx + dy*dy + dz*dz;
                if (d < min_dist[v]) {
                    min_dist[v] = d;
                    parent[v] = u;
                }
            }
        }
    }

    // Need original coords for result, or retrieve from double arrays
    // points[u] works.
    long long res = (long long)points[max_edge_u].x * (long long)points[max_edge_v].x;

    free(px); free(py); free(pz);
    free(min_dist); free(parent); free(visited);
    return res;
}

int main(void) {
    char* input = aoc_read_input();
    Point* points = (Point*)aligned_alloc(32, 5000 * sizeof(Point));
    
    AOC_TIMER_START(parse);
    int n = parse_input(input, points);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = solve_prim(n, points);
    AOC_TIMER_END(solve);
    
    AOC_RESULT_INT(result);

    free(points);
    aoc_cleanup(input);

    return 0;
}