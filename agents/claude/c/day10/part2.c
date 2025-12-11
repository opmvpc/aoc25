/**
 * Advent of Code 2025 - Day 10 Part 2
 * Factory - Minimum button presses via ILP (Gaussian elimination + search)
 *
 * Compile: clang -O3 -march=native -o part2 part2.c
 */

#include "../../tools/runner/c/common.h"
#include <limits.h>

#define MAX_BUTTONS 16
#define MAX_COUNTERS 16

static double my_fabs(double x) { return x < 0 ? -x : x; }
static int my_round(double x) { return (int)(x + (x >= 0 ? 0.5 : -0.5)); }
static int my_floor(double x) { int i = (int)x; return x < 0 && x != i ? i - 1 : i; }
static int my_ceil(double x) { int i = (int)x; return x > 0 && x != i ? i + 1 : i; }

// Global state for current machine
static double matrix[MAX_COUNTERS][MAX_BUTTONS + 1];
static double coefs[MAX_COUNTERS][MAX_BUTTONS];
static double rhsVals[MAX_COUNTERS];
static int pivotCols[MAX_COUNTERS];
static int freeVars[MAX_BUTTONS];
static int numPivots, numFree, upperBound;
static long long minSum;

static void search(int idx, int freeVals[], int freeSum) {
    if (freeSum >= minSum) return;

    if (idx == numFree) {
        long long sum = freeSum;
        int valid = 1;

        for (int i = 0; i < numPivots && valid; i++) {
            double val = rhsVals[i];
            for (int f = 0; f < numFree; f++) {
                val -= coefs[i][f] * freeVals[f];
            }
            int rounded = (int)my_round(val);
            if (rounded < 0 || my_fabs(val - rounded) > 1e-9) {
                valid = 0;
            } else {
                sum += rounded;
            }
        }

        if (valid && sum < minSum) {
            minSum = sum;
        }
        return;
    }

    // Compute bounds
    int lb = 0;
    int ub = upperBound;

    for (int i = 0; i < numPivots; i++) {
        double remaining = rhsVals[i];
        for (int f = 0; f < idx; f++) {
            remaining -= coefs[i][f] * freeVals[f];
        }

        double c = coefs[i][idx];
        if (my_fabs(c) < 1e-9) continue;

        double futureContrib = 0;
        for (int f = idx + 1; f < numFree; f++) {
            double fc = coefs[i][f];
            if (fc < 0) {
                futureContrib -= fc * upperBound;
            }
        }

        double adjusted = remaining + futureContrib;

        if (c > 0) {
            int bound = (int)my_floor(adjusted / c + 1e-9);
            if (bound < ub) ub = bound;
        } else {
            if (adjusted < -1e-9) {
                int bound = (int)my_ceil(-adjusted / (-c) - 1e-9);
                if (bound > lb) lb = bound;
            }
        }
    }

    if (lb > ub || lb > upperBound) return;
    if (ub > upperBound) ub = upperBound;

    for (int v = lb; v <= ub; v++) {
        freeVals[idx] = v;
        search(idx + 1, freeVals, freeSum + v);
    }
}

