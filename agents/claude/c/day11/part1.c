#include "../../tools/runner/c/common.h"
#include <string.h>

#define HASH_SIZE 17576
#define MAX_EDGES 32

static short node_to_idx[HASH_SIZE];  // -1 if unused, else node index
static short adj[700][MAX_EDGES];     // ~610 nodes expected
static unsigned char adj_count[700];
static long long path_count[700];
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

int main(void) {
    char* input = aoc_read_input();
    memset(node_to_idx, -1, sizeof(node_to_idx));
    
    AOC_TIMER_START(parse);
    
    const char* p = input;
    while (*p >= 'a') {
        short src = get_or_create(hash3(p));
        p += 5;  // "xxx: "
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
    
    short out_idx = node_to_idx[hash3("out")];
    short you_idx = node_to_idx[hash3("you")];
    short n = node_count;
    
    for (int i = 0; i < n; i++) { path_count[i] = -1; visited[i] = 0; }
    path_count[out_idx] = 1;
    
    int top = 0;
    stack[top++] = you_idx;
    
    while (top > 0) {
        short curr = stack[top - 1];
        if (path_count[curr] >= 0) { top--; continue; }
        
        if (visited[curr]) {
            long long sum = 0;
            unsigned char cnt = adj_count[curr];
            short* e = adj[curr];
            for (int i = 0; i < cnt; i++) sum += path_count[e[i]];
            path_count[curr] = sum;
            top--;
        } else {
            visited[curr] = 1;
            unsigned char cnt = adj_count[curr];
            short* e = adj[curr];
            for (int i = 0; i < cnt; i++) {
                if (path_count[e[i]] < 0) stack[top++] = e[i];
            }
        }
    }
    
    AOC_TIMER_END(solve);
    
    AOC_RESULT_INT(path_count[you_idx]);
    aoc_cleanup(input);
    return 0;
}
