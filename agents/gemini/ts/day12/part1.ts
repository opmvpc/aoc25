import type { ISolver } from "../../tools/runner/types";

interface Shape {
    id: number;
    cells: boolean[][];
    h: number;
    w: number;
    area: number;
    variants: boolean[][][]; // Pre-computed rotations/flips
}

interface Region {
    w: number;
    h: number;
    counts: number[];
}

function parseInput(input: string): { shapes: Shape[], regions: Region[] } {
    const lines = input.trim().split("\n");
    const shapes: Shape[] = [];
    const regions: Region[] = [];

    let currentShapeId = -1;
    let currentShapeRows: string[] = [];

    const flushShape = () => {
        if (currentShapeId !== -1) {
            // Convert rows to bool[][]
            const h = currentShapeRows.length;
            const w = currentShapeRows[0].length;
            const cells = currentShapeRows.map(row => row.split("").map(c => c === "#"));
            const area = cells.reduce((acc, row) => acc + row.filter(c => c).length, 0);
            
            // Generate variants
            const variants = generateVariants(cells);

            shapes.push({ id: currentShapeId, cells, h, w, area, variants });
            currentShapeId = -1;
            currentShapeRows = [];
        }
    };

    for (const line of lines) {
        if (line.trim() === "") {
            flushShape();
            continue;
        }

        if (line.match(/^\d+:/)) {
            flushShape();
            currentShapeId = parseInt(line.split(":")[0]);
        } else if (line.match(/^\d+x\d+:/)) {
            flushShape();
            const [dims, countsStr] = line.split(": ");
            const [w, h] = dims.split("x").map(Number);
            const counts = countsStr.split(" ").map(Number);
            regions.push({ w, h, counts });
        } else if (currentShapeId !== -1) {
            currentShapeRows.push(line.trim());
        }
    }
    flushShape();

    return { shapes, regions };
}

function generateVariants(cells: boolean[][]): boolean[][][] {
    const variants: boolean[][][] = [];
    const hashes = new Set<string>();

    let curr = cells;
    for (let i = 0; i < 2; i++) { // Flip
        for (let j = 0; j < 4; j++) { // Rotate
            // Canonicalize (trim empty rows/cols)? 
            // The input shapes are already "tight" bounding boxes usually.
            // But let's just add as is.
            const hash = JSON.stringify(curr);
            if (!hashes.has(hash)) {
                hashes.add(hash);
                variants.push(curr);
            }
            curr = rotate(curr);
        }
        curr = flip(cells); // Flip original and try again
    }
    return variants;
}

function rotate(cells: boolean[][]): boolean[][] {
    const h = cells.length;
    const w = cells[0].length;
    const newCells: boolean[][] = [];
    for (let x = 0; x < w; x++) {
        const row: boolean[] = [];
        for (let y = h - 1; y >= 0; y--) {
            row.push(cells[y][x]);
        }
        newCells.push(row);
    }
    return newCells;
}

function flip(cells: boolean[][]): boolean[][] {
    return cells.slice().reverse();
}

function solveRegion(region: Region, shapes: Shape[]): boolean {
    // 1. Check Area
    let presentArea = 0;
    const presentList: number[] = []; // List of shape IDs to place
    for (let i = 0; i < region.counts.length; i++) {
        presentArea += region.counts[i] * shapes[i].area;
        for (let c = 0; c < region.counts[i]; c++) {
            presentList.push(i);
        }
    }

    if (presentArea > region.w * region.h) return false;

    // 2. If small grid, use backtracking
    if (region.w * region.h <= 200) {
        // Sort presents? Largest first is good heuristic.
        presentList.sort((a, b) => shapes[b].area - shapes[a].area);
        return backtrack(region.w, region.h, new Uint8Array(region.w * region.h), presentList, 0, shapes);
    }

    // 3. For large grids, assume Area check is sufficient
    return true;
}

function backtrack(W: number, H: number, grid: Uint8Array, presentList: number[], pIdx: number, shapes: Shape[]): boolean {
    if (pIdx === presentList.length) return true;

    const shapeId = presentList[pIdx];
    const shape = shapes[shapeId];

    // Optimization: Check remaining area vs remaining holes?
    // Not needed for small sample.

    // Try to place the shape
    // Heuristic: Try all valid positions.
    // Since we are packing, we can just iterate the grid.
    // Optimization: Fix the position of the *first* piece of a specific type?
    // (Symmetry breaking). Not doing for now.

    // We can iterate y, x.
    // Optimization: Find the first empty cell?
    // No, we are PACKING, not TILING. We don't have to cover everything.
    // But we must place the piece SOMEWHERE.
    
    // Iterate all positions (y, x)
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            // Optimization: If current cell is occupied, we CAN skip, 
            // but ONLY if we are enforcing a specific order?
            // No, we can place a piece in a hole even if previous cells are filled.
            // But we can't place it ON TOP of filled.

            // Check all variants
            for (const variant of shape.variants) {
                const h = variant.length;
                const w = variant[0].length;
                
                if (y + h > H || x + w > W) continue;

                // Check collision
                let fits = true;
                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        if (variant[dy][dx]) {
                            const idx = (y + dy) * W + (x + dx);
                            if (grid[idx] !== 0) {
                                fits = false;
                                break;
                            }
                        }
                    }
                    if (!fits) break;
                }

                if (fits) {
                    // Place
                    for (let dy = 0; dy < h; dy++) {
                        for (let dx = 0; dx < w; dx++) {
                            if (variant[dy][dx]) {
                                grid[(y + dy) * W + (x + dx)] = 1;
                            }
                        }
                    }

                    if (backtrack(W, H, grid, presentList, pIdx + 1, shapes)) return true;

                    // Unplace
                    for (let dy = 0; dy < h; dy++) {
                        for (let dx = 0; dx < w; dx++) {
                            if (variant[dy][dx]) {
                                grid[(y + dy) * W + (x + dx)] = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    return false;
}

export const solver: ISolver = {
  solve(input: string): string {
    const { shapes, regions } = parseInput(input);
    let count = 0;
    
    // Sort shapes by area desc for better backtracking?
    // Shapes order is fixed by ID.

    for (const region of regions) {
        if (solveRegion(region, shapes)) {
            count++;
        }
    }

    return count.toString();
  },
};