static long long solve_machine(int buttons[][MAX_COUNTERS], int btnSizes[], int numButtons,
                                int targets[], int numCounters) {
    // Build augmented matrix
    for (int i = 0; i < numCounters; i++) {
        for (int j = 0; j < numButtons; j++) {
            matrix[i][j] = 0;
            for (int k = 0; k < btnSizes[j]; k++) {
                if (buttons[j][k] == i) {
                    matrix[i][j] = 1;
                    break;
                }
            }
        }
        matrix[i][numButtons] = targets[i];
    }

    // Gaussian elimination to RREF
    int pivotRow = 0;
    numPivots = 0;

    for (int col = 0; col < numButtons && pivotRow < numCounters; col++) {
        int found = -1;
        for (int r = pivotRow; r < numCounters; r++) {
            if (my_fabs(matrix[r][col]) > 1e-9) {
                found = r;
                break;
            }
        }
        if (found == -1) continue;

        // Swap rows
        for (int c = 0; c <= numButtons; c++) {
            double tmp = matrix[pivotRow][c];
            matrix[pivotRow][c] = matrix[found][c];
            matrix[found][c] = tmp;
        }

        pivotCols[numPivots++] = col;
        double pivotVal = matrix[pivotRow][col];

        // Normalize
        for (int c = 0; c <= numButtons; c++) {
            matrix[pivotRow][c] /= pivotVal;
        }

        // Eliminate
        for (int r = 0; r < numCounters; r++) {
            if (r != pivotRow && my_fabs(matrix[r][col]) > 1e-9) {
                double factor = matrix[r][col];
                for (int c = 0; c <= numButtons; c++) {
                    matrix[r][c] -= factor * matrix[pivotRow][c];
                }
            }
        }
        pivotRow++;
    }

    // Check consistency
    for (int r = pivotRow; r < numCounters; r++) {
        if (my_fabs(matrix[r][numButtons]) > 1e-9) {
            return -1;
        }
    }

    // Identify free variables
    numFree = 0;
    int pivotSet[MAX_BUTTONS] = {0};
    for (int i = 0; i < numPivots; i++) {
        pivotSet[pivotCols[i]] = 1;
    }
    for (int j = 0; j < numButtons; j++) {
        if (!pivotSet[j]) {
            freeVars[numFree++] = j;
        }
    }

    // No free variables - unique solution
    if (numFree == 0) {
        long long sum = 0;
        for (int i = 0; i < numPivots; i++) {
            double val = matrix[i][numButtons];
            int rounded = (int)my_round(val);
            if (rounded < 0 || my_fabs(val - rounded) > 1e-9) return -1;
            sum += rounded;
        }
        return sum;
    }

    // Setup coefficients for search
    for (int i = 0; i < numPivots; i++) {
        for (int f = 0; f < numFree; f++) {
            coefs[i][f] = matrix[i][freeVars[f]];
        }
        rhsVals[i] = matrix[i][numButtons];
    }

    // Compute upper bound
    upperBound = 0;
    for (int i = 0; i < numCounters; i++) {
        upperBound += targets[i];
    }

    minSum = LLONG_MAX;
    int freeVals[MAX_BUTTONS] = {0};
    search(0, freeVals, 0);

    return minSum == LLONG_MAX ? -1 : minSum;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    long long total = 0;
    char* p = input;

    while (*p) {
        // Skip to first (
        while (*p && *p != '(') p++;
        if (!*p) break;

        // Parse buttons
        int buttons[MAX_BUTTONS][MAX_COUNTERS];
        int btnSizes[MAX_BUTTONS];
        int numButtons = 0;

        while (*p == '(' || *p == ' ') {
            if (*p == '(') {
                p++;
                int size = 0;
                while (*p != ')') {
                    if (*p >= '0' && *p <= '9') {
                        int idx = 0;
                        while (*p >= '0' && *p <= '9') {
                            idx = idx * 10 + (*p++ - '0');
                        }
                        buttons[numButtons][size++] = idx;
                    } else {
                        p++;
                    }
                }
                btnSizes[numButtons] = size;
                numButtons++;
                p++; // skip ')'
            } else {
                p++;
            }
        }

        // Skip to {
        while (*p && *p != '{') p++;
        if (!*p) break;
        p++; // skip '{'

        // Parse targets
        int targets[MAX_COUNTERS];
        int numCounters = 0;
        while (*p != '}') {
            if (*p >= '0' && *p <= '9') {
                int val = 0;
                while (*p >= '0' && *p <= '9') {
                    val = val * 10 + (*p++ - '0');
                }
                targets[numCounters++] = val;
            } else {
                p++;
            }
        }
        p++; // skip '}'

        long long result = solve_machine(buttons, btnSizes, numButtons, targets, numCounters);
        if (result < 0) {
            AOC_ERROR("No solution found");
            return 1;
        }
        total += result;

        // Skip to next line
        while (*p && *p != '\n') p++;
        if (*p) p++;
    }

    AOC_TIMER_END(parse);

    AOC_RESULT_INT(total);

    aoc_cleanup(input);
    return 0;
}
