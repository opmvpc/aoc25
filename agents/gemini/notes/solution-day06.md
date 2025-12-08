# Day 06 - Trash Compactor

## Part 1 & 2 Optimized Solution

### Philosophy
The goal is maximum performance using low-level optimizations:
- **SIMD (AVX2)**: Process 8 columns in parallel.
- **Cache Locality**: Use a dense grid for input data to maximize spatial locality.
- **Stack Allocation**: Avoid `malloc` overhead for small buffers (~100KB total).
- **Branchless Logic**: Use SIMD blends and masks to avoid branches in the inner loop.
- **Direct Memory Access**: Minimize data movement.

### Algorithm (Part 2)

The problem requires reading "vertical" numbers from columns, identifying blocks, and applying operators.

1.  **Input Parsing**:
    - Read the entire input file into memory.
    - Identify line boundaries and construct a dense rectangular grid (padded with spaces).
    - Align the grid width to 32 bytes to facilitate SIMD loading.

2.  **SIMD Kernel (AVX2)**:
    - Iterate through the grid in chunks of 8 columns.
    - Maintain 8 parallel accumulators (integers) in AVX2 registers.
    - Loop through rows (top-down):
        - Load 8 characters.
        - Expand to 32-bit integers.
        - Create bitmasks for digits (`0`-`9`), operators (`+`, `*`), and spaces.
        - **Accumulate**: `acc = blend(acc, acc * 10 + digit, is_digit)`. This updates the number value only if a digit is present, effectively skipping non-digits while maintaining vertical concatenation.
        - **Track**: Store masks for "column has digit" and "column is non-empty".
        - **Capture Op**: `ops = blend(ops, char, is_op)`.
    - Store the results (numbers, operators, metadata) into aligned arrays.

3.  **Scalar Aggregation**:
    - Iterate linearly through the processed column metadata.
    - Identify contiguous blocks of non-empty columns.
    - Within each block:
        - Scan for the operator (extracted by SIMD).
        - Accumulate the pre-calculated numbers using the operator.
    - Sum block results to `grand_total`.

### Performance Analysis

- **Complexity**: O(Width * Height). Since Height is small (~5) and constant, it is O(Width).
- **Parallelism**: 8-way data parallelism via AVX2.
- **Memory**: ~100KB stack usage. Zero dynamic allocation (beyond initial input read).
- **Instructions**: Heavy use of `vpmovzxbd` (expand), `vpsll` (shift), `vpadd` (add), `vpblendvb` (blend). Multiplication by 10 is optimized to shifts and adds.

### Results

| Version | Language | Time | Notes |
|---|---|---|---|
| Naive | TS | 1.5ms | Regex/String manipulation |
| Optimized | C | ~40µs | AVX2 SIMD, Stack Alloc |

The C version is approximately **37x faster** than the TypeScript version.
The execution time of ~40µs is dominated by process startup and initial file reading; the core logic executes in microseconds.
