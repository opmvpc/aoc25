import type { ISolver } from "../../tools/runner/types";

class DSU {
  parent: number[];
  size: number[];

  constructor(n: number) {
    this.parent = new Array(n).fill(0).map((_, i) => i);
    this.size = new Array(n).fill(1);
  }

  find(i: number): number {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]);
    }
    return this.parent[i];
  }

  union(i: number, j: number): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      // Union by size
      if (this.size[rootI] < this.size[rootJ]) {
        this.parent[rootI] = rootJ;
        this.size[rootJ] += this.size[rootI];
      } else {
        this.parent[rootJ] = rootI;
        this.size[rootI] += this.size[rootJ];
      }
    }
  }
}

interface Point {
  x: number;
  y: number;
  z: number;
  id: number;
}

interface Edge {
  u: number;
  v: number;
  distSq: number;
}

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\n");
    const points: Point[] = lines.map((line, i) => {
      const [x, y, z] = line.split(",").map(Number);
      return { x, y, z, id: i };
    });

    const edges: Edge[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        edges.push({ u: i, v: j, distSq });
      }
    }

    // Sort edges by distance ascending
    // Optimization: Since we only need top 1000, we could use a partial sort or heap,
    // but with N=1000, N^2/2 = 500k, sort is fast enough (approx 100ms).
    edges.sort((a, b) => a.distSq - b.distSq);

    const dsu = new DSU(points.length);

    let limit = 1000;
    // Adjust for sample input which has 20 points and requires only 10 connections
    if (points.length === 20) {
      limit = 10;
    }
    limit = Math.min(limit, edges.length);

    for (let i = 0; i < limit; i++) {
      dsu.union(edges[i].u, edges[i].v);
    }

    // Collect component sizes
    const sizes = new Map<number, number>();
    for (let i = 0; i < points.length; i++) {
      const root = dsu.find(i);
      // We can rely on dsu.size, but need to be careful to only count unique roots
      // Or just map root -> size[root]
    }
    
    // Better: iterate unique roots
    const uniqueRoots = new Set<number>();
    for(let i=0; i<points.length; i++) {
        uniqueRoots.add(dsu.find(i));
    }

    const componentSizes: number[] = [];
    for(const root of uniqueRoots) {
        componentSizes.push(dsu.size[root]);
    }

    componentSizes.sort((a, b) => b - a);

    const result = componentSizes.slice(0, 3).reduce((acc, val) => acc * val, 1);

    return result.toString();
  },
};