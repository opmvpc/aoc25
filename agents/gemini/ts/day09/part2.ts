import type { ISolver } from "../../tools/runner/types.js";

interface Point {
  x: number;
  y: number;
}

interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Precomputed for intersection checks
  isVertical: boolean;
  minVal: number; // min x or y depending on orientation
  maxVal: number;
  fixedVal: number; // fixed x or y
}

export const solver: ISolver = {
  solve(input: string): string {
    const points: Point[] = [];
    
    let currentNum = 0;
    let isParsingNumber = false;
    let isSecondNumber = false;
    let currentX = 0;

    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      if (code >= 48 && code <= 57) { // 0-9
        currentNum = currentNum * 10 + (code - 48);
        isParsingNumber = true;
      } else {
        if (isParsingNumber) {
          if (!isSecondNumber) {
            currentX = currentNum;
            isSecondNumber = true;
          } else {
            points.push({ x: currentX, y: currentNum });
            isSecondNumber = false;
          }
          currentNum = 0;
          isParsingNumber = false;
        }
      }
    }
    if (isParsingNumber) {
       points.push({ x: currentX, y: currentNum });
    }

    const n = points.length;
    const edges: Edge[] = [];
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const isVertical = p1.x === p2.x;
      edges.push({
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        isVertical,
        minVal: isVertical ? Math.min(p1.y, p2.y) : Math.min(p1.x, p2.x),
        maxVal: isVertical ? Math.max(p1.y, p2.y) : Math.max(p1.x, p2.x),
        fixedVal: isVertical ? p1.x : p1.y
      });
    }

    let maxArea = 0;

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      for (let j = i + 1; j < n; j++) {
        const p2 = points[j];
        
        const w = Math.abs(p1.x - p2.x);
        const h = Math.abs(p1.y - p2.y);
        const area = (w + 1) * (h + 1);

        if (area <= maxArea) continue;

        const rxMin = Math.min(p1.x, p2.x);
        const rxMax = Math.max(p1.x, p2.x);
        const ryMin = Math.min(p1.y, p2.y);
        const ryMax = Math.max(p1.y, p2.y);

        // 1. Check for Edge Intersections with Strict Interior
        let intersects = false;
        for (let k = 0; k < n; k++) {
          const e = edges[k];
          if (e.isVertical) {
            // Vertical edge at e.fixedVal (x), range e.minVal..e.maxVal (y)
            // Intersects if rxMin < x < rxMax AND overlap in Y
            if (e.fixedVal > rxMin && e.fixedVal < rxMax) {
              // Check Y overlap
              const overlapMin = Math.max(e.minVal, ryMin);
              const overlapMax = Math.min(e.maxVal, ryMax);
              if (overlapMin < overlapMax) { // Strict overlap?
                 // The interior of the rect is (ryMin, ryMax).
                 // The edge segment is [minVal, maxVal].
                 // Intersection is non-empty interval.
                 intersects = true;
                 break;
              }
            }
          } else {
            // Horizontal edge at e.fixedVal (y), range e.minVal..e.maxVal (x)
            if (e.fixedVal > ryMin && e.fixedVal < ryMax) {
              // Check X overlap
              const overlapMin = Math.max(e.minVal, rxMin);
              const overlapMax = Math.min(e.maxVal, rxMax);
              if (overlapMin < overlapMax) {
                intersects = true;
                break;
              }
            }
          }
        }

        if (intersects) continue;

        // 2. Check Inclusion (Midpoint Ray Casting)
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        
        let windings = 0;
        for (let k = 0; k < n; k++) {
          const e = edges[k];
          // Ray cast to +X
          // Intersect vertical edges where edge.x > mx and my is within Y range
          if (e.isVertical) {
             if (e.fixedVal > mx) {
               // Check if my is within Y range of edge
               // Standard ray casting: check if my is between y1 and y2
               // To avoid vertices, we use [min, max) or similar convention?
               // Since mx, my are .5 or .0, and vertices are integers.
               // If my is integer (e.g. h is even), we might hit a vertex.
               // However, vertices are always "corner" points.
               // If my aligns with a horizontal edge, it's tricky.
               // Let's use a small epsilon or strictly < / <= logic.
               // Since y1, y2 are integers.
               // If my is integer, it equals y1 or y2.
               // If my is .5, it is strictly between.
               
               if (my >= e.minVal && my < e.maxVal) { 
                 // Standard convention: include bottom, exclude top (or vice versa)
                 // Or just > min and <= max.
                 // Wait, if my is exactly a vertex Y, say 5.
                 // We have edges (5, 4->5) and (5, 5->6).
                 // We hit the vertex.
                 // Ray casting rule: if ray hits vertex, consider the other endpoint's Y relative to ray.
                 // Simple trick: Perturb my slightly? 
                 // my is either Int or Int + 0.5.
                 // If Int, perturb by epsilon.
                 // Effective my = my + 0.001.
                 const testY = my + 0.001;
                 if (testY >= e.minVal && testY <= e.maxVal) {
                   windings++;
                 }
               } else if (my % 1 !== 0) { // my is .5
                  if (my > e.minVal && my < e.maxVal) {
                    windings++;
                  }
               }
             }
          }
        }
        
        if (windings % 2 === 1) {
          maxArea = area;
        }
      }
    }

    return maxArea.toString();
  },
};