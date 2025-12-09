#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdint.h>
#include <string.h>

#define MAX_N 1024

typedef struct {
    int32_t x, y;
} Point;

// Global BSS
char input_buffer[32768];
Point points[MAX_N];
int32_t xs[MAX_N];
int32_t ys[MAX_N];

int32_t uniq_x[MAX_N];
int32_t uniq_y[MAX_N];

// Grids
int32_t grid_sat[MAX_N][MAX_N];
int32_t h_sat[MAX_N][MAX_N];
int32_t v_sat[MAX_N][MAX_N];
uint8_t is_poly_edge_v[MAX_N][MAX_N];
uint8_t is_poly_edge_h[MAX_N][MAX_N];

// Helpers
int cmp_int(const void* a, const void* b) {
    return (*(int*)a - *(int*)b);
}

int binary_search(int32_t* arr, int n, int val) {
    int l = 0, r = n - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == val) return m;
        if (arr[m] < val) l = m + 1;
        else r = m - 1;
    }
    return -1;
}

int main(void) {
    // Fast Read
    ssize_t len = read(0, input_buffer, sizeof(input_buffer));
    if (len <= 0) return 0;

    int n = 0;
    int num = 0;
    int parsing = 0;
    int is_y = 0;
    
    char* p = input_buffer;
    char* end = input_buffer + len;
    
    while (p < end) {
        char c = *p++;
        if (c >= '0') {
            num = num * 10 + (c - '0');
            parsing = 1;
        } else {
            if (parsing) {
                if (!is_y) {
                    xs[n] = num;
                    uniq_x[n] = num;
                    is_y = 1;
                } else {
                    ys[n] = num;
                    uniq_y[n] = num;
                    points[n].x = xs[n];
                    points[n].y = ys[n];
                    is_y = 0;
                    n++;
                }
                num = 0;
                parsing = 0;
            }
        }
    }
    if (parsing) { 
        ys[n] = num; points[n].x = xs[n]; points[n].y = ys[n]; uniq_y[n] = num; n++; 
    }

    // Coord Compression
    qsort(uniq_x, n, sizeof(int32_t), cmp_int);
    qsort(uniq_y, n, sizeof(int32_t), cmp_int);
    
    // Unique inline
    int nx = 0;
    if (n > 0) {
        nx = 1;
        for (int i = 1; i < n; i++) {
            if (uniq_x[i] != uniq_x[nx-1]) uniq_x[nx++] = uniq_x[i];
        }
    }
    int ny = 0;
    if (n > 0) {
        ny = 1;
        for (int i = 1; i < n; i++) {
            if (uniq_y[i] != uniq_y[ny-1]) uniq_y[ny++] = uniq_y[i];
        }
    }

    // Grid Construction
    // No memset needed if static globals (zero-init).
    // CAUTION: If runner reuses process (unlikely for C), we'd need memset.
    // Assuming fresh process.
    
    for (int i = 0; i < n; i++) {
        int idx_x1 = binary_search(uniq_x, nx, xs[i]);
        int idx_y1 = binary_search(uniq_y, ny, ys[i]);
        int idx_x2 = binary_search(uniq_x, nx, xs[(i + 1) % n]);
        int idx_y2 = binary_search(uniq_y, ny, ys[(i + 1) % n]);

        if (idx_x1 == idx_x2) {
            int y_start = (idx_y1 < idx_y2) ? idx_y1 : idx_y2;
            int y_end   = (idx_y1 > idx_y2) ? idx_y1 : idx_y2;
            for (int k = y_start; k < y_end; k++) is_poly_edge_v[idx_x1][k] = 1;
        } else {
            int x_start = (idx_x1 < idx_x2) ? idx_x1 : idx_x2;
            int x_end   = (idx_x1 > idx_x2) ? idx_x1 : idx_x2;
            for (int k = x_start; k < x_end; k++) is_poly_edge_h[k][idx_y1] = 1;
        }
    }

    for (int j = 0; j < ny - 1; j++) {
        int inside = 0;
        for (int i = 0; i < nx - 1; i++) {
            if (is_poly_edge_v[i][j]) inside = !inside;
            grid_sat[i][j] = inside;
        }
    }

    // Validity & SAT
    // Combined loops for cache locality
    
    // H-SAT
    for (int j = 0; j < ny; j++) {
        int sum = 0;
        for (int i = 0; i < nx - 1; i++) {
            int valid = is_poly_edge_h[i][j];
            if (!valid) {
                if (j < ny - 1 && grid_sat[i][j]) valid = 1;
                else if (j > 0 && grid_sat[i][j-1]) valid = 1;
            }
            sum += valid;
            h_sat[i][j] = sum;
        }
    }
    
    // V-SAT
    for (int i = 0; i < nx; i++) {
        int sum = 0;
        for (int j = 0; j < ny - 1; j++) {
            int valid = is_poly_edge_v[i][j];
            if (!valid) {
                if (i < nx - 1 && grid_sat[i][j]) valid = 1;
                else if (i > 0 && grid_sat[i-1][j]) valid = 1;
            }
            sum += valid;
            v_sat[i][j] = sum;
        }
    }
    
    // Grid 2D SAT
    for (int j = 0; j < ny - 1; j++) {
        for (int i = 0; i < nx - 1; i++) {
            int val = grid_sat[i][j];
            if (i > 0) val += grid_sat[i-1][j];
            if (j > 0) val += grid_sat[i][j-1];
            if (i > 0 && j > 0) val -= grid_sat[i-1][j-1];
            grid_sat[i][j] = val;
        }
    }

    // Precompute indices
    int p_idx_x[MAX_N], p_idx_y[MAX_N];
    for (int i = 0; i < n; i++) {
        p_idx_x[i] = binary_search(uniq_x, nx, points[i].x);
        p_idx_y[i] = binary_search(uniq_y, ny, points[i].y);
    }

    long long max_area_p2 = 0;

    for (int i = 0; i < n; i++) {
        int x1 = points[i].x;
        int y1 = points[i].y;
        int idx_x1 = p_idx_x[i];
        int idx_y1 = p_idx_y[i];

        for (int j = i + 1; j < n; j++) {
            int x2 = points[j].x;
            int y2 = points[j].y;
            
            long long w = (x1 > x2 ? x1 - x2 : x2 - x1);
            long long h = (y1 > y2 ? y1 - y2 : y2 - y1);
            long long area = (w + 1) * (h + 1);
            
            if (area <= max_area_p2) continue;
            
            int idx_x2 = p_idx_x[j];
            int idx_y2 = p_idx_y[j];
            
            int ix1 = (idx_x1 < idx_x2) ? idx_x1 : idx_x2;
            int ix2 = (idx_x1 > idx_x2) ? idx_x1 : idx_x2;
            int iy1 = (idx_y1 < idx_y2) ? idx_y1 : idx_y2;
            int iy2 = (idx_y1 > idx_y2) ? idx_y1 : idx_y2;
            
            // Checks
            // 1. Interior
            if (ix2 > ix1 && iy2 > iy1) {
                int total = (ix2 - ix1) * (iy2 - iy1);
                int sum = grid_sat[ix2 - 1][iy2 - 1];
                if (ix1 > 0) sum -= grid_sat[ix1 - 1][iy2 - 1];
                if (iy1 > 0) sum -= grid_sat[ix2 - 1][iy1 - 1];
                if (ix1 > 0 && iy1 > 0) sum += grid_sat[ix1 - 1][iy1 - 1];
                if (sum != total) continue;
            }
            
            // 2. Edges
            if (ix2 > ix1) {
                // Top
                int sum = h_sat[ix2 - 1][iy2];
                if (ix1 > 0) sum -= h_sat[ix1 - 1][iy2];
                if (sum != (ix2 - ix1)) continue;
                // Bottom
                sum = h_sat[ix2 - 1][iy1];
                if (ix1 > 0) sum -= h_sat[ix1 - 1][iy1];
                if (sum != (ix2 - ix1)) continue;
            }
            
            if (iy2 > iy1) {
                // Left
                int sum = v_sat[ix1][iy2 - 1];
                if (iy1 > 0) sum -= v_sat[ix1][iy1 - 1];
                if (sum != (iy2 - iy1)) continue;
                // Right
                sum = v_sat[ix2][iy2 - 1];
                if (iy1 > 0) sum -= v_sat[ix2][iy1 - 1];
                if (sum != (iy2 - iy1)) continue;
            }
            
            max_area_p2 = area;
        }
    }
    
    printf("%lld\n", max_area_p2);

    return 0;
}
