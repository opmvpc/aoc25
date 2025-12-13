/**
 * 🎄 Advent of Code 2025 - Day 12 Part 1
 * Compile: clang -O2 -o part1 part1.c
 * Run: ./part1 < input.txt
 */

#include "../../tools/runner/c/common.h"

#define MAX_SHAPES 64
#define MAX_SIDE 64

static uint8_t transform_map_3x3[8][9];
static uint8_t div3_u8[256];

static uint16_t shape_orients_g[MAX_SHAPES][8];
static uint8_t orient_count_g[MAX_SHAPES];
static int orients_ready = 0;
static int orients_shape_count = 0;

static inline int is_digit(char c) {
    return (unsigned)(c - '0') < 10u;
}

static inline uint16_t transform_mask_3x3(uint16_t mask, int t) {
    uint16_t out = 0;
    const uint8_t* m = transform_map_3x3[t];
    for (int p = 0; p < 9; p++) {
        if (mask & (1u << p)) out |= (uint16_t)(1u << m[p]);
    }
    return out;
}

static inline void ensure_orients(int shape_count, const uint16_t* shape_masks) {
    if (orients_ready && orients_shape_count == shape_count) return;
    for (int s = 0; s < shape_count; s++) {
        const uint16_t base = shape_masks[s];
        uint8_t oc = 0;
        for (int t = 0; t < 8; t++) {
            const uint16_t m = transform_mask_3x3(base, t);
            int seen = 0;
            for (uint8_t j = 0; j < oc; j++) {
                if (shape_orients_g[s][j] == m) {
                    seen = 1;
                    break;
                }
            }
            if (!seen) shape_orients_g[s][oc++] = m;
        }
        orient_count_g[s] = oc;
    }
    orients_ready = 1;
    orients_shape_count = shape_count;
}

typedef struct {
    uint8_t y;
    uint32_t lo0, hi0;
    uint32_t lo1, hi1;
    uint32_t lo2, hi2;
} Placement;

typedef struct {
    int W, H;
    int shape_count;
    const uint8_t* areas;
    int counts[MAX_SHAPES];
    int total_pieces;
    int remaining_area;
    int used_area;
    int cap;

    Placement* placements[MAX_SHAPES];
    int placement_count[MAX_SHAPES];

    uint32_t occ_lo[MAX_SIDE];
    uint32_t occ_hi[MAX_SIDE];
} Ctx;

static inline int placement_fits(const Ctx* ctx, const Placement* pl) {
    const int y = (int)pl->y;
    const int y1 = y + 1;
    const int y2 = y + 2;
    return ((ctx->occ_lo[y] & pl->lo0) | (ctx->occ_hi[y] & pl->hi0) |
            (ctx->occ_lo[y1] & pl->lo1) | (ctx->occ_hi[y1] & pl->hi1) |
            (ctx->occ_lo[y2] & pl->lo2) | (ctx->occ_hi[y2] & pl->hi2)) == 0;
}

static inline void placement_apply(Ctx* ctx, const Placement* pl) {
    const int y = (int)pl->y;
    const int y1 = y + 1;
    const int y2 = y + 2;
    ctx->occ_lo[y] |= pl->lo0; ctx->occ_hi[y] |= pl->hi0;
    ctx->occ_lo[y1] |= pl->lo1; ctx->occ_hi[y1] |= pl->hi1;
    ctx->occ_lo[y2] |= pl->lo2; ctx->occ_hi[y2] |= pl->hi2;
}

static inline void placement_undo(Ctx* ctx, const Placement* pl) {
    const int y = (int)pl->y;
    const int y1 = y + 1;
    const int y2 = y + 2;
    ctx->occ_lo[y] ^= pl->lo0; ctx->occ_hi[y] ^= pl->hi0;
    ctx->occ_lo[y1] ^= pl->lo1; ctx->occ_hi[y1] ^= pl->hi1;
    ctx->occ_lo[y2] ^= pl->lo2; ctx->occ_hi[y2] ^= pl->hi2;
}

static int dfs(Ctx* ctx) {
    if (ctx->total_pieces == 0) return 1;
    if (ctx->remaining_area > ctx->cap - ctx->used_area) return 0;

    int best_t = -1;
    int best_fit = 0x7fffffff;

    for (int t = 0; t < ctx->shape_count; t++) {
        if (ctx->counts[t] == 0) continue;
        const int pc = ctx->placement_count[t];
        const Placement* pls = ctx->placements[t];
        int fit = 0;
        for (int i = 0; i < pc; i++) {
            if (placement_fits(ctx, &pls[i])) {
                fit++;
                if (fit >= best_fit) break;
            }
        }
        if (fit == 0) return 0;
        if (fit < best_fit) {
            best_fit = fit;
            best_t = t;
            if (fit == 1) break;
        }
    }

    const int a = ctx->areas[best_t];
    const int pc = ctx->placement_count[best_t];
    const Placement* pls = ctx->placements[best_t];

    for (int i = 0; i < pc; i++) {
        const Placement* pl = &pls[i];
        if (!placement_fits(ctx, pl)) continue;

        placement_apply(ctx, pl);
        ctx->counts[best_t]--;
        ctx->total_pieces--;
        ctx->remaining_area -= a;
        ctx->used_area += a;

        if (dfs(ctx)) return 1;

        ctx->used_area -= a;
        ctx->remaining_area += a;
        ctx->total_pieces++;
        ctx->counts[best_t]++;
        placement_undo(ctx, pl);
    }

    return 0;
}

static int can_pack_tight(
    int W, int H,
    int shape_count,
    const uint8_t* areas,
    const uint16_t shape_orients[MAX_SHAPES][8],
    const uint8_t* orient_count,
    const int* counts_in
) {
    if (W < 3 || H < 3) {
        for (int t = 0; t < shape_count; t++) if (counts_in[t] != 0) return 0;
        return 1;
    }

    Ctx ctx;
    ctx.W = W;
    ctx.H = H;
    ctx.shape_count = shape_count;
    ctx.areas = areas;
    ctx.cap = W * H;
    ctx.total_pieces = 0;
    ctx.remaining_area = 0;
    ctx.used_area = 0;
    for (int y = 0; y < H; y++) {
        ctx.occ_lo[y] = 0;
        ctx.occ_hi[y] = 0;
    }
    for (int t = 0; t < shape_count; t++) {
        const int c = counts_in[t];
        ctx.counts[t] = c;
        ctx.total_pieces += c;
        ctx.remaining_area += c * (int)areas[t];
        ctx.placements[t] = NULL;
        ctx.placement_count[t] = 0;
    }

    if (ctx.total_pieces == 0) return 1;
    if (ctx.remaining_area > ctx.cap) return 0;

    const int max_x = W - 3;
    uint32_t shift_lo[8][MAX_SIDE];
    uint32_t shift_hi[8][MAX_SIDE];
    for (int bits = 0; bits < 8; bits++) {
        for (int x = 0; x <= max_x; x++) {
            uint32_t lo = 0, hi = 0;
            if (x < 32) {
                lo = (uint32_t)bits << x;
                hi = x ? (uint32_t)bits >> (32 - x) : 0;
            } else {
                lo = 0;
                hi = (uint32_t)bits << (x - 32);
            }
            shift_lo[bits][x] = lo;
            shift_hi[bits][x] = hi;
        }
    }

    // Build placements for each shape (only if needed).
    for (int t = 0; t < shape_count; t++) {
        if (ctx.counts[t] == 0) continue;
        const int oc = (int)orient_count[t];
        const int per_orient = (W - 2) * (H - 2);
        const int pc = oc * per_orient;
        ctx.placement_count[t] = pc;
        Placement* pls = (Placement*)malloc((size_t)pc * sizeof(Placement));
        ctx.placements[t] = pls;
        int idx = 0;

        for (int oi = 0; oi < oc; oi++) {
            const uint16_t m = shape_orients[t][oi];
            const int r0 = (int)(m & 7u);
            const int r1 = (int)((m >> 3) & 7u);
            const int r2 = (int)((m >> 6) & 7u);
            for (int y = 0; y <= H - 3; y++) {
                for (int x = 0; x <= max_x; x++) {
                    Placement* pl = &pls[idx++];
                    pl->y = (uint8_t)y;
                    pl->lo0 = shift_lo[r0][x];
                    pl->hi0 = shift_hi[r0][x];
                    pl->lo1 = shift_lo[r1][x];
                    pl->hi1 = shift_hi[r1][x];
                    pl->lo2 = shift_lo[r2][x];
                    pl->hi2 = shift_hi[r2][x];
                }
            }
        }
    }

    const int ok = dfs(&ctx);

    for (int t = 0; t < shape_count; t++) {
        free(ctx.placements[t]);
    }
    return ok;
}

