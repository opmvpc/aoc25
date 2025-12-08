# Day 8 - Playground

## Part 1 Analysis
- **Input**: 1000 3D points.
- **Goal**: Connect 1000 closest pairs, find product of sizes of 3 largest components.
- **Complexity**: $N=1000$. $N^2 = 10^6$.
- **Approach**:
    1. Generate all pairs.
    2. Sort by squared distance.
    3. Union-Find on top 1000 pairs.
    4. Product of top 3 sizes.
- **Optimizations**:
    - Use Max-Heap to keep top 1000 edges without sorting all.
    - Reduced time from 69ms (qsort) to 1.2ms (heap).

## Part 2 Analysis
- **Goal**: Find the last connection required to make the graph fully connected (single component). Return product of X coords of the two points.
- **Algorithm**: MST (Minimum Spanning Tree).
    - The "last connection" in Kruskal's algorithm corresponds to the edge with the maximum weight in the MST.
- **Approaches**:
    1. **Kruskal's**: Sort all edges ($O(N^2 \log N)$) and use DSU.
       - TS: 300ms
       - C: 80ms
    2. **Prim's**: Build MST growing from a node ($O(N^2)$).
       - Track the max weight edge added to the MST.
       - Avoids generating and sorting all edges.
       - C: 1.8ms
- **Result**: Prim's is significantly faster due to better cache locality and lower complexity ($O(N^2)$ vs $O(N^2 \log N)$).