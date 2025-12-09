#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdint.h>
#include <string.h>

#define MAX_N 1024

typedef struct {
    int32_t x, y;
} Point;

// Global BSS - zero initialized, no startup cost
char input_buffer[32768];
Point pts[MAX_N];
Point hull[MAX_N];

long long cross_product(Point a, Point b, Point o) {
    return (long long)(a.x - o.x) * (b.y - o.y) - (long long)(a.y - o.y) * (b.x - o.x);
}

int cmp_point(const void* a, const void* b) {
    Point* p1 = (Point*)a;
    Point* p2 = (Point*)b;
    if (p1->x != p2->x) return p1->x - p2->x;
    return p1->y - p2->y;
}

// Custom simple sort for small arrays might be faster than qsort overhead?
// Insertion sort is fast for N=500? No, N^2 = 250k. qsort is better.
// Radix sort? Coords up to 100k.
// Radix sort would be O(N).
// Let's stick to qsort for now, it's robust.

int main(void) {
    // Fast Read - minimal syscall
    ssize_t len = read(0, input_buffer, sizeof(input_buffer));
    if (len <= 0) return 0;
    
    // Manual Parsing
    int n = 0;
    int current_num = 0;
    int is_parsing = 0;
    int is_y = 0;
    
    char* p = input_buffer;
    char* end = input_buffer + len;
    
    while (p < end) {
        char c = *p++;
        if (c >= '0') { // Assumes only digits and separators < '0' (like \n, ,)
             // '0' is 48. ',' is 44. '\n' is 10.
             // So this check is valid for positive integers
             current_num = current_num * 10 + (c - '0');
             is_parsing = 1;
        } else {
             if (is_parsing) {
                 if (!is_y) {
                     pts[n].x = current_num;
                     is_y = 1;
                 } else {
                     pts[n].y = current_num;
                     is_y = 0;
                     n++;
                 }
                 current_num = 0;
                 is_parsing = 0;
             }
        }
    }
    if (is_parsing) {
         pts[n].y = current_num;
         n++;
    }

    // Convex Hull
    qsort(pts, n, sizeof(Point), cmp_point);
    
    int k = 0;
    // Lower Hull
    for (int i = 0; i < n; ++i) {
        while (k >= 2 && cross_product(pts[i], hull[k-1], hull[k-2]) <= 0) k--;
        hull[k++] = pts[i];
    }
    // Upper Hull
    for (int i = n - 2, t = k + 1; i >= 0; i--) {
        while (k >= t && cross_product(pts[i], hull[k-1], hull[k-2]) <= 0) k--;
        hull[k++] = pts[i];
    }
    
    long long max_area = 0;
    for (int i = 0; i < k; i++) {
        int x1 = hull[i].x;
        int y1 = hull[i].y;
        for (int j = i + 1; j < k; j++) {
            int x2 = hull[j].x;
            int y2 = hull[j].y;
            
            // Optimization: (abs(x) + 1) * (abs(y) + 1)
            // x, y are int32.
            int w = (x1 > x2) ? (x1 - x2) : (x2 - x1);
            int h = (y1 > y2) ? (y1 - y2) : (y2 - y1);
            
            long long area = (long long)(w + 1) * (h + 1);
            if (area > max_area) max_area = area;
        }
    }
    
    // Use printf_s or just write to stdout buffer?
    // printf is buffered.
    printf("%lld\n", max_area);

    return 0;
}
