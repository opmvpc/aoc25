#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdio.h>
#include <stdint.h>

#define MAX_NODES 2048
#define MAX_NEIGHBORS 16
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
// Start with check=1, since global array initialized to 0
int current_search_id = 1;

static inline int get_node_id(int hash) {
    if (id_map[hash] == -1) {
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

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(parse);

    memset(id_map, -1, sizeof(id_map));
    // memo_check is already 0 (global)
    
    node_count = 0;
    char* p = input;
    
    while (*p) {
        while (*p == '\n') p++;
        if (!*p) break;

        int src_hash = (p[0] - 'a') * 676 + (p[1] - 'a') * 26 + (p[2] - 'a');
        int u = get_node_id(src_hash);
        
        p += 5; 
        
        while (1) {
            int dest_hash = (p[0] - 'a') * 676 + (p[1] - 'a') * 26 + (p[2] - 'a');
            int v = get_node_id(dest_hash);
            
            nodes[u].neighbors[nodes[u].neighbor_count++] = v;
            
            p += 3; 
            if (*p == ' ') p++;
            else break;
        }
    }
    
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    int start_id = id_map[(('y'-'a')*676 + ('o'-'a')*26 + ('u'-'a'))];
    int target_id = id_map[(('o'-'a')*676 + ('u'-'a')*26 + ('t'-'a'))];
    
    long long result = count_paths(start_id, target_id);
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}