# Day 12 - Present Packing

## Analysis

The problem asks us to determine if a set of polyominoes can fit into a given rectangular region.
We are given 6 distinct shapes (indices 0-5).
We are given ~1000 queries, each with a Grid Dimension (WxH) and a count for each shape.

### Key Observations

1.  **Shapes**: The shapes are small polyominoes (bounding box ~3x3, area 5-7 cells).
2.  **Sample**: Contains a tricky case (12x5 grid) where the total Area of presents fits (49 vs 60), but they don't pack due to width/height constraints.
3.  **Input**:
    -   Regions are much larger (Min dim ~35, Area ~1200+).
    -   Presents are numerous (Area Sum ~1000+).
    -   **Slack**: The difference between Grid Area and Sum of Present Areas is significant (Min ~15%, Avg ~20%).
    -   There are **no** "tight" cases in the input like the 12x5 sample case.

## Solution Strategy

### Heuristic: Area Check
For large grids with significant slack and small pieces, the condition `Sum(PresentAreas) <= GridArea` is usually sufficient. Tiling obstructions typically occur only when packing density approaches 100% or boundaries are very constrained (narrow strips).

### Exact Solver (Backtracking)
To ensure correctness on the **Sample** (which has the "tight" case) and any potential small grids in the input, we implement a Backtracking Solver.
-   **Optimization**: For grids with `Area <= 64` (like the 12x5 sample), we use a **Bitmask Solver** (using `uint64_t` to represent the grid). This allows for fast collision checking.
-   **General Case**: For larger grids (up to 200 cells), we use an Array-based solver.
-   **Assumption**: For grids > 200 cells (all real input cases), we rely on the Area Check.

### Algorithm
1.  Parse Shapes and generate all 8 symmetries (rotations/flips).
2.  For each region:
    -   Calculate `TotalPresentArea`.
    -   If `TotalPresentArea > GridArea` -> **Impossible**.
    -   If `GridArea <= 200`: Run Backtracking Solver.
    -   Else: **Possible** (Assume valid due to slack).

## Results

-   **Sample**: Correctly identified the impossible case (Answer 2).
-   **Input**: 517 regions fit by Area. (Solver was skipped due to large grid sizes).

| Language | Time (Input) | Time (Sample) |
| :--- | :--- | :--- |
| TypeScript | 5ms | 5.5s |
| C | 2.8ms | 1.6s |
