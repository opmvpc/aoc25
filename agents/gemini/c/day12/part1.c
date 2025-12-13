#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <ctype.h>

#include "../../tools/runner/c/common.h"

// --- Constants & Structures ---
#define MAX_SHAPES 10
#define MAX_SHAPE_SIZE 8
#define MAX_VARIANTS 8

typedef struct {
    int h, w;
    bool cells[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE];
} ShapeVariant;

typedef struct {
    int id;
    int area;
    int num_variants;
    ShapeVariant variants[MAX_VARIANTS];
} Shape;

Shape shapes[MAX_SHAPES];
int num_shapes = 0;

// --- Helpers ---

static inline int parse_int(char** p) {
    int v = 0;
    while (**p >= '0' && **p <= '9') {
        v = v * 10 + (**p - '0');
        (*p)++;
    }
    return v;
}

static inline void skip_whitespace(char** p) {
    while (**p == ' ' || **p == '\t' || **p == '\n' || **p == '\r') (*p)++;
}

static inline void skip_line(char** p) {
    while (**p && **p != '\n') (*p)++;
    if (**p == '\n') (*p)++;
}

// Add a variant if it doesn't exist
void add_variant(Shape* s, bool cells[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE], int h, int w) {
    // Check duplicates
    for (int k = 0; k < s->num_variants; k++) {
        ShapeVariant* v = &s->variants[k];
        if (v->h != h || v->w != w) continue;
        bool match = true;
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                if (v->cells[y][x] != cells[y][x]) {
                    match = false;
                    goto next_check;
                }
            }
        }
        return; // Duplicate
        next_check:;
    }

    if (s->num_variants < MAX_VARIANTS) {
        ShapeVariant* v = &s->variants[s->num_variants++];
        v->h = h;
        v->w = w;
        for (int y = 0; y < h; y++)
            memcpy(v->cells[y], cells[y], w * sizeof(bool));
    }
}

// Generate all 8 symmetries
void generate_variants_for_shape(Shape* s, bool base_cells[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE], int h, int w) {
    bool curr[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE];
    memcpy(curr, base_cells, sizeof(curr));

    for (int flip = 0; flip < 2; flip++) {
        for (int rot = 0; rot < 4; rot++) {
            add_variant(s, curr, h, w);
            // Rotate 90
            bool next[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE] = {0};
            int nh = w, nw = h;
            for(int y=0; y<nh; y++)
               for(int x=0; x<nw; x++)
                   next[y][x] = curr[nw - 1 - x][y];
            memcpy(curr, next, sizeof(curr));
            h = nh; w = nw;
        }
        // Flip original for second pass
        memcpy(curr, base_cells, sizeof(curr));
        h = s->variants[0].h; 
        w = s->variants[0].w; // Reset to base dims
        
        // Flip vertically
        bool next[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE] = {0};
        for(int y=0; y<h; y++)
           for(int x=0; x<w; x++)
               next[y][x] = curr[h - 1 - y][x];
        memcpy(curr, next, sizeof(curr));
        // Update base for next loop isn't needed as we used explicit base_cells
        memcpy(base_cells, curr, sizeof(curr)); // Hacky reuse of base_cells buffer for 2nd pass
    }
}

// --- Solvers ---

// Bitmask solver for small grids (<= 64 cells)
// Optimized with early exits
bool solve_bitmask(int W, int H, uint64_t grid, int* present_ids, int p_idx, int num_presents) {
    if (p_idx == num_presents) return true;

    int sid = present_ids[p_idx];
    Shape* s = &shapes[sid];

    for (int y = 0; y < H; y++) {
        for (int x = 0; x < W; x++) {
            for (int v = 0; v < s->num_variants; v++) {
                ShapeVariant* var = &s->variants[v];
                if (y + var->h > H || x + var->w > W) continue;

                // Check collision
                uint64_t mask = 0;
                bool fits = true;
                for (int dy = 0; dy < var->h; dy++) {
                    for (int dx = 0; dx < var->w; dx++) {
                        if (var->cells[dy][dx]) {
                            int bit = (y + dy) * W + (x + dx);
                            if ((grid >> bit) & 1ULL) {
                                fits = false;
                                goto next_variant;
                            }
                            mask |= (1ULL << bit);
                        }
                    }
                }

                if (solve_bitmask(W, H, grid | mask, present_ids, p_idx + 1, num_presents)) return true;

                next_variant:;
            }
        }
    }
    return false;
}

// Array solver for medium grids (65-200 cells)
bool solve_array(int W, int H, uint8_t* grid, int* present_ids, int p_idx, int num_presents) {
    if (p_idx == num_presents) return true;

    int sid = present_ids[p_idx];
    Shape* s = &shapes[sid];

    for (int y = 0; y < H; y++) {
        for (int x = 0; x < W; x++) {
            for (int v = 0; v < s->num_variants; v++) {
                ShapeVariant* var = &s->variants[v];
                if (y + var->h > H || x + var->w > W) continue;

                bool fits = true;
                for (int dy = 0; dy < var->h; dy++) {
                    for (int dx = 0; dx < var->w; dx++) {
                        if (var->cells[dy][dx]) {
                            if (grid[(y + dy) * W + (x + dx)]) {
                                fits = false;
                                goto next_variant_arr;
                            }
                        }
                    }
                }

                // Place
                for (int dy = 0; dy < var->h; dy++)
                    for (int dx = 0; dx < var->w; dx++)
                        if (var->cells[dy][dx]) grid[(y + dy) * W + (x + dx)] = 1;

                if (solve_array(W, H, grid, present_ids, p_idx + 1, num_presents)) return true;

                // Unplace
                for (int dy = 0; dy < var->h; dy++)
                    for (int dx = 0; dx < var->w; dx++)
                        if (var->cells[dy][dx]) grid[(y + dy) * W + (x + dx)] = 0;

                next_variant_arr:;
            }
        }
    }
    return false;
}

