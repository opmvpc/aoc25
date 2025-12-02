/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef unsigned long long u64;
typedef __int128 u128;

static const u64 POW10[20] = {
    1ULL, 10ULL, 100ULL, 1000ULL, 10000ULL, 100000ULL, 1000000ULL, 10000000ULL,
    100000000ULL, 1000000000ULL, 10000000000ULL, 100000000000ULL, 1000000000000ULL,
    10000000000000ULL, 100000000000000ULL, 1000000000000000ULL, 10000000000000000ULL,
    100000000000000000ULL, 1000000000000000000ULL, 10000000000000000000ULL
};

// Unique prime factors for lengths 2..19
// Format: {count, f1, f2, ...}
static const int FACTORS[20][5] = {
    {0}, {0}, // 0, 1
    {1, 2}, // 2
    {1, 3}, // 3
    {1, 2}, // 4
    {1, 5}, // 5
    {2, 2, 3}, // 6
    {1, 7}, // 7
    {1, 2}, // 8
    {1, 3}, // 9
    {2, 2, 5}, // 10
    {1, 11}, // 11
    {2, 2, 3}, // 12
    {1, 13}, // 13
    {2, 2, 7}, // 14
    {2, 3, 5}, // 15
    {1, 2}, // 16
    {1, 17}, // 17
    {2, 2, 3}, // 18
    {1, 19} // 19
};

static inline int gcd(int a, int b) {
    while (b) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

static inline int lcm(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return (a * b) / gcd(a, b);
}

// Sum of periodic numbers of length `len` with base period `p` <= limit
// Optimized to use POW10 lookup
static inline u128 sum_gen(int len, int p, u64 limit) {
    // Construct Mp = sum(10^(i*p))
    int k = len / p;
    u128 Mp = 0;
    
    // Unrolling this loop is tricky because p varies, but k is small.
    // For max len 19, k can be 9 (p=2).
    for (int i = 0; i < k; i++) {
        // i*p will be < 20
        Mp += POW10[i * p];
    }

    u64 min_x = POW10[p - 1];
    u64 max_x = POW10[p] - 1;

    // limitX = floor(limit / Mp)
    u128 limit_x = (u128)limit / Mp;
    
    u128 effective_max_x = max_x;
    if (limit_x < effective_max_x) {
        effective_max_x = limit_x;
    }

    if (effective_max_x < min_x) return 0;

    u128 count = effective_max_x - min_x + 1;
    u128 sum_x = ((u128)(min_x) + effective_max_x) * count / 2;

    return sum_x * Mp;
}

static inline u128 calc_sum_for_len(int len, u64 limit) {
    int num_factors = FACTORS[len][0];
    if (num_factors == 0) return 0;

    u128 sum_for_len = 0;
    int num_subsets = 1 << num_factors;

    // Iterate all non-empty subsets
    for (int i = 1; i < num_subsets; i++) {
        int lcm_val = 1;
        int set_bits = 0;
        
        // num_factors is at most 3 (for len=30, but for len<=19 max is 2 actually? Wait, 2*3*5 = 30. So max 2 factors for <=19)
        // FACTORS[len] has size 5, index 1..num_factors
        for (int j = 0; j < num_factors; j++) {
            if ((i >> j) & 1) {
                lcm_val = lcm(lcm_val, FACTORS[len][j + 1]);
                set_bits++;
            }
        }

        int d = len / lcm_val;
        u128 term = sum_gen(len, d, limit);

        if (set_bits & 1) {
            sum_for_len += term;
        } else {
            sum_for_len -= term;
        }
    }

    return sum_for_len;
}

static inline u128 solve_limit(u64 limit) {
    if (limit < 11) return 0;
    
    u64 temp = limit;
    int L = 0;
    // fast log10 ?
    // For small numbers simple loop is fine.
    if (temp >= 10000000000000000ULL) { L = 17; temp /= 10000000000000000ULL; }
    // Standard loop for remaining
    while (temp > 0) {
        temp /= 10;
        L++;
    }
    if (limit == 0) L = 1;

    u128 total = 0;

    for (int l = 2; l < L; l++) {
        // Use max u64 as infinity
        total += calc_sum_for_len(l, 18446744073709551615ULL);
    }

    total += calc_sum_for_len(L, limit);

    return total;
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    u128 total_sum = 0;
    char* p = input;
    
    while (*p) {
        // Fast skip non-digits
        while (*p && *p <= ' ') p++;
        if (!*p) break;
        
        u64 min_val = 0;
        while (*p >= '0') { // Assuming valid input only digits and - 
            min_val = min_val * 10 + (*p++ - '0');
        }
        
        // *p is now '-', skip it
        p++; 
        
        u64 max_val = 0;
        while (*p >= '0') {
            max_val = max_val * 10 + (*p++ - '0');
        }
        
        // Skip comma or newline if present
        if (*p == ',' || *p == '\n') p++;

        total_sum += solve_limit(max_val) - solve_limit(min_val - 1);
    }
    
    AOC_TIMER_END(solve);

    // Print u128
    printf("ANSWER:");
    if (total_sum == 0) {
        printf("0");
    } else {
        char buffer[50];
        int idx = 0;
        while (total_sum > 0) {
            buffer[idx++] = (char)((total_sum % 10) + '0');
            total_sum /= 10;
        }
        for (int i = idx - 1; i >= 0; i--) putchar(buffer[i]);
    }
    printf("\n");
    
    aoc_cleanup(input);
    return 0;
}