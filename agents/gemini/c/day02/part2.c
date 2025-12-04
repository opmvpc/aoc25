/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Optimized C Solution using 128-bit arithmetic and Inclusion-Exclusion Principle
 */

#include "../../tools/runner/c/common.h"

// 128-bit integer support
typedef unsigned __int128 u128;

// Helper to print u128
void print_u128(u128 n) {
    char buffer[50];
    int i = 0;
    if (n == 0) {
        printf("0");
        return;
    }
    while (n > 0) {
        buffer[i++] = (n % 10) + '0';
        n /= 10;
    }
    for (int j = i - 1; j >= 0; j--) putchar(buffer[j]);
}

// GCD and LCM
static int gcd(int a, int b) {
    while (b) { int t = b; b = a % b; a = t; }
    return a;
}

static int lcm(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return (a * b) / gcd(a, b);
}

// Get prime factors of n
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

// 10^p
static u128 pow10_u128(int p) {
    u128 r = 1;
    u128 b = 10;
    while (p > 0) {
        if (p & 1) r *= b;
        b *= b;
        p >>= 1;
    }
    return r;
}

// Calculate sum of numbers of length 'len' with period 'p' <= limit
// Numbers are formed by repeating a p-digit number X, k = len/p times.
// Value is X * M, where M = 10^0 + 10^p + ... + 10^(len-p)
static u128 sum_gen(int len, int p, u128 limit) {
    int k = len / p;
    u128 M = 0;
    u128 step = pow10_u128(p);
    
    // Construct M: 10101...
    u128 current_pow = 1;
    for (int i = 0; i < k; i++) {
        M += current_pow;
        current_pow *= step;
    }
    
    u128 minX = pow10_u128(p - 1);
    u128 maxX = step - 1;
    
    // Calculate max X such that X * M <= limit
    u128 limitX = limit / M;
    
    u128 effectiveMaxX = (limitX < maxX) ? limitX : maxX;
    
    if (effectiveMaxX < minX) return 0;
    
    u128 count = effectiveMaxX - minX + 1;
    u128 sumX = (minX + effectiveMaxX) * count / 2;
    
    return sumX * M;
}

// Calculate sum of invalid numbers of exact length 'len' <= limit
static u128 calc_sum_for_len(int len, u128 limit) {
    int factors[10];
    int num_factors = get_prime_factors(len, factors);
    if (num_factors == 0) return 0;

    u128 sum_len = 0;
    int num_subsets = 1 << num_factors;

    // Inclusion-Exclusion Principle
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
        
        if (set_bits % 2 == 1) sum_len += term;
        else sum_len -= term;
    }
    
    return sum_len;
}

// Solve for range [1, limit]
static u128 solve_limit(u128 limit) {
    if (limit == 0) return 0;
    
    // Determine length of limit
    int L = 0;
    u128 temp = limit;
    while (temp > 0) {
        temp /= 10;
        L++;
    }
    
    u128 total = 0;
    
    // For lengths < L, sum all valid numbers (effective limit is infinity)
    // Max value for len l is 10^l - 1
    for (int l = 2; l < L; l++) {
        u128 max_val = pow10_u128(l) - 1;
        total += calc_sum_for_len(l, max_val);
    }
    
    // For length L, sum up to limit
    total += calc_sum_for_len(L, limit);
    
    return total;
}

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    AOC_TIMER_START(solve);
    
    u128 total = 0;
    char* p = input;
    
    while (*p) {
        // Skip non-digits
        while (*p && !(*p >= '0' && *p <= '9')) p++;
        if (!*p) break;
        
        // Parse A
        u128 A = 0;
        while (*p >= '0' && *p <= '9') {
            A = A * 10 + (*p - '0');
            p++;
        }
        
        if (*p == '-') p++;
        
        // Parse B
        u128 B = 0;
        while (*p >= '0' && *p <= '9') {
            B = B * 10 + (*p - '0');
            p++;
        }
        
        total += solve_limit(B);
        total -= solve_limit(A - 1);
    }

    AOC_TIMER_END(solve);

    // Output result
    printf("ANSWER:");
    print_u128(total);
    printf("\n");

    aoc_cleanup(input);
    return 0;
}