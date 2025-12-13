/**
 * Advent of Code 2025 - Day 12 Part 1
 * Present Placement Problem - Optimized backtracking
 *
 * Compile: clang -O3 -march=native -o part1 part1.c
 */

#include "../../tools/runner/c/common.h"
#include <string.h>
#include <stdbool.h>

#define MAX_SHAPES 6
#define MAX_ORIENTATIONS 8
#define MAX_CELLS 7
#define MAX_WIDTH 51
#define MAX_PIECES 500

typedef struct {
    int8_t dr[MAX_CELLS];
    int8_t dc[MAX_CELLS];
    int8_t num_cells;
    int8_t max_r;
    int8_t max_c;
} Shape;

typedef struct {
    Shape o[MAX_ORIENTATIONS];
    int num;
} ShapeType;

static ShapeType g_shapes[MAX_SHAPES];
static int g_num_shapes;
static uint8_t g_grid[MAX_WIDTH * MAX_WIDTH];

static inline void normalize(int8_t* r, int8_t* c, int n) {
    int8_t min_r = r[0], min_c = c[0];
    for (int i = 1; i < n; i++) {
        if (r[i] < min_r) min_r = r[i];
        if (c[i] < min_c) min_c = c[i];
    }
    for (int i = 0; i < n; i++) {
        r[i] -= min_r;
        c[i] -= min_c;
    }
    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (r[j] < r[i] || (r[j] == r[i] && c[j] < c[i])) {
                int8_t t = r[i]; r[i] = r[j]; r[j] = t;
                t = c[i]; c[i] = c[j]; c[j] = t;
            }
        }
    }
}

static inline bool shapes_eq(int8_t* r1, int8_t* c1, int8_t* r2, int8_t* c2, int n) {
    for (int i = 0; i < n; i++) {
        if (r1[i] != r2[i] || c1[i] != c2[i]) return false;
    }
    return true;
}

static void gen_orientations(int8_t* orig_r, int8_t* orig_c, int n, ShapeType* st) {
    st->num = 0;
    int8_t curr_r[MAX_CELLS], curr_c[MAX_CELLS];
    memcpy(curr_r, orig_r, n);
    memcpy(curr_c, orig_c, n);

    for (int flip = 0; flip < 2; flip++) {
        for (int rot = 0; rot < 4; rot++) {
            int8_t temp_r[MAX_CELLS], temp_c[MAX_CELLS];
            memcpy(temp_r, curr_r, n);
            memcpy(temp_c, curr_c, n);
            normalize(temp_r, temp_c, n);

            bool exists = false;
            for (int o = 0; o < st->num; o++) {
                if (shapes_eq(temp_r, temp_c, st->o[o].dr, st->o[o].dc, n)) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                Shape* s = &st->o[st->num++];
                s->num_cells = n;
                s->max_r = s->max_c = 0;
                for (int i = 0; i < n; i++) {
                    s->dr[i] = temp_r[i];
                    s->dc[i] = temp_c[i];
                    if (temp_r[i] > s->max_r) s->max_r = temp_r[i];
                    if (temp_c[i] > s->max_c) s->max_c = temp_c[i];
                }
            }

            for (int i = 0; i < n; i++) {
                int8_t nr = curr_c[i];
                int8_t nc = -curr_r[i];
                curr_r[i] = nr;
                curr_c[i] = nc;
            }
        }
        for (int i = 0; i < n; i++) {
            curr_r[i] = orig_r[i];
            curr_c[i] = -orig_c[i];
        }
    }
}

static bool solve(uint8_t* pieces, int num_pieces, int idx, int h, int w, int min_pos) {
    if (idx >= num_pieces) return true;

    int type = pieces[idx];
    ShapeType* st = &g_shapes[type];
    bool same = (idx + 1 < num_pieces) && (pieces[idx + 1] == type);

    for (int oi = 0; oi < st->num; oi++) {
        Shape* s = &st->o[oi];
        int n = s->num_cells;

        int start_pos = same ? min_pos : 0;
        int start_r = start_pos / w;

        for (int r = start_r; r <= h - s->max_r - 1; r++) {
            int start_c = (r == start_r) ? (start_pos % w) : 0;

            for (int c = start_c; c <= w - s->max_c - 1; c++) {
                bool ok = true;
                for (int i = 0; i < n && ok; i++) {
                    if (g_grid[(r + s->dr[i]) * w + (c + s->dc[i])]) ok = false;
                }

                if (ok) {
                    for (int i = 0; i < n; i++) {
                        g_grid[(r + s->dr[i]) * w + (c + s->dc[i])] = 1;
                    }

                    int next_min = same ? (r * w + c) : 0;
                    if (solve(pieces, num_pieces, idx + 1, h, w, next_min)) {
                        return true;
                    }

                    for (int i = 0; i < n; i++) {
                        g_grid[(r + s->dr[i]) * w + (c + s->dc[i])] = 0;
                    }
                }
            }
        }
    }

    return false;
}

static bool can_fit(int w, int h, int* counts) {
    int cells_needed = 0, total = 0;
    for (int i = 0; i < g_num_shapes; i++) {
        if (counts[i] > 0) {
            cells_needed += counts[i] * g_shapes[i].o[0].num_cells;
            total += counts[i];
        }
    }
    if (cells_needed > w * h) return false;
    if (total == 0) return true;

    uint8_t pieces[MAX_PIECES];
    int num = 0;
    for (int i = 0; i < g_num_shapes; i++) {
        for (int j = 0; j < counts[i]; j++) {
            pieces[num++] = i;
        }
    }

    memset(g_grid, 0, w * h);
    return solve(pieces, num, 0, h, w, 0);
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int lc = 0;
    char** lines = aoc_split_lines(input, &lc);

    int i = 0;
    g_num_shapes = 0;

    while (i < lc) {
        if (strchr(lines[i], 'x')) break;

        int idx;
        if (sscanf(lines[i], "%d:", &idx) == 1) {
            int8_t r[MAX_CELLS], c[MAX_CELLS];
            int n = 0;
            i++;
            int row = 0;
            while (i < lc && lines[i][0] && !strchr(lines[i], ':')) {
                for (int col = 0; lines[i][col]; col++) {
                    if (lines[i][col] == '#') {
                        r[n] = row;
                        c[n] = col;
                        n++;
                    }
                }
                row++;
                i++;
            }
            if (n > 0) {
                normalize(r, c, n);
                gen_orientations(r, c, n, &g_shapes[g_num_shapes++]);
            }
        } else {
            i++;
        }
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long result = 0;

    while (i < lc) {
        if (!lines[i][0]) { i++; continue; }

        int w, h;
        if (sscanf(lines[i], "%dx%d:", &w, &h) == 2) {
            int counts[MAX_SHAPES] = {0};
            char* p = strchr(lines[i], ':') + 1;
            while (*p == ' ') p++;

            for (int j = 0; j < g_num_shapes && *p; j++) {
                counts[j] = strtol(p, &p, 10);
                while (*p == ' ') p++;
            }

            if (can_fit(w, h, counts)) {
                result++;
            }
        }
        i++;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
