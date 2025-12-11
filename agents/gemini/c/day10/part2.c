#include "../../tools/runner/c/common.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define MAX_LIGHTS 20
#define MAX_BUTTONS 20
#define INF_PRESSES 9223372036854775807LL

typedef struct {
    long long n, d;
} Rational;

long long gcd(long long a, long long b) {
    return b == 0 ? (a < 0 ? -a : a) : gcd(b, a % b);
}

Rational rat_init(long long n) {
    return (Rational){n, 1};
}

void rat_reduce(Rational* r) {
    if (r->d < 0) {
        r->n = -r->n;
        r->d = -r->d;
    }
    long long common = gcd(r->n, r->d);
    r->n /= common;
    r->d /= common;
}

Rational rat_add(Rational a, Rational b) {
    Rational r = {a.n * b.d + b.n * a.d, a.d * b.d};
    rat_reduce(&r);
    return r;
}

Rational rat_sub(Rational a, Rational b) {
    Rational r = {a.n * b.d - b.n * a.d, a.d * b.d};
    rat_reduce(&r);
    return r;
}

Rational rat_mul(Rational a, Rational b) {
    Rational r = {a.n * b.n, a.d * b.d};
    rat_reduce(&r);
    return r;
}

Rational rat_div(Rational a, Rational b) {
    Rational r = {a.n * b.d, a.d * b.n};
    rat_reduce(&r);
    return r;
}

typedef struct {
    int targets[MAX_LIGHTS];
    int num_lights;
    int buttons[MAX_BUTTONS][MAX_LIGHTS]; // buttons[col][row]
    int num_buttons;
} Machine;

void parse_machine(char* line, Machine* m) {
    m->num_buttons = 0;
    m->num_lights = 0;

    char* brace = strchr(line, '{');
    if (!brace) return;
    brace++;
    
    while (*brace && *brace != '}') {
        int val = 0;
        while (*brace >= '0' && *brace <= '9') {
            val = val * 10 + (*brace - '0');
            brace++;
        }
        m->targets[m->num_lights++] = val;
        if (*brace == ',') brace++;
    }

    char* p = line;
    while (p < brace) {
        while (*p && *p != '(' && p < brace) p++;
        if (p >= brace || !*p) break;
        p++;
        
        for (int i = 0; i < MAX_LIGHTS; i++) m->buttons[m->num_buttons][i] = 0;
        
        while (*p && *p != ')') {
            int idx = 0;
            while (*p >= '0' && *p <= '9') {
                idx = idx * 10 + (*p - '0');
                p++;
            }
            if (idx < m->num_lights) {
                m->buttons[m->num_buttons][idx] = 1;
            }
            if (*p == ',') p++;
        }
        m->num_buttons++;
    }
}

// Global variables to avoid passing too many args
Rational matrix[MAX_LIGHTS][MAX_BUTTONS + 1];
int pivot_cols[MAX_LIGHTS];
int col_to_pivot[MAX_BUTTONS];
int free_cols[MAX_BUTTONS];
int num_free;
long long free_vals[MAX_BUTTONS];
long long min_presses;
int col_upper_bounds[MAX_BUTTONS];
int pivot_row_count;
int num_rows_g, num_cols_g;

// Integer equation structures
typedef struct {
    long long lcm_target; // target * LCM
    long long free_coeffs[MAX_BUTTONS]; // coeff * LCM for each free var (indexed 0..num_free-1)
    long long lcm; // The LCM multiplier used
} IntEq;

IntEq int_eqs[MAX_LIGHTS];

long long fast_lcm(long long a, long long b) {
    if (a == 0 || b == 0) return 0;
    return (a / gcd(a, b)) * b;
}

void solve_rec_fast(int idx, long long partial_sum) {
    if (partial_sum >= min_presses) return;

    if (idx == num_free) {
        long long current_presses = partial_sum;
        
        // Calculate pivots using pre-computed integer equations
        for (int r = 0; r < pivot_row_count; r++) {
            long long val = int_eqs[r].lcm_target;
            
            for (int i = 0; i < num_free; i++) {
                 if (free_vals[i]) {
                     val -= int_eqs[r].free_coeffs[i] * free_vals[i];
                 }
            }
            
            if (val < 0) return;
            if (val % int_eqs[r].lcm != 0) return;
            
            current_presses += val / int_eqs[r].lcm;
            if (current_presses >= min_presses) return;
        }
        
        min_presses = current_presses;
        return;
    }
    
    int fCol = free_cols[idx];
    int limit = col_upper_bounds[fCol];
    
    for (int v = 0; v <= limit; v++) {
        free_vals[idx] = v;
        solve_rec_fast(idx + 1, partial_sum + v);
    }
}

