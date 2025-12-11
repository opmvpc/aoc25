/**
 * 🎄 Advent of Code 2025 - Day 10 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

// Problem constraints: at most 10 indicator lights and 13 buttons per machine.
#define MAX_LIGHTS 10
#define MAX_STATES (1 << MAX_LIGHTS)
#define MAX_BUTTONS 16

static int16_t dist[MAX_STATES];
static uint16_t queue_states[MAX_STATES];

static inline int bfs_min_presses(int lights, int target, const uint16_t* buttons, int button_count) {
    const int states = 1 << lights;
    for (int i = 0; i < states; i++) dist[i] = -1;

    int head = 0;
    int tail = 0;
    queue_states[tail++] = 0;
    dist[0] = 0;

    while (head < tail) {
        const uint16_t state = queue_states[head++];
        const int16_t steps = dist[state];
        if (state == target) return steps;

        for (int i = 0; i < button_count; i++) {
            const uint16_t next = state ^ buttons[i];
            if (dist[next] == -1) {
                dist[next] = (int16_t)(steps + 1);
                queue_states[tail++] = next;
            }
        }
    }
    return -1;  // Should not happen for valid inputs.
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;

    for (int li = 0; li < line_count; li++) {
        char* line = lines[li];
        if (!line || !line[0]) continue;

        // Parse indicator pattern.
        char* p = strchr(line, '[');
        if (!p) continue;
        p++;  // move past '['
        int lights = 0;
        int target = 0;
        while (*p && *p != ']') {
            if (*p == '#') target |= 1 << lights;
            lights++;
            p++;
        }
        if (target == 0) continue;  // already matching

        // Parse buttons up to the '{' (joltage part is ignored).
        uint16_t buttons[MAX_BUTTONS];
        int button_count = 0;
        while (*p && *p != '{') {
            if (*p == '(') {
                p++;
                uint16_t mask = 0;
                int num = 0;
                int reading = 0;
                while (*p && *p != ')') {
                    if (*p >= '0' && *p <= '9') {
                        num = num * 10 + (*p - '0');
                        reading = 1;
                    } else {
                        if (reading) {
                            mask |= (uint16_t)(1u << num);
                            num = 0;
                            reading = 0;
                        }
                    }
                    p++;
                }
                if (reading) mask |= (uint16_t)(1u << num);
                if (*p == ')') p++;
                buttons[button_count++] = mask;
                continue;
            }
            p++;
        }

        const int presses = bfs_min_presses(lights, target, buttons, button_count);
        result += presses;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
