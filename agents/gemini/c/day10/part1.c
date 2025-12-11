#include "../../tools/runner/c/common.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>

#define MAX_LIGHTS 32
#define MAX_BUTTONS 32

typedef struct {
    uint32_t target;
    int num_lights;
    uint32_t buttons[MAX_BUTTONS];
    int num_buttons;
} Machine;

void parse_machine_fast(char* line, Machine* m) {
    // Find '['
    char* p = line;
    while (*p && *p != '[') p++;
    if (!*p) return;
    p++;

    m->target = 0;
    m->num_lights = 0;
    while (*p && *p != ']') {
        if (*p == '#') {
            m->target |= (1U << m->num_lights);
        }
        m->num_lights++;
        p++;
    }
    
    m->num_buttons = 0;
    
    // Find '{' to know where to stop
    char* brace = strchr(p, '{');
    
    while (*p) {
        // Find next '('
        while (*p && *p != '(' && (!brace || p < brace)) p++;
        if (!*p || (brace && p >= brace)) break;
        
        p++; // skip '('
        
        uint32_t btn = 0;
        while (*p && *p != ')') {
            int val = 0;
            while (*p >= '0' && *p <= '9') {
                val = val * 10 + (*p - '0');
                p++;
            }
            btn |= (1U << val);
            if (*p == ',') p++;
        }
        m->buttons[m->num_buttons++] = btn;
    }
}

int solve_machine(Machine* m) {
    int rows = m->num_lights;
    int cols = m->num_buttons;
    
    // matrix[r] stores bits for buttons 0..cols-1. Bit 'cols' is target.
    uint32_t matrix[MAX_LIGHTS];
    
    for (int r = 0; r < rows; r++) {
        matrix[r] = 0;
        // Check target bit
        if ((m->target >> r) & 1) {
            matrix[r] |= (1U << cols);
        }
    }
    
    // Fill button bits (column-major in input, row-major in matrix)
    for (int c = 0; c < cols; c++) {
        uint32_t b = m->buttons[c];
        for (int r = 0; r < rows; r++) {
            if ((b >> r) & 1) {
                matrix[r] |= (1U << c);
            }
        }
    }
    
    int pivot_row = 0;
    int pivot_cols[MAX_LIGHTS]; // Maps row -> pivot col
    int col_to_pivot[MAX_BUTTONS]; // Maps col -> pivot row
    
    // Init array - simpler than memset for small sizes usually, or loop
    for(int i=0; i<rows; ++i) pivot_cols[i] = -1;
    for(int i=0; i<cols; ++i) col_to_pivot[i] = -1;
    
    for (int c = 0; c < cols && pivot_row < rows; c++) {
        int sel = -1;
        for (int r = pivot_row; r < rows; r++) {
            if ((matrix[r] >> c) & 1) {
                sel = r;
                break;
            }
        }
        
        if (sel == -1) continue;
        
        // Swap
        uint32_t temp = matrix[pivot_row];
        matrix[pivot_row] = matrix[sel];
        matrix[sel] = temp;
        
        // Eliminate
        // XOR pivot row from all other rows that have 1 in this column
        uint32_t p_val = matrix[pivot_row];
        for (int r = 0; r < rows; r++) {
            if (r != pivot_row && ((matrix[r] >> c) & 1)) {
                matrix[r] ^= p_val;
            }
        }
        
        pivot_cols[pivot_row] = c;
        col_to_pivot[c] = pivot_row;
        pivot_row++;
    }
    
    // Check consistency
    // Rows from pivot_row to rows-1 must be all 0 except potentially target bit?
    // If target bit is 1, inconsistent.
    for (int r = pivot_row; r < rows; r++) {
        if ((matrix[r] >> cols) & 1) return 999999;
    }
    
    // Free variables
    int free_cols[MAX_BUTTONS];
    int num_free = 0;
    for (int c = 0; c < cols; c++) {
        if (col_to_pivot[c] == -1) {
            free_cols[num_free++] = c;
        }
    }
    
    int min_presses = 999999;
    int num_comb = 1 << num_free;
    
    for (int i = 0; i < num_comb; i++) {
        uint32_t x = 0;
        int presses = 0;
        
        // Set free vars
        for (int j = 0; j < num_free; j++) {
            if ((i >> j) & 1) {
                x |= (1U << free_cols[j]);
                presses++;
            }
        }
        
        // Solve pivots
        // We need to iterate pivot rows
        for (int r = 0; r < pivot_row; r++) {
            int p = pivot_cols[r];
            // Target bit
            int val = (matrix[r] >> cols) & 1;
            
            // Contribution from free vars
            // matrix[r] contains coefficients.
            // (matrix[r] & x) selects coefficients where x is 1.
            // Popcount gives sum.
            if (__builtin_popcount(matrix[r] & x) & 1) {
                val ^= 1;
            }
            
            if (val) {
                x |= (1U << p);
                presses++;
            }
        }
        
        if (presses < min_presses) min_presses = presses;
    }
    
    return min_presses == 999999 ? 0 : min_presses;
}

int main(void) {
    char* input = aoc_read_input();
    
    AOC_TIMER_START(solve);
    
    char* p = input;
    long long total_presses = 0;
    Machine m;
    
    while (*p) {
        while (*p && (*p == ' ' || *p == '\n')) p++;
        if (!*p) break;
        
        char* line_start = p;
        while (*p && *p != '\n') p++;
        char backup = *p;
        *p = 0;
        
        parse_machine_fast(line_start, &m);
        total_presses += solve_machine(&m);
        
        *p = backup;
        if (*p) p++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total_presses);
    
    aoc_cleanup(input);
    return 0;
}