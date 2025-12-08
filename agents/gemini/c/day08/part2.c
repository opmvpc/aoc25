#include "../../tools/runner/c/common.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

typedef struct {
    int x, y, z;
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

int main(void) {
    char* input = aoc_read_input();
    
    // Max 5000 points
    Point* points = (Point*)malloc(5000 * sizeof(Point));
    
    AOC_TIMER_START(parse);
    int n = parse_input(input, points);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    // Prim's Algorithm
    // distances can be large, use int64_t
    // We need arrays for min_dist, visited, parent
    // Use malloc to be safe with stack size
    int64_t* min_dist = (int64_t*)malloc(n * sizeof(int64_t));
    int* parent = (int*)malloc(n * sizeof(int));
    uint8_t* visited = (uint8_t*)calloc(n, sizeof(uint8_t));

    for (int i = 0; i < n; i++) {
        min_dist[i] = INT64_MAX; // Infinity
        parent[i] = -1;
    }

    // Start from node 0
    min_dist[0] = 0;

    int64_t max_mst_edge_dist = -1;
    int max_edge_u = -1;
    int max_edge_v = -1;

    for (int i = 0; i < n; i++) {
        // Find unvisited node with min min_dist
        // With N=1000, linear scan is optimal (better than heap overhead)
        int u = -1;
        int64_t min_val = INT64_MAX;

        for (int v = 0; v < n; v++) {
            if (!visited[v] && min_dist[v] < min_val) {
                min_val = min_dist[v];
                u = v;
            }
        }

        if (u == -1) break; // Should not happen if connected

        visited[u] = 1;

        // If not start node, update max edge in MST
        // The edge connecting u to the tree is (u, parent[u]) with weight min_dist[u]
        if (parent[u] != -1) {
            if (min_dist[u] > max_mst_edge_dist) {
                max_mst_edge_dist = min_dist[u];
                max_edge_u = u;
                max_edge_v = parent[u];
            }
        }

        // Update neighbors
        // We compute distance on the fly to save memory
        Point pu = points[u];
        for (int v = 0; v < n; v++) {
            if (!visited[v]) {
                Point pv = points[v];
                int64_t dx = pu.x - pv.x;
                int64_t dy = pu.y - pv.y;
                int64_t dz = pu.z - pv.z;
                int64_t d = dx*dx + dy*dy + dz*dz;

                if (d < min_dist[v]) {
                    min_dist[v] = d;
                    parent[v] = u;
                }
            }
        }
    }

    long long result = (long long)points[max_edge_u].x * points[max_edge_v].x;

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(result);

    free(points);
    free(min_dist);
    free(parent);
    free(visited);
    aoc_cleanup(input);

    return 0;
}
