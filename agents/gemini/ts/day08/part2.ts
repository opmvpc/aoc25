import type { ISolver } from "../../tools/runner/types.js";

class DSU {
  parent: number[];
  size: number[];
  numComponents: number;

  constructor(n: number) {
    this.parent = new Array(n).fill(0).map((_, i) => i);
    this.size = new Array(n).fill(1);
    this.numComponents = n;
  }

  find(i: number): number {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]);
    }
    return this.parent[i];
  }

  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      if (this.size[rootI] < this.size[rootJ]) {
        this.parent[rootI] = rootJ;
        this.size[rootJ] += this.size[rootI];
      } else {
        this.parent[rootJ] = rootI;
        this.size[rootI] += this.size[rootJ];
      }
      this.numComponents--;
      return true;
    }
    return false;
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

    edges.sort((a, b) => a.distSq - b.distSq);

    const dsu = new DSU(points.length);

    for (const edge of edges) {
      if (dsu.union(edge.u, edge.v)) {
        if (dsu.numComponents === 1) {
            // Found the last edge
            const result = points[edge.u].x * points[edge.v].x;
            return result.toString();
        }
      }
    }

    return "0";
  },
};