/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

typedef unsigned long long u64;
typedef __int128 u128;

// --- Math Helpers ---

// Simple GCD
static int gcd(int a, int b) {
    while (b) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// Simple LCM
static int lcm(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return (a * b) / gcd(a, b);
}

// Get unique prime factors
// n <= 20 typically (number of digits)
static int get_prime_factors(int n, int* factors) {
    int count = 0;
    int d = 2;
    int temp = n;
    while (d * d <= temp) {
        if (temp % d == 0) {
            factors[count++] = d;
            while (temp % d == 0) temp /= d;
        }
        d++;
    }
    if (temp > 1) factors[count++] = temp;
    return count;
}

// Calculate 10^p
static u128 power_of_10(int p) {
    u128 res = 1;
    for (int i = 0; i < p; i++) res *= 10;
    return res;
}

// Sum of periodic numbers of length `len` with base period `p` <= limit
static u128 sum_gen(int len, int p, u64 limit) {
    // Construct Mp = sum(10^(i*p))
    int k = len / p;
    u128 Mp = 0;
    for (int i = 0; i < k; i++) {
        Mp += power_of_10(i * p);
    }

    u128 min_x = power_of_10(p - 1);
    u128 max_x = power_of_10(p) - 1;

    // limitX = floor(limit / Mp)
    u128 limit_x = (u128)limit / Mp;
    
    u128 effective_max_x = max_x;
    if (limit_x < effective_max_x) {
        effective_max_x = limit_x;
    }

    if (effective_max_x < min_x) return 0;

    u128 count = effective_max_x - min_x + 1;
    // Sum of X = (min + max) * count / 2
    u128 sum_x = (min_x + effective_max_x) * count / 2;

    return sum_x * Mp;
}

// Calculate total sum for a fixed length <= limit
static u128 calc_sum_for_len(int len, u64 limit) {
    int factors[10];
    int num_factors = get_prime_factors(len, factors);
    
    if (num_factors == 0) return 0;

    u128 sum_for_len = 0;
    int num_subsets = 1 << num_factors;

    // Iterate all non-empty subsets
    for (int i = 1; i < num_subsets; i++) {
        int lcm_val = 1;
        int set_bits = 0;
        for (int j = 0; j < num_factors; j++) {
            if ((i >> j) & 1) {
                lcm_val = lcm(lcm_val, factors[j]);
                set_bits++;
            }
        }

        int d = len / lcm_val;
        u128 term = sum_gen(len, d, limit);

        if (set_bits % 2 == 1) {
            sum_for_len += term;
        } else {
            sum_for_len -= term;
        }
    }

    return sum_for_len;
}

// Main calc function
static u128 solve_limit(u64 limit) {
    if (limit < 11) return 0;
    
    u64 temp = limit;
    int L = 0;
    while (temp > 0) {
        temp /= 10;
        L++;
    }
    if (limit == 0) L = 1;

    u128 total = 0;

    // Lengths < L
    for (int l = 2; l < L; l++) {
        u64 max_val = (u64)-1; 
        total += calc_sum_for_len(l, max_val);
    }

    // Length L
    total += calc_sum_for_len(L, limit);

    return total;
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    u128 total_sum = 0;
    char* p = input;
    
    while (*p) {
        while (*p && (*p < '0' || *p > '9')) p++;
        if (!*p) break;
        
        u64 min_val = 0;
        while (*p >= '0' && *p <= '9') {
            min_val = min_val * 10 + (*p++ - '0');
        }
        
        if (*p == '-') p++;
        
        u64 max_val = 0;
        while (*p >= '0' && *p <= '9') {
            max_val = max_val * 10 + (*p++ - '0');
        }
        
        total_sum += solve_limit(max_val) - solve_limit(min_val - 1);
    }
    
    AOC_TIMER_END(solve);

    // Print u128 with ANSWER: prefix
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
