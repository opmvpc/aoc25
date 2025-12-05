/**
 * 🎄 Advent of Code 2025 - Day 02 Part 2
 * Optimized C Solution: Precomputed Tables & 128-bit Math
 */

#include "../../tools/runner/c/common.h"

typedef unsigned __int128 u128;

// Tables
static u128 powers_of_10[40];
static int factors_count[32]; // Max length < 32
static int factors[32][5];    // Max factors for < 32 is small (2*3*5=30)

static void init_tables() {
    u128 p = 1;
    for(int i=0; i<40; i++) { powers_of_10[i] = p; p *= 10; }
    
    for(int i=1; i<32; i++) {
        int n = i;
        int cnt = 0;
        int d = 2;
        while(d*d <= n) {
            if(n%d == 0) {
                factors[i][cnt++] = d;
                while(n%d == 0) n/=d;
            }
            d++;
        }
        if(n > 1) factors[i][cnt++] = n;
        factors_count[i] = cnt;
    }
}

// Helper to print u128
void print_u128(u128 n) {
    if (n == 0) { printf("0"); return; }
    char buffer[50];
    int i = 0;
    while (n > 0) { buffer[i++] = (n % 10) + '0'; n /= 10; }
    for (int j = i - 1; j >= 0; j--) putchar(buffer[j]);
}

static inline int gcd(int a, int b) {
    while (b) { int t = b; b = a % b; a = t; }
    return a;
}

static inline int lcm(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return (a * b) / gcd(a, b);
}

static u128 sum_gen(int len, int p, u128 limit) {
    int k = len / p;
    
    // Construct M using precomputed powers
    u128 M = 0;
    // M = 1 + 10^p + 10^2p ...
    for (int i = 0; i < k; i++) {
        M += powers_of_10[i * p];
    }
    
    u128 minX = powers_of_10[p - 1];
    u128 maxX = powers_of_10[p] - 1;
    
    // Max X such that X * M <= limit
    u128 limitX = limit / M;
    
    u128 effectiveMaxX = (limitX < maxX) ? limitX : maxX;
    
    if (effectiveMaxX < minX) return 0;
    
    u128 count = effectiveMaxX - minX + 1;
    u128 sumX = (minX + effectiveMaxX) * count / 2;
    
    return sumX * M;
}

static u128 calc_sum_for_len(int len, u128 limit) {
    int cnt = factors_count[len];
    if (cnt == 0) return 0;

    u128 sum_len = 0;
    int num_subsets = 1 << cnt;

    // Iterate subsets 1 to 2^cnt - 1
    for (int i = 1; i < num_subsets; i++) {
        int lcm_val = 1;
        int set_bits = 0;
        
        // Manual unroll or tight loop
        // cnt is very small (max 3 for len < 30)
        int temp_i = i;
        for(int j=0; j<cnt; j++) {
             if ((temp_i >> j) & 1) {
                 lcm_val = lcm(lcm_val, factors[len][j]);
                 set_bits++;
             }
        }
        
        int d = len / lcm_val;
        u128 term = sum_gen(len, d, limit);
        
        if (set_bits & 1) sum_len += term;
        else sum_len -= term;
    }
    
    return sum_len;
}

static u128 solve_limit(u128 limit) {
    if (limit == 0) return 0;
    
    // Determine length
    int L = 0;
    u128 temp = limit;
    // Fast log10?
    if (temp >= powers_of_10[18]) L = 19; // Safe bound check if limit fits in u64
    else {
        // Linear scan or binary search? Linear on static table is fast
        // powers_of_10[L] <= limit. 
        // actually L is num digits. 10^0=1 (L=1), 10^1=10 (L=2)
        // if temp < 10, L=1.
        // if temp < 100, L=2.
        // loop
        for(int i=1; i<30; i++) {
            if (temp < powers_of_10[i]) {
                L = i;
                break;
            }
        }
    }
    
    u128 total = 0;
    
    for (int l = 2; l < L; l++) {
        total += calc_sum_for_len(l, powers_of_10[l] - 1);
    }
    
    total += calc_sum_for_len(L, limit);
    
    return total;
}

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;
    
    init_tables();

    AOC_TIMER_START(solve);
    
    u128 total = 0;
    char* p = input;
    
    // Optimized Parser
    while (*p) {
        // Skip non-digits
        // SWAR skip? No, standard is fine.
        while (*p && *p <= ' ') p++;
        if (!*p) break;
        
        // Parse A
        u128 A = 0;
        while (*p >= '0') { // '0' is 48, '-' is 45. 
            // Wait, '-' is < '0'.
            // Only digits are >= '0' if we assume no other chars > '0'.
            // Letters are > '0'.
            // Safest: *p >= '0' && *p <= '9'
            if (*p > '9') break; 
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
        
        // Skip comma
        if (*p == ',') p++;
        
        total += solve_limit(B);
        total -= solve_limit(A - 1);
    }

    AOC_TIMER_END(solve);

    printf("ANSWER:");
    print_u128(total);
    printf("\n");

    aoc_cleanup(input);
    return 0;
}
