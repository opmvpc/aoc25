/**
 * 🎄 Advent of Code 2025 - Day 10 Part 2
 * Compile: clang -O2 -o part2 part2.c
 * Run: ./part2 < input.txt
 */

#include "../../tools/runner/c/common.h"

#define MAX_LIGHTS 10
#define MAX_BUTTONS 13

typedef struct {
    int64_t num;
    int64_t den;
} Fraction;

static inline int64_t igcd(int64_t a, int64_t b) {
    if (a < 0) a = -a;
    if (b < 0) b = -b;
    while (b) {
        int64_t t = b;
        b = a % b;
        a = t;
    }
    return a;
}

static inline Fraction make_frac(int64_t n, int64_t d) {
    if (d < 0) {
        n = -n;
        d = -d;
    }
    if (n == 0) return (Fraction){0, 1};
    int64_t g = igcd(n, d);
    return (Fraction){n / g, d / g};
}

static inline Fraction fmul(Fraction a, Fraction b) {
    return make_frac(a.num * b.num, a.den * b.den);
}

static inline Fraction fdiv(Fraction a, Fraction b) {
    return make_frac(a.num * b.den, a.den * b.num);
}

static inline Fraction fsub(Fraction a, Fraction b) {
    return make_frac(a.num * b.den - b.num * a.den, a.den * b.den);
}

