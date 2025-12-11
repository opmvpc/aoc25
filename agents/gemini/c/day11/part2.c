#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdio.h>
#include <stdint.h>

#define MAX_NODES 4096
#define MAX_NEIGHBORS 32
#define MAX_HASH 17576

typedef struct {
    int neighbors[MAX_NEIGHBORS];
    int neighbor_count;
} Node;

Node nodes[MAX_NODES];
int node_count = 0;
int16_t id_map[MAX_HASH];

long long memo_val[MAX_NODES];
int memo_check[MAX_NODES];
int current_search_id = 0;

static inline int fast_hash(const char* s) {
    return (s[0] - 'a') * 676 + (s[1] - 'a') * 26 + (s[2] - 'a');
}

static inline int get_node_id(int hash) {
    if (id_map[hash] == -1) {
        if (node_count >= MAX_NODES) {
            fprintf(stderr, "ERROR: MAX_NODES exceeded\n");
            exit(1);
        }
        id_map[hash] = (int16_t)node_count++;
    }
    return id_map[hash];
}

long long count_paths(int u, int target_id) {
    if (u == target_id) return 1;
    if (memo_check[u] == current_search_id) return memo_val[u];

    long long total = 0;
    Node* node = &nodes[u];
    for (int i = 0; i < node->neighbor_count; i++) {
        total += count_paths(node->neighbors[i], target_id);
    }

    memo_check[u] = current_search_id;
    memo_val[u] = total;
    return total;
}

static inline long long get_paths_fast(int start_hash, int end_hash) {
    int start_id = id_map[start_hash];
    int end_id = id_map[end_hash];
    
    if (start_id == -1 || end_id == -1) return 0;

    current_search_id++; // New search, invalidates old memo entries implicitly
    
    return count_paths(start_id, end_id);
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(parse);

    // Init id_map only
    // memset for id_map is faster than loop
    memset(id_map, -1, sizeof(id_map));
    memset(memo_check, 0, sizeof(memo_check));
    node_count = 0;
    
    char* p = input;
    while (*p) {
        while (*p == '\n') p++;
        if (!*p) break;

        // "aaa" -> hash
        int src_hash = (p[0] - 'a') * 676 + (p[1] - 'a') * 26 + (p[2] - 'a');
        int u = get_node_id(src_hash);
        
        p += 5; // ": "
        
        while (1) {
            int dest_hash = (p[0] - 'a') * 676 + (p[1] - 'a') * 26 + (p[2] - 'a');
            int v = get_node_id(dest_hash);
            
            if (nodes[u].neighbor_count < MAX_NEIGHBORS) {
                nodes[u].neighbors[nodes[u].neighbor_count++] = v;
            }
            
            p += 3;
            if (*p == ' ') p++;
            else break;
        }
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    
    const int H_SVR = ('s'-'a')*676 + ('v'-'a')*26 + ('r'-'a');
    const int H_DAC = ('d'-'a')*676 + ('a'-'a')*26 + ('c'-'a');
    const int H_FFT = ('f'-'a')*676 + ('f'-'a')*26 + ('t'-'a');
    const int H_OUT = ('o'-'a')*676 + ('u'-'a')*26 + ('t'-'a');
    
    long long result = 0;

    // Check middle link first to determine order
    // Order 1: ... -> dac -> ... -> fft -> ...
    long long middle1 = get_paths_fast(H_DAC, H_FFT);
    
    if (middle1 > 0) {
        long long start = get_paths_fast(H_SVR, H_DAC);
        if (start > 0) {
            long long end = get_paths_fast(H_FFT, H_OUT);
            result = start * middle1 * end;
        }
    } else {
        // Order 2: ... -> fft -> ... -> dac -> ...
        long long middle2 = get_paths_fast(H_FFT, H_DAC);
        if (middle2 > 0) {
            long long start = get_paths_fast(H_SVR, H_FFT);
            if (start > 0) {
                long long end = get_paths_fast(H_DAC, H_OUT);
                result = start * middle2 * end;
            }
        }
    }
    
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