long long solve_machine(Machine* m) {
    int rows = m->num_lights;
    int cols = m->num_buttons;
    num_rows_g = rows;
    num_cols_g = cols;
    
    // Init matrix
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            matrix[r][c] = rat_init(m->buttons[c][r]); 
        }
        matrix[r][cols] = rat_init(m->targets[r]);
    }
    
    // Gaussian Elim
    int pivot_row = 0;
    for (int i = 0; i < rows; i++) pivot_cols[i] = -1;
    for (int i = 0; i < cols; i++) col_to_pivot[i] = -1;
    
    for (int c = 0; c < cols && pivot_row < rows; c++) {
        int sel = -1;
        for (int r = pivot_row; r < rows; r++) {
            if (matrix[r][c].n != 0) {
                sel = r;
                break;
            }
        }
        
        if (sel == -1) continue;
        
        for (int k = 0; k <= cols; k++) {
            Rational temp = matrix[pivot_row][k];
            matrix[pivot_row][k] = matrix[sel][k];
            matrix[sel][k] = temp;
        }
        
        Rational p_val = matrix[pivot_row][c];
        for (int k = c; k <= cols; k++) {
            matrix[pivot_row][k] = rat_div(matrix[pivot_row][k], p_val);
        }
        
        for (int r = 0; r < rows; r++) {
            if (r != pivot_row && matrix[r][c].n != 0) {
                Rational factor = matrix[r][c];
                for (int k = c; k <= cols; k++) {
                    Rational term = rat_mul(factor, matrix[pivot_row][k]);
                    matrix[r][k] = rat_sub(matrix[r][k], term);
                }
            }
        }
        
        pivot_cols[pivot_row] = c;
        col_to_pivot[c] = pivot_row;
        pivot_row++;
    }
    
    pivot_row_count = pivot_row;
    
    for (int r = pivot_row; r < rows; r++) {
        if (matrix[r][cols].n != 0) return 0;
    }
    
    num_free = 0;
    for (int c = 0; c < cols; c++) {
        if (col_to_pivot[c] == -1) {
            free_cols[num_free++] = c;
        }
    }
    
    // Precompute Integer Equations
    for (int r = 0; r < pivot_row_count; r++) {
        long long lcm = 1;
        // Target denominator
        if (matrix[r][cols].d > 1) lcm = fast_lcm(lcm, matrix[r][cols].d);
        // Free var coefficients denominators
        for (int i = 0; i < num_free; i++) {
            int fCol = free_cols[i];
            if (matrix[r][fCol].d > 1) lcm = fast_lcm(lcm, matrix[r][fCol].d);
        }
        
        int_eqs[r].lcm = lcm;
        int_eqs[r].lcm_target = matrix[r][cols].n * (lcm / matrix[r][cols].d);
        
        for (int i = 0; i < num_free; i++) {
            int fCol = free_cols[i];
            int_eqs[r].free_coeffs[i] = matrix[r][fCol].n * (lcm / matrix[r][fCol].d);
        }
    }
    
    // Bounds
    for (int c = 0; c < cols; c++) {
        long long min_u = 2000000000;
        int active = 0;
        for (int r = 0; r < rows; r++) {
            if (m->buttons[c][r]) {
                active = 1;
                long long b = m->targets[r];
                if (b < min_u) min_u = b;
            }
        }
        col_upper_bounds[c] = active ? (int)min_u : 0;
    }
    
    min_presses = INF_PRESSES;
    solve_rec_fast(0, 0);
    
    return min_presses == INF_PRESSES ? 0 : min_presses;
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
        
        parse_machine(line_start, &m);
        total_presses += solve_machine(&m);
        
        *p = backup;
        if (*p) p++;
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(total_presses);
    
    aoc_cleanup(input);
    return 0;
}