static inline int64_t ilcm(int64_t a, int64_t b) {
    return (a / igcd(a, b)) * b;
}

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long result = 0;

    // Buffers reused per line.
    int targets[MAX_LIGHTS];
    uint16_t masks[MAX_BUTTONS];
    int varMax[MAX_BUTTONS];
    Fraction numMat[MAX_LIGHTS][MAX_BUTTONS];
    Fraction rhs[MAX_LIGHTS];
    int pivotCol[MAX_LIGHTS];
    uint8_t isPivot[MAX_BUTTONS];
    int order[MAX_BUTTONS];
    int freeCols[MAX_BUTTONS];

    for (int li = 0; li < line_count; li++) {
        char* line = lines[li];
        if (!line || !line[0]) continue;

        char* braceStart = strchr(line, '{');
        char* braceEnd = strchr(braceStart ? braceStart : line, '}');
        if (!braceStart || !braceEnd) continue;

        // Parse targets.
        int m = 0;
        int val = 0;
        int reading = 0;
        for (char* p = braceStart + 1; p < braceEnd; p++) {
            char c = *p;
            if (c >= '0' && c <= '9') {
                val = val * 10 + (c - '0');
                reading = 1;
            } else if (reading) {
                targets[m++] = val;
                val = 0;
                reading = 0;
            }
        }
        if (reading) targets[m++] = val;

        // Parse buttons between ']' and '{'.
        char* rightBracket = strchr(line, ']');
        int btnCount = 0;
        uint16_t mask = 0;
        val = 0;
        reading = 0;
        for (char* p = rightBracket + 1; p < braceStart; p++) {
            char c = *p;
            if (c >= '0' && c <= '9') {
                val = val * 10 + (c - '0');
                reading = 1;
            } else {
                if (reading) {
                    mask |= (uint16_t)(1u << val);
                    val = 0;
                    reading = 0;
                }
                if (c == ')') {
                    if (btnCount < MAX_BUTTONS) masks[btnCount++] = mask;
                    mask = 0;
                }
            }
        }

        // Deduplicate masks and compute per-button upper bound.
        uint8_t seen[1 << MAX_LIGHTS] = {0};
        int n = 0;
        for (int i = 0; i < btnCount; i++) {
            uint16_t bm = masks[i];
            if (bm == 0) continue;
            if (seen[bm]) continue;
            seen[bm] = 1;
            int bound = 1e9;
            for (int bit = 0; bit < m; bit++) {
                if (bm & (1u << bit)) {
                    if (targets[bit] < bound) bound = targets[bit];
                }
            }
            if (bound == 0) continue;  // would overshoot zero-target counter
            masks[n] = bm;
            varMax[n] = bound;
            n++;
        }
        if (n == 0) continue;

        // Order columns: larger bounds first (free vars get smaller bounds).
        for (int i = 0; i < n; i++) order[i] = i;
        for (int i = 0; i < n; i++) {
            int best = i;
            for (int j = i + 1; j < n; j++) {
                int diff = varMax[order[j]] - varMax[order[best]];
                if (diff > 0) best = j;
                else if (diff == 0) {
                    // tie-breaker by popcount
                    int ca = __builtin_popcount(masks[order[j]]);
                    int cb = __builtin_popcount(masks[order[best]]);
                    if (ca > cb) best = j;
                }
            }
            if (best != i) {
                int tmp = order[i];
                order[i] = order[best];
                order[best] = tmp;
            }
        }

        for (int i = 0; i < m; i++) {
            rhs[i].num = targets[i];
            rhs[i].den = 1;
            pivotCol[i] = -1;
            for (int j = 0; j < n; j++) {
                numMat[i][j].num = ((masks[order[j]] >> i) & 1);
                numMat[i][j].den = 1;
            }
        }

        // RREF
        memset(isPivot, 0, (size_t)n);
        int rank = 0;
        for (int c = 0; c < n && rank < m; c++) {
            int pivotRow = -1;
            for (int i = rank; i < m; i++) {
                if (numMat[i][c].num != 0) {
                    pivotRow = i;
                    break;
                }
            }
            if (pivotRow == -1) continue;
            if (pivotRow != rank) {
                for (int j = 0; j < n; j++) {
                    Fraction tmp = numMat[pivotRow][j];
                    numMat[pivotRow][j] = numMat[rank][j];
                    numMat[rank][j] = tmp;
                }
                Fraction t = rhs[pivotRow];
                rhs[pivotRow] = rhs[rank];
                rhs[rank] = t;
            }

            Fraction inv = make_frac(numMat[rank][c].den, numMat[rank][c].num);
            for (int j = c; j < n; j++) {
                numMat[rank][j] = fmul(numMat[rank][j], inv);
            }
            rhs[rank] = fmul(rhs[rank], inv);

            for (int i = 0; i < m; i++) {
                if (i == rank) continue;
                if (numMat[i][c].num == 0) continue;
                Fraction coeff = numMat[i][c];
                for (int j = c; j < n; j++) {
                    numMat[i][j] = fsub(numMat[i][j], fmul(coeff, numMat[rank][j]));
                }
                rhs[i] = fsub(rhs[i], fmul(coeff, rhs[rank]));
            }

            pivotCol[rank] = c;
            isPivot[c] = 1;
            rank++;
        }

        for (int i = rank; i < m; i++) {
            int allZero = 1;
            for (int j = 0; j < n; j++) {
                if (numMat[i][j].num != 0) {
                    allZero = 0;
                    break;
                }
            }
            if (allZero && rhs[i].num != 0) {
                fprintf(stderr, "No solution on line %d\n", li + 1);
                exit(1);
            }
        }

        int freeLen = 0;
        for (int c = 0; c < n; c++) {
            if (!isPivot[c]) freeCols[freeLen++] = c;
        }

        int varMaxSorted[MAX_BUTTONS];
        for (int i = 0; i < n; i++) varMaxSorted[i] = varMax[order[i]];
        int freeMax[3];
        for (int i = 0; i < freeLen; i++) freeMax[i] = varMaxSorted[freeCols[i]];

        // Precompute pivot expressions.
        int64_t baseArr[MAX_LIGHTS];
        int64_t denArr[MAX_LIGHTS];
        int64_t coeffArr[MAX_LIGHTS][3];
        int pivotMax[MAX_LIGHTS];
        for (int i = 0; i < rank; i++) {
            int pc = pivotCol[i];
            int64_t cd = rhs[i].den;
            for (int k = 0; k < freeLen; k++) {
                int64_t d = numMat[i][freeCols[k]].den;
                cd = ilcm(cd, d);
            }
            denArr[i] = cd;
            baseArr[i] = rhs[i].num * (cd / rhs[i].den);
            for (int k = 0; k < freeLen; k++) {
                coeffArr[i][k] = numMat[i][freeCols[k]].num * (cd / numMat[i][freeCols[k]].den);
            }
            pivotMax[i] = varMaxSorted[pc];
        }

        int sumTargets = 0;
        for (int i = 0; i < m; i++) sumTargets += targets[i];
        int best = sumTargets;

        if (freeLen == 0) {
            int cost = 0;
            for (int i = 0; i < rank; i++) {
                if (baseArr[i] % denArr[i] != 0) {
                    fprintf(stderr, "Non-integer solution line %d\n", li + 1);
                    exit(1);
                }
                int val = (int)(baseArr[i] / denArr[i]);
                if (val < 0 || val > pivotMax[i]) {
                    fprintf(stderr, "Out of bounds line %d\n", li + 1);
                    exit(1);
                }
                cost += val;
            }
            result += cost;
            continue;
        }

        // Enumerate free variables (freeLen <= 3).
        if (freeLen == 1) {
            for (int f0 = 0; f0 <= freeMax[0]; f0++) {
                int cost = f0;
                if (cost >= best) continue;
                int ok = 1;
                for (int i = 0; i < rank; i++) {
                    int64_t numVal = baseArr[i] - coeffArr[i][0] * f0;
                    if (numVal < 0 || numVal % denArr[i] != 0) {
                        ok = 0;
                        break;
                    }
                    int val = (int)(numVal / denArr[i]);
                    if (val > pivotMax[i]) {
                        ok = 0;
                        break;
                    }
                    cost += val;
                    if (cost >= best) {
                        ok = 0;
                        break;
                    }
                }
                if (ok && cost < best) best = cost;
            }
        } else if (freeLen == 2) {
            for (int f0 = 0; f0 <= freeMax[0]; f0++) {
                for (int f1 = 0; f1 <= freeMax[1]; f1++) {
                    int cost = f0 + f1;
                    if (cost >= best) continue;
                    int ok = 1;
                    for (int i = 0; i < rank; i++) {
                        int64_t numVal = baseArr[i] - coeffArr[i][0] * f0 - coeffArr[i][1] * f1;
                        if (numVal < 0 || numVal % denArr[i] != 0) {
                            ok = 0;
                            break;
                        }
                        int val = (int)(numVal / denArr[i]);
                        if (val > pivotMax[i]) {
                            ok = 0;
                            break;
                        }
                        cost += val;
                        if (cost >= best) {
                            ok = 0;
                            break;
                        }
                    }
                    if (ok && cost < best) best = cost;
                }
            }
        } else {
            for (int f0 = 0; f0 <= freeMax[0]; f0++) {
                for (int f1 = 0; f1 <= freeMax[1]; f1++) {
                    for (int f2 = 0; f2 <= freeMax[2]; f2++) {
                        int cost = f0 + f1 + f2;
                        if (cost >= best) continue;
                        int ok = 1;
                        for (int i = 0; i < rank; i++) {
                            int64_t numVal =
                                baseArr[i] - coeffArr[i][0] * f0 - coeffArr[i][1] * f1 -
                                coeffArr[i][2] * f2;
                            if (numVal < 0 || numVal % denArr[i] != 0) {
                                ok = 0;
                                break;
                            }
                            int val = (int)(numVal / denArr[i]);
                            if (val > pivotMax[i]) {
                                ok = 0;
                                break;
                            }
                            cost += val;
                            if (cost >= best) {
                                ok = 0;
                                break;
                            }
                        }
                        if (ok && cost < best) best = cost;
                    }
                }
            }
        }

        result += best;
    }
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