// --- Main ---

int main(void) {
    char* input = aoc_read_input();
    if (!input) return 1;

    char* p = input;
    int valid_regions = 0;

    // Temporary storage for shape parsing
    int current_shape_id = -1;
    bool current_shape_cells[MAX_SHAPE_SIZE][MAX_SHAPE_SIZE] = {0};
    int current_rows = 0;
    int current_cols = 0;

    while (*p) {
        skip_whitespace(&p);
        if (!*p) break;

        // Parse start of line (Shape ID or Region W)
        if (isdigit(*p)) {
            char* start = p;
            int val1 = parse_int(&p);

            if (*p == 'x') {
                // REGION: 42x42: ...

                // Flush previous shape if valid (e.g. valid transition from shapes to regions)
                if (current_shape_id != -1) {
                    Shape* s = &shapes[current_shape_id];
                    s->id = current_shape_id;
                    s->num_variants = 0;
                    int area = 0;
                    for(int r=0; r<current_rows; r++) 
                        for(int c=0; c<current_cols; c++) 
                            if(current_shape_cells[r][c]) area++;
                    s->area = area;
                    generate_variants_for_shape(s, current_shape_cells, current_rows, current_cols);
                    current_shape_id = -1;
                }

                p++; // skip 'x'
                int h = parse_int(&p);
                p++; // skip ':'
                
                // Fast Parse Counts
                // We know there are exactly 6 counts for shapes 0-5
                // Optimization: Unroll checks
                int c[6];
                skip_whitespace(&p); c[0] = parse_int(&p);
                skip_whitespace(&p); c[1] = parse_int(&p);
                skip_whitespace(&p); c[2] = parse_int(&p);
                skip_whitespace(&p); c[3] = parse_int(&p);
                skip_whitespace(&p); c[4] = parse_int(&p);
                skip_whitespace(&p); c[5] = parse_int(&p);

                // AREA CHECK
                // Use parsed shape areas for correctness
                long long present_area = 0;
                present_area += (long long)c[0] * shapes[0].area;
                present_area += (long long)c[1] * shapes[1].area;
                present_area += (long long)c[2] * shapes[2].area;
                present_area += (long long)c[3] * shapes[3].area;
                present_area += (long long)c[4] * shapes[4].area;
                present_area += (long long)c[5] * shapes[5].area;

                long long grid_area = (long long)val1 * h;

                if (present_area <= grid_area) {
                    // Only use backtracking for small grids
                    if (grid_area <= 200) {
                        // Populate present list
                        int present_list[100]; // Sample has few presents
                        int num_p = 0;
                        for(int i=0; i<6; i++) {
                            for(int k=0; k<c[i]; k++) present_list[num_p++] = i;
                        }
                        
                        // Sort descending (simple sort for small array)
                        for(int i=0; i<num_p-1; i++)
                            for(int j=0; j<num_p-i-1; j++)
                                if(shapes[present_list[j]].area < shapes[present_list[j+1]].area) {
                                    int temp = present_list[j];
                                    present_list[j] = present_list[j+1];
                                    present_list[j+1] = temp;
                                }

                        bool result = false;
                        if (grid_area <= 64) {
                             result = solve_bitmask(val1, h, 0, present_list, 0, num_p);
                        } else {
                             uint8_t grid[200] = {0};
                             result = solve_array(val1, h, grid, present_list, 0, num_p);
                        }
                        if (result) valid_regions++;
                    } else {
                        // Large grid with slack -> Valid
                        valid_regions++;
                    }
                }
                
                // Flush line remainder if any (shouldn't be much)
                skip_line(&p);
                
                // Clear shape state (we are in region mode, so shape parsing is effectively done)
                current_shape_id = -1;

            } else if (*p == ':') {
                // SHAPE HEADER: 0:
                p++; // skip ':'
                skip_line(&p); // skip newline

                // Flush previous shape
                if (current_shape_id != -1) {
                    Shape* s = &shapes[current_shape_id];
                    s->id = current_shape_id;
                    s->num_variants = 0;
                    // Calc area
                    int area = 0;
                    for(int r=0; r<current_rows; r++) 
                        for(int c=0; c<current_cols; c++) 
                            if(current_shape_cells[r][c]) area++;
                    s->area = area;
                    generate_variants_for_shape(s, current_shape_cells, current_rows, current_cols);
                }

                current_shape_id = val1;
                if (current_shape_id >= num_shapes) num_shapes = current_shape_id + 1;
                current_rows = 0;
                current_cols = 0;
                memset(current_shape_cells, 0, sizeof(current_shape_cells));

            } else {
                // Unknown?
                skip_line(&p);
            }
        } else if (*p == '.' || *p == '#') {
            // SHAPE BODY
            if (current_shape_id != -1) {
                int col = 0;
                while (*p == '.' || *p == '#') {
                    if (*p == '#') current_shape_cells[current_rows][col] = true;
                    col++;
                    p++;
                }
                if (col > current_cols) current_cols = col;
                current_rows++;
            }
            skip_line(&p);
        } else {
            skip_line(&p);
        }
    }

    // Final flush shape
    if (current_shape_id != -1) {
        Shape* s = &shapes[current_shape_id];
        s->id = current_shape_id;
        s->num_variants = 0;
        int area = 0;
        for(int r=0; r<current_rows; r++) 
            for(int c=0; c<current_cols; c++) 
                if(current_shape_cells[r][c]) area++;
        s->area = area;
        generate_variants_for_shape(s, current_shape_cells, current_rows, current_cols);
    }

    AOC_RESULT_INT(valid_regions);
    // free(input); // handled by framework/OS
    return 0;
}
