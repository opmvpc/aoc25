/**
 * 🎄 AoC 2025 Battle Royale - Common C Header
 *
 * Include this in all C solutions for standardized timing and output.
 *
 * Usage:
 *   #include "../../tools/runner/c/common.h"
 *
 *   int main(void) {
 *     char* input = aoc_read_input();
 *
 *     AOC_TIMER_START(parse);
 *     // ... parse input ...
 *     AOC_TIMER_END(parse);
 *
 *     AOC_TIMER_START(solve);
 *     // ... solve ...
 *     AOC_TIMER_END(solve);
 *
 *     AOC_RESULT("12345");  // or AOC_RESULT_INT(12345);
 *
 *     aoc_cleanup(input);
 *     return 0;
 *   }
 */

#ifndef AOC_COMMON_H
#define AOC_COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/time.h>
#endif

// ═══════════════════════════════════════════════════════════════
// High-precision timing
// ═══════════════════════════════════════════════════════════════

typedef struct {
    #ifdef _WIN32
    LARGE_INTEGER start;
    LARGE_INTEGER end;
    LARGE_INTEGER freq;
    #else
    struct timeval start;
    struct timeval end;
    #endif
} AocTimer;

static AocTimer _aoc_timers[10];
static int _aoc_timer_count = 0;

static inline void aoc_timer_start(AocTimer* timer) {
    #ifdef _WIN32
    QueryPerformanceFrequency(&timer->freq);
    QueryPerformanceCounter(&timer->start);
    #else
    gettimeofday(&timer->start, NULL);
    #endif
}

static inline double aoc_timer_end(AocTimer* timer) {
    #ifdef _WIN32
    QueryPerformanceCounter(&timer->end);
    return (double)(timer->end.QuadPart - timer->start.QuadPart) * 1000.0 / timer->freq.QuadPart;
    #else
    gettimeofday(&timer->end, NULL);
    return (timer->end.tv_sec - timer->start.tv_sec) * 1000.0 +
           (timer->end.tv_usec - timer->start.tv_usec) / 1000.0;
    #endif
}

// Timer macros
#define AOC_TIMER_START(name) \
    AocTimer _timer_##name; \
    aoc_timer_start(&_timer_##name)

#define AOC_TIMER_END(name) \
    double _time_##name##_ms = aoc_timer_end(&_timer_##name); \
    printf("TIME:%s:%.6f\n", #name, _time_##name##_ms)

// ═══════════════════════════════════════════════════════════════
// Input reading
// ═══════════════════════════════════════════════════════════════

#define AOC_MAX_INPUT (1024 * 1024 * 10)  // 10MB max input

static inline char* aoc_read_input(void) {
    char* buffer = (char*)malloc(AOC_MAX_INPUT);
    if (!buffer) {
        fprintf(stderr, "ERROR:Failed to allocate input buffer\n");
        exit(1);
    }

    size_t total = 0;
    size_t read;

    while ((read = fread(buffer + total, 1, AOC_MAX_INPUT - total - 1, stdin)) > 0) {
        total += read;
        if (total >= AOC_MAX_INPUT - 1) break;
    }

    buffer[total] = '\0';
    return buffer;
}

static inline void aoc_cleanup(char* input) {
    if (input) free(input);
}

// ═══════════════════════════════════════════════════════════════
// Result output (standardized format)
// ═══════════════════════════════════════════════════════════════

#define AOC_RESULT(str) printf("ANSWER:%s\n", str)
#define AOC_RESULT_INT(val) printf("ANSWER:%lld\n", (long long)(val))
#define AOC_RESULT_UINT(val) printf("ANSWER:%llu\n", (unsigned long long)(val))

#define AOC_ERROR(msg) printf("ERROR:%s\n", msg)

// ═══════════════════════════════════════════════════════════════
// Common utilities
// ═══════════════════════════════════════════════════════════════

// Count lines in input
static inline int aoc_count_lines(const char* input) {
    int count = 0;
    for (const char* p = input; *p; p++) {
        if (*p == '\n') count++;
    }
    // Count last line if no trailing newline
    if (input[0] && input[strlen(input) - 1] != '\n') count++;
    return count;
}

// Split input into lines (returns array of pointers, caller must free array but not strings)
static inline char** aoc_split_lines(char* input, int* out_count) {
    int capacity = 1000;
    char** lines = (char**)malloc(capacity * sizeof(char*));
    int count = 0;

    char* line = strtok(input, "\n");
    while (line) {
        if (count >= capacity) {
            capacity *= 2;
            lines = (char**)realloc(lines, capacity * sizeof(char*));
        }
        lines[count++] = line;
        line = strtok(NULL, "\n");
    }

    *out_count = count;
    return lines;
}

// Parse integer from string
static inline long long aoc_parse_int(const char* str) {
    return strtoll(str, NULL, 10);
}

#endif // AOC_COMMON_H
