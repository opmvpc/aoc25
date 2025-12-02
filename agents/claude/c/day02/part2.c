/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

// Pre-computed powers of 10
static long long POW10[20];

static inline void init_pow10() {
    POW10[0] = 1;
    for (int i = 1; i < 20; i++) {
        POW10[i] = POW10[i-1] * 10;
    }
}

static inline int count_digits(long long n) {
    if (n == 0) return 1;
    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;
    }
    return count;
}

// Simple hash set for deduplication (per-range, small)
#define HASH_SIZE 10007
typedef struct {
    long long values[HASH_SIZE];
    char used[HASH_SIZE];
} HashSet;

static inline void hash_init(HashSet* set) {
    for (int i = 0; i < HASH_SIZE; i++) {
        set->used[i] = 0;
    }
}

static inline int hash_insert(HashSet* set, long long value) {
    int idx = (value % HASH_SIZE + HASH_SIZE) % HASH_SIZE;
    while (set->used[idx]) {
        if (set->values[idx] == value) return 0; // Already exists
        idx = (idx + 1) % HASH_SIZE;
    }
    set->values[idx] = value;
    set->used[idx] = 1;
    return 1; // Inserted
}

// Build repeated number using formula: pattern * sum(10^(i*patternLen)) for i=0..repeatCount-1
static inline long long build_repeated(long long pattern, int patternLen, int repeatCount) {
    long long result = 0;
    long long multiplier = 1;
    for (int i = 0; i < repeatCount; i++) {
        result += pattern * multiplier;
        multiplier *= POW10[patternLen];
    }
    return result;
}

int main(void) {
    init_pow10();

    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    char* ptr = input;
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long sum = 0;

    while (*ptr) {
        // Skip whitespace, commas, newlines
        while (*ptr && (*ptr == ',' || *ptr == ' ' || *ptr == '\n' || *ptr == '\r')) {
            ptr++;
        }

        if (!*ptr) break;

        // Parse range
        char* end;
        long long start = strtoll(ptr, &end, 10);
        ptr = end;

        if (*ptr == '-') ptr++;

        long long endNum = strtoll(ptr, &end, 10);
        ptr = end;

        // Local hash set for this range
        HashSet seen;
        hash_init(&seen);

        // Generate invalids directly
        int startLen = count_digits(start);
        int endLen = count_digits(endNum);

        for (int totalLen = startLen; totalLen <= endLen; totalLen++) {
            // Try all pattern lengths that divide totalLen
            for (int patternLen = 1; patternLen <= totalLen / 2; patternLen++) {
                if (totalLen % patternLen != 0) continue;

                int repeatCount = totalLen / patternLen;
                if (repeatCount < 2) continue;

                long long minPattern = POW10[patternLen - 1];
                long long maxPattern = POW10[patternLen] - 1;

                for (long long pattern = minPattern; pattern <= maxPattern; pattern++) {
                    // Build repeated number using cached powers
                    long long repeated = build_repeated(pattern, patternLen, repeatCount);

                    if (repeated >= start && repeated <= endNum) {
                        if (hash_insert(&seen, repeated)) {
                            sum += repeated;
                        }
                    } else if (repeated > endNum) {
                        break;
                    }
                }
            }
        }
    }

    long long result = sum;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    aoc_cleanup(input);
    return 0;
}
