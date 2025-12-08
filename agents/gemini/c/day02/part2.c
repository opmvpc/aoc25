#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
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

typedef struct { uint64_t min; uint64_t max; } Range;

static char buf[65536];
static uint64_t collected[30000];
static Range ranges[1024];

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

static inline void sort_u64(uint64_t* arr, int n) {
    // Insertion sort since array is mostly sorted (blocks of sorted data)
    for (int i = 1; i < n; i++) {
        uint64_t key = arr[i];
        int j = i - 1;
        // Optimize: most likely key >= arr[j]
        if (arr[j] <= key) continue;
        
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

int main() {
    ssize_t ret = sys_read(0, buf, sizeof(buf));
    if (ret <= 0) return 0;
    
    timer_start();
    
    int rc = 0;
    char* p = buf;
    char* end = buf + ret;
    
    while (p < end) {
        while (p < end && (*p < '0' || *p > '9')) p++;
        if (p >= end) break;
        
        uint64_t v1 = 0;
        while (p < end && *p >= '0') v1 = v1*10 + (*p++ - '0');
        if (p < end && *p == '-') p++;
        uint64_t v2 = 0;
        while (p < end && *p >= '0') v2 = v2*10 + (*p++ - '0');
        ranges[rc++] = (Range){v1, v2};
    }
    
    sort_ranges(ranges, rc);
    
    int mrc = 0;
    if (rc > 0) {
        int w = 0;
        for (int i=1; i<rc; i++) {
            if (ranges[i].min <= ranges[w].max + 1) {
                if (ranges[i].max > ranges[w].max) ranges[w].max = ranges[i].max;
            } else {
                w++;
                ranges[w] = ranges[i];
            }
        }
        mrc = w + 1;
    }
    
    uint64_t max_val = ranges[mrc-1].max;
    int max_digits = 0;
    uint64_t tmp = max_val;
    while(tmp) { tmp /= 10; max_digits++; }
    if (max_digits == 0) max_digits = 1;
    
    int c_count = 0;
    
    for (int total_len = 2; total_len <= max_digits; total_len++) {
        for (int L = 1; L <= total_len/2; L++) {
            if (total_len % L != 0) continue;
            int n = total_len / L;
            
            uint64_t M = 0;
            uint64_t p10L = 1;
            for(int k=0; k<L; k++) p10L *= 10;
            
            uint64_t cur = 1;
            for(int i=0; i<n; i++) {
                M += cur;
                cur *= p10L;
            }
            
            uint64_t min_P = 1;
            for(int k=0; k<L-1; k++) min_P *= 10;
            uint64_t max_P = min_P * 10 - 1;
            
            uint64_t start_ID = min_P * M;
            uint64_t end_ID = max_P * M;
            
            for (int i=0; i<mrc; i++) {
                uint64_t r_min = ranges[i].min;
                uint64_t r_max = ranges[i].max;
                
                uint64_t overlap_min = (start_ID > r_min) ? start_ID : r_min;
                uint64_t overlap_max = (end_ID < r_max) ? end_ID : r_max;
                
                if (overlap_min <= overlap_max) {
                    uint64_t first = overlap_min;
                    uint64_t rem = first % M;
                    if (rem != 0) first += (M - rem);
                    
                    for (uint64_t val = first; val <= overlap_max; val += M) {
                        collected[c_count++] = val;
                    }
                }
            }
        }
    }
    
    sort_u64(collected, c_count);
    
    uint64_t total = 0;
    if (c_count > 0) {
        total = collected[0];
        for (int i=1; i<c_count; i++) {
            if (collected[i] != collected[i-1]) total += collected[i];
        }
    }
    
    timer_end("solve");
    printf("ANSWER:%lu\n", total);
    return 0;
}