int main(void) {
    // Precompute 3x3 transform maps (8 isometries).
    for (int t = 0; t < 8; t++) {
        const int mirror = t >> 2;
        const int rot = t & 3;
        for (int p = 0; p < 9; p++) {
            int x = p % 3;
            int y = p / 3;
            if (mirror) x = 2 - x;
            int nx = x, ny = y;
            if (rot == 1) {
                nx = 2 - y;
                ny = x;
            } else if (rot == 2) {
                nx = 2 - x;
                ny = 2 - y;
            } else if (rot == 3) {
                nx = y;
                ny = 2 - x;
            }
            transform_map_3x3[t][p] = (uint8_t)(ny * 3 + nx);
        }
    }

    for (int i = 0; i < 256; i++) div3_u8[i] = (uint8_t)(i / 3);

    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    uint16_t shape_masks[MAX_SHAPES] = {0};
    uint8_t shape_areas[MAX_SHAPES] = {0};
    int shape_count = 0;

    const char* p = input;
    // Parse shapes section.
    while (*p) {
        while (*p == '\n' || *p == '\r') p++;
        if (!*p) break;
        if (!is_digit(*p)) break;

        const char* start = p;
        int idx = 0;
        while (is_digit(*p)) {
            idx = idx * 10 + (*p - '0');
            p++;
        }
        if (*p != ':') {
            p = start;
            break;
        }
        p++;  // ':'
        while (*p == '\n' || *p == '\r') p++;

        uint16_t mask = 0;
        for (int y = 0; y < 3; y++) {
            for (int x = 0; x < 3; x++) {
                const char ch = *p++;
                if (ch == '#') mask |= (uint16_t)(1u << (y * 3 + x));
            }
            while (*p && *p != '\n' && *p != '\r') p++;
            while (*p == '\n' || *p == '\r') p++;
        }

        shape_masks[idx] = mask;
        shape_areas[idx] = (uint8_t)__builtin_popcount((unsigned)mask);
        if (idx + 1 > shape_count) shape_count = idx + 1;
    }
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    long long answer = 0;
    int counts[MAX_SHAPES];

    while (*p == '\n' || *p == '\r') p++;
    if (shape_count == 6 && is_digit(p[0]) && is_digit(p[1]) && p[2] == 'x' && is_digit(p[3]) &&
        is_digit(p[4]) && p[5] == ':' && p[6] == ' ' && is_digit(p[7]) && is_digit(p[8]) &&
        p[9] == ' ' && is_digit(p[10]) && is_digit(p[11]) && p[12] == ' ' && is_digit(p[13]) &&
        is_digit(p[14]) && p[15] == ' ' && is_digit(p[16]) && is_digit(p[17]) && p[18] == ' ' &&
        is_digit(p[19]) && is_digit(p[20]) && p[21] == ' ' && is_digit(p[22]) && is_digit(p[23])) {
        const int step = (p[24] == '\r' && p[25] == '\n') ? 26 : 25;
        while (*p) {
            const char* line = p;
            const int W = (line[0] - '0') * 10 + (line[1] - '0');
            const int H = (line[3] - '0') * 10 + (line[4] - '0');
            const int c0 = (line[7] - '0') * 10 + (line[8] - '0');
            const int c1 = (line[10] - '0') * 10 + (line[11] - '0');
            const int c2 = (line[13] - '0') * 10 + (line[14] - '0');
            const int c3 = (line[16] - '0') * 10 + (line[17] - '0');
            const int c4 = (line[19] - '0') * 10 + (line[20] - '0');
            const int c5 = (line[22] - '0') * 10 + (line[23] - '0');

            const int total_pieces = c0 + c1 + c2 + c3 + c4 + c5;
            const int blocks = (int)div3_u8[W] * (int)div3_u8[H];
            if (total_pieces <= blocks) {
                answer++;
            } else {
                counts[0] = c0;
                counts[1] = c1;
                counts[2] = c2;
                counts[3] = c3;
                counts[4] = c4;
                counts[5] = c5;

                const int total_area =
                    c0 * (int)shape_areas[0] + c1 * (int)shape_areas[1] + c2 * (int)shape_areas[2] +
                    c3 * (int)shape_areas[3] + c4 * (int)shape_areas[4] + c5 * (int)shape_areas[5];
                if (total_area <= W * H) {
                    ensure_orients(shape_count, shape_masks);
                    if (can_pack_tight(W, H, shape_count, shape_areas, shape_orients_g, orient_count_g, counts)) {
                        answer++;
                    }
                }
            }

            if (line[24] == '\0') break;
            if (step == 26 && line[25] == '\0') break;
            p = line + step;
        }
    } else {
        while (*p) {
            while (*p == '\n' || *p == '\r') p++;
            if (!*p) break;

            int W = 0;
            while (is_digit(*p)) {
                W = W * 10 + (*p - '0');
                p++;
            }
            if (*p != 'x') {
                while (*p && *p != '\n' && *p != '\r') p++;
                continue;
            }
            p++;  // 'x'

            int H = 0;
            while (is_digit(*p)) {
                H = H * 10 + (*p - '0');
                p++;
            }
            while (*p && *p != ':') p++;
            if (*p == ':') p++;

            int total_pieces = 0;
            for (int t = 0; t < shape_count; t++) {
                while (*p == ' ') p++;
                int v = 0;
                while (is_digit(*p)) {
                    v = v * 10 + (*p - '0');
                    p++;
                }
                counts[t] = v;
                total_pieces += v;
            }

            const int blocks =
                (W < 256 && H < 256) ? (int)div3_u8[W] * (int)div3_u8[H] : (W / 3) * (H / 3);
            if (total_pieces <= blocks) {
                answer++;
            } else {
                int total_area = 0;
                for (int t = 0; t < shape_count; t++) total_area += counts[t] * (int)shape_areas[t];
                if (total_area <= W * H) {
                    ensure_orients(shape_count, shape_masks);
                    if (can_pack_tight(W, H, shape_count, shape_areas, shape_orients_g, orient_count_g, counts)) {
                        answer++;
                    }
                }
            }

            while (*p && *p != '\n' && *p != '\r') p++;
        }
    }

    AOC_TIMER_END(solve);
    AOC_RESULT_INT(answer);
    aoc_cleanup(input);
    return 0;
}
