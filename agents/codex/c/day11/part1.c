/**
 * 🎄 Advent of Code 2025 - Day 11 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

#define MAX_NODES 17576  // 26^3

static uint16_t id_to_idx[MAX_NODES];  // stores (idx+1), 0 = unmapped
static uint16_t outdeg[MAX_NODES];
static uint32_t start_idx[MAX_NODES + 1];
static uint8_t state[MAX_NODES];
static unsigned long long counts[MAX_NODES];
static uint16_t order_nodes[MAX_NODES];
static uint16_t stack_nodes[MAX_NODES];
static uint32_t stack_pos[MAX_NODES];

static inline int encode3(const char* p) {
    return (p[0] - 'a') * 676 + (p[1] - 'a') * 26 + (p[2] - 'a');
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Two-pass parse with node compression (dense indices for cache locality).
    int node_count = 0;
    uint32_t edge_count = 0;

    const char* p = input;
    while (*p) {
        if (*p == '\n' || *p == '\r') {
            p++;
            continue;
        }
        const int from_id = encode3(p);
        const uint16_t from_map = id_to_idx[from_id];
        int from;
        if (from_map == 0) {
            from = node_count++;
            id_to_idx[from_id] = (uint16_t)(from + 1);
        } else {
            from = (int)from_map - 1;
        }
        p += 3;
        if (*p == ':') p++;
        if (*p == ' ') p++;

        while (*p && *p != '\n' && *p != '\r') {
            const int to_id = encode3(p);
            const uint16_t to_map = id_to_idx[to_id];
            int to;
            if (to_map == 0) {
                to = node_count++;
                id_to_idx[to_id] = (uint16_t)(to + 1);
            } else {
                to = (int)to_map - 1;
            }
            p += 3;
            outdeg[from]++;
            edge_count++;
            if (*p == ' ') p++;
        }
        while (*p == '\n' || *p == '\r') p++;
    }

    start_idx[0] = 0;
    for (int v = 0; v < node_count; v++) start_idx[v + 1] = start_idx[v] + outdeg[v];
    const uint32_t total_edges = start_idx[node_count];
    uint16_t* edges = (uint16_t*)malloc((size_t)total_edges * sizeof(uint16_t));
    for (int v = 0; v < node_count; v++) stack_pos[v] = start_idx[v];

    p = input;
    while (*p) {
        if (*p == '\n' || *p == '\r') {
            p++;
            continue;
        }
        const int from = (int)id_to_idx[encode3(p)] - 1;
        p += 3;
        if (*p == ':') p++;
        if (*p == ' ') p++;

        while (*p && *p != '\n' && *p != '\r') {
            const int to = (int)id_to_idx[encode3(p)] - 1;
            p += 3;
            edges[stack_pos[from]++] = (uint16_t)to;
            if (*p == ' ') p++;
        }
        while (*p == '\n' || *p == '\r') p++;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    const int YOU = (int)id_to_idx[encode3("you")] - 1;
    const int OUT = (int)id_to_idx[encode3("out")] - 1;
    if (YOU < 0 || OUT < 0) {
        AOC_TIMER_END(solve);
        AOC_RESULT_UINT(0);
        free(edges);
        aoc_cleanup(input);
        return 0;
    }

    // Iterative DFS from YOU to get postorder of reachable nodes.
    int sp = 0;
    stack_nodes[0] = (uint16_t)YOU;
    stack_pos[0] = start_idx[YOU];
    state[YOU] = 1;
    sp = 1;
    int order_len = 0;

    while (sp > 0) {
        const uint16_t v = stack_nodes[sp - 1];
        uint32_t pe = stack_pos[sp - 1];
        if (v == OUT) {
            state[v] = 2;
            order_nodes[order_len++] = v;
            sp--;
            continue;
        }
        const uint32_t end = start_idx[v + 1];
        if (pe < end) {
            const uint16_t to = edges[pe];
            stack_pos[sp - 1] = pe + 1;
            if (state[to] == 0) {
                state[to] = 1;
                stack_nodes[sp] = to;
                stack_pos[sp] = start_idx[to];
                sp++;
            }
        } else {
            state[v] = 2;
            order_nodes[order_len++] = v;
            sp--;
        }
    }

    counts[OUT] = 1ULL;
    for (int i = 0; i < order_len; i++) {
        const uint16_t v = order_nodes[i];
        if (v == OUT) continue;
        unsigned long long sum = 0ULL;
        for (uint32_t e = start_idx[v]; e < start_idx[v + 1]; e++) {
            sum += counts[edges[e]];
        }
        counts[v] = sum;
    }

    const unsigned long long result = counts[YOU];
    AOC_TIMER_END(solve);

    AOC_RESULT_UINT(result);

    free(edges);
    aoc_cleanup(input);
    return 0;
}
