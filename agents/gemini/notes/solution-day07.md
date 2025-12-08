# Day 07 - Laboratories

## Part 1

### Problem
Simulate a single beam starting at 'S' moving downwards. Splitters (`^`) replicate the beam to left and right. Merging beams combine. Count total splits.

### Approach
- **Grid Scan**: Find S.
- **Simulation**: Row by row. Maintain a set/array of active X coordinates.
- **Logic**:
  - `^`: `split_count++`. Active X becomes `x-1` and `x+1`.
  - `.`: Active X remains `x`.
- **Optimization**: Use a `uint8_t` array for active positions (dense boolean array) instead of a Set.

### Performance
- TS: ~1ms
- C: ~36µs

## Part 2

### Problem
"Quantum" interpretation: Count total timelines. A timeline splits at each splitter. We need to sum the number of distinct paths taken by particles. If paths merge spatially, their timeline counts sum up.

### Approach
- **Dynamic Programming**: Row by row.
- **State**: `counts[x]` = number of active timelines at column `x`.
- **Logic**:
  - Start: `counts[start_x] = 1`.
  - `^` at `x`:
    - `next_counts[x-1] += counts[x]`
    - `next_counts[x+1] += counts[x]`
    - (If out of bounds, add to `total_exited`)
  - `.` at `x`:
    - `next_counts[x] += counts[x]`
- **Result**: Sum of `total_exited` + sum of `counts` at the bottom.

### Optimization
- **Data Structure**: `unsigned long long` arrays for counts (can exceed 2^32).
- **Scanning**: Track `max_x` to limit iteration range (though standard grids are usually rectangular, this handles ragged/sparse efficiently).
- **Memory**: Stack allocation (4096 longs = 32KB).

### Results

| Part | Version | Language | Time | Answer |
|---|---|---|---|---|
| 1 | v1 | TS | 1.10ms | 1600 |
| 1 | v1 | C | 36µs | 1600 |
| 2 | v1 | TS | 874µs | 8632253783011 |
| 2 | v1 | C | 57µs | 8632253783011 |

The C version handles the "quantum split" efficiently using simple array additions, essentially a Pascal's triangle-like propagation on the grid.