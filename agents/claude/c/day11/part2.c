#include "../../tools/runner/c/common.h"
#include <string.h>

#define HASH_SIZE 17576
#define MAX_EDGES 32

static short node_to_idx[HASH_SIZE];
static short adj[700][MAX_EDGES];
static unsigned char adj_count[700];
static long long memo[700];
static unsigned char visited[700];
static short stack[4096];
static short node_count = 0;

static inline int hash3(const char* s) {
    return (s[0] - 'a') + 26 * (s[1] - 'a') + 676 * (s[2] - 'a');
}

static inline short get_or_create(int h) {
    if (node_to_idx[h] >= 0) return node_to_idx[h];
    short idx = node_count++;
    node_to_idx[h] = idx;
    adj_count[idx] = 0;
    return idx;
}

static long long count_paths(short from, short to, short n) {
    if (from == to) return 1;
    
    for (int i = 0; i < n; i++) { memo[i] = -1; visited[i] = 0; }
    memo[to] = 1;
    
    int top = 0;
    stack[top++] = from;
    
    while (top > 0) {
        short curr = stack[top - 1];
        if (memo[curr] >= 0) { top--; continue; }
        
        if (visited[curr]) {
            long long sum = 0;
            unsigned char cnt = adj_count[curr];
            short* e = adj[curr];
            for (int i = 0; i < cnt; i++) {
                if (memo[e[i]] > 0) sum += memo[e[i]];
            }
            memo[curr] = sum;
            top--;
        } else {
            visited[curr] = 1;
            unsigned char cnt = adj_count[curr];
            short* e = adj[curr];
            for (int i = 0; i < cnt; i++) {
                if (memo[e[i]] < 0) stack[top++] = e[i];
            }
        }
    }
    
    return memo[from] > 0 ? memo[from] : 0;
}

int main(void) {
    char* input = aoc_read_input();
    memset(node_to_idx, -1, sizeof(node_to_idx));
    
    AOC_TIMER_START(parse);
    
    const char* p = input;
    while (*p >= 'a') {
        short src = get_or_create(hash3(p));
        p += 5;
        while (*p >= 'a') {
            short dst = get_or_create(hash3(p));
            adj[src][adj_count[src]++] = dst;
            p += 3;
            p += (*p == ' ');
        }
        p += (*p == '\n');
    }
    
    AOC_TIMER_END(parse);
    
    AOC_TIMER_START(solve);
    
    short svr = node_to_idx[hash3("svr")];
    short dac = node_to_idx[hash3("dac")];
    short fft = node_to_idx[hash3("fft")];
    short out = node_to_idx[hash3("out")];
    short n = node_count;
    
    // Case 1: svr -> dac -> fft -> out
    long long svr_dac = count_paths(svr, dac, n);
    long long dac_fft = count_paths(dac, fft, n);
    long long fft_out = count_paths(fft, out, n);
    
    // Case 2: svr -> fft -> dac -> out
    long long svr_fft = count_paths(svr, fft, n);
    long long fft_dac = count_paths(fft, dac, n);
    long long dac_out = count_paths(dac, out, n);
    
    long long result = svr_dac * dac_fft * fft_out + svr_fft * fft_dac * dac_out;
    
    AOC_TIMER_END(solve);
    
    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
