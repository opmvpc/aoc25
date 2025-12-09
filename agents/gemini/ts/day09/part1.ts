import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const x: number[] = [];
    const y: number[] = [];
    
    let currentNum = 0;
    let isParsingNumber = false;
    let isSecondNumber = false;

    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      if (code >= 48 && code <= 57) { // 0-9
        currentNum = currentNum * 10 + (code - 48);
        isParsingNumber = true;
      } else if (isParsingNumber) {
        if (!isSecondNumber) {
          x.push(currentNum);
          isSecondNumber = true;
        } else {
          y.push(currentNum);
          isSecondNumber = false;
        }
        currentNum = 0;
        isParsingNumber = false;
      }
    }
    // Handle last number if file doesn't end with newline/non-digit
    if (isParsingNumber) {
       y.push(currentNum);
    }

    const len = x.length;
    let maxArea = 0;

    for (let i = 0; i < len; i++) {
      const xi = x[i];
      const yi = y[i];
      for (let j = i + 1; j < len; j++) {
        const xj = x[j];
        const yj = y[j];
        
        const w = xi > xj ? xi - xj : xj - xi;
        const h = yi > yj ? yi - yj : yj - yi;
        
        const area = (w + 1) * (h + 1);
        if (area > maxArea) maxArea = area;
      }
    }

    return maxArea.toString();
  },
};