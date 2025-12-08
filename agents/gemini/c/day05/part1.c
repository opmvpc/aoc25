#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <time.h>

static struct timespec ts_start;
static inline void timer_start() { clock_gettime(CLOCK_MONOTONIC, &ts_start); }
static inline void timer_end(const char* name) {
    struct timespec ts_end;
    clock_gettime(CLOCK_MONOTONIC, &ts_end);
    double ms = (ts_end.tv_sec - ts_start.tv_sec) * 1000.0 + (ts_end.tv_nsec - ts_start.tv_nsec) / 1000000.0;
    printf("TIME:%s:%.6f\n", name, ms);
}

static inline ssize_t sys_read(int fd, void *buf, size_t count) {
    ssize_t ret;
    asm volatile ("syscall" : "=a" (ret) : "0" (SYS_read), "D" (fd), "S" (buf), "d" (count) : "rcx", "r11", "memory");
    return ret;
}

static char input_buf[65536];

typedef struct { long long min; long long max; } Range;

static inline void sort_ranges(Range* arr, int n) {
    for (int i = 1; i < n; i++) {
        Range key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j].min > key.min) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

int main() {
    ssize_t n_read = sys_read(0, input_buf, sizeof(input_buf));
    if (n_read <= 0) return 0;
    
    timer_start();
    
    Range ranges[256];
    int rc = 0;
    
    char* p = input_buf;
    char* end = p + n_read;
    
    // Parse Ranges (Heuristic: stop at first line starting with non-digit or newline-newline)
    while (p < end) {
        // Skip whitespace
        while (p < end && *p <= 32) {
            // Check for double newline transition
            if (*p == '\n' && p + 1 < end && p[1] == '\n') {
                p += 2;
                goto ids;
            }
            p++;
        }
        if (p >= end) break;
        
        long long v1 = 0;
        while (*p >= '0') v1 = v1 * 10 + (*p++ - '0');
        p++; // skip '-'
        long long v2 = 0;
        while (*p >= '0') v2 = v2 * 10 + (*p++ - '0');
        ranges[rc].min = v1;
        ranges[rc].max = v2;
        rc++;
    }

ids:
    sort_ranges(ranges, rc);
    
    int mrc = 0;
    if (rc > 0) {
        int w = 0;
        for (int i = 1; i < rc; i++) {
            if (ranges[i].min <= ranges[w].max + 1) {
                if (ranges[i].max > ranges[w].max) ranges[w].max = ranges[i].max;
            } else {
                w++;
                ranges[w] = ranges[i];
            }
        }
        mrc = w + 1;
    }
    
    long long mins[256];
    long long maxs[256];
    for(int i=0; i<mrc; i++) {
        mins[i] = ranges[i].min;
        maxs[i] = ranges[i].max;
    }
    
    long long cnt = 0;
    
    // Parse IDs & Binary Search (Branchless-ish)
    // Most IDs are 10 digits or more.
    
    while (p < end) {
        // Skip non-digits
        // Fast skip
        while (p < end && *p <= 32) p++;
        if (p >= end) break;
        
        long long id = 0;
        
        // Assume numbers have at least 1 digit.
        // Unroll 4x? No, digit count varies.
        // Basic loop is compiled well.
        do {
            id = id * 10 + (*p - '0');
            p++;
        } while (p < end && *p >= '0');
        
        // Binary search: Find largest index i such that mins[i] <= id
        // Upper bound - 1.
        // Array `mins` is sorted.
        int base = 0;
        int len = mrc;
        
        while (len > 0) {
            int half = len >> 1;
            int mid = base + half;
            if (mins[mid] <= id) {
                base = mid + 1;
                len = len - half - 1;
            } else {
                len = half;
            }
        }
        // base is number of elements <= id.
        // The candidate range index is base - 1.
        int idx = base - 1;
        
        if (idx >= 0) {
            // Check max
            // Use bitwise to avoid branch?
            // if (id <= maxs[idx]) cnt++;
            cnt += (id <= maxs[idx]);
        }
    }
    
    timer_end("solve");
    printf("ANSWER:%lld\n", cnt);
    return 0;
}