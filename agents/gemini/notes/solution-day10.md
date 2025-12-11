# Day 10 - Factory

## Analysis

We have a set of lights and buttons. Each button toggles a specific subset of lights.
We start with all lights OFF (0).
We want to reach a target configuration (given by `.` and `#`) using the minimum number of button presses.
Pressing a button twice is equivalent to 0 times.
So we are solving a system of linear equations over GF(2):
$Mx = T$
where $M$ is the matrix of button effects (columns are buttons, rows are lights), $x$ is the vector of button presses (0 or 1), and $T$ is the target state.

We want to minimize the Hamming weight of $x$ (number of 1s).

## Approach

1.  **Parsing**:
    - Extract target state vector $T$.
    - Extract button vectors $v_1, v_2, \dots, v_B$.
    - Build matrix $M$ (cols are $v_i$).

2.  **Solving**:
    - Use Gaussian elimination (with XOR) on the augmented matrix $[M | T]$ to bring it to Reduced Row Echelon Form (RREF).
    - Identify pivot columns and free columns.
    - The system might be inconsistent (no solution) if a row corresponds to $0 = 1$. The problem implies a solution exists, but we should handle this.
    - If consistent, the variables corresponding to free columns can be set arbitrarily (0 or 1).
    - Let free variables be $f_1, \dots, f_k$. There are $2^k$ combinations.
    - For each combination of free variables, the pivot variables are determined.
    - Calculate total presses (sum of $x_i$) for each combination.
    - Return the minimum.

3.  **Optimization**:
    - Use bitmasks (BigInt or number) for rows since $L$ is likely small (< 50).
    - If $L$ fits in 32 bits, use standard numbers. If < 64, BigInt or two numbers.
    - Check max number of lights in input.



## Part 2 Analysis



The problem shifts from GF(2) to integer arithmetic.

We solve $Mx = T$ over integers, minimizing $\sum x_i$ subject to $x_i \ge 0$.



### Approach

1.  **Gaussian Elimination**: Since the system is small ($L \approx 10, B \approx 13$), we perform Gaussian elimination over Rationals ($\mathbb{Q}$) to reach RREF.

2.  **Free Variables**: We identify free variables (columns without pivots). The number of free variables is small ($\le 3$).

3.  **Search**: We iterate through possible values for free variables.

    -   Since $M_{ij} \ge 0$ (original matrix) and $x_i \ge 0$, each variable is bounded by $x_j \le \min \{ T_i \mid M_{ij} > 0 \}$.

    -   We use a recursive search with pruning.

    -   Inside the recursion base case, we calculate pivot variables. We check if they are non-negative integers.

    -   If valid, we compute the cost and update the minimum.



### Complexity

-   Gaussian Elim: $O(L \cdot B)$.

-   Search: $O(K^F)$ where $K$ is range of variables (~200) and $F$ is number of free vars (~3).

-   With pruning and tight bounds, it's very fast.



## Results



| Version      | Langage | Temps | Notes   |

| ------------ | ------- | ----- | ------- |

| v1 naive     | TS      | 4.6ms | Gaussian Elim + Free Var Search |

| v2 optimized | C       | 150µs | Bitmasks + custom parsing |

| Part 2 TS    | TS      | 1.5ms | Rational Gaussian + Recursion |

| Part 2 C     | C       | 9ms   | Rational Gaussian + Integer Recursion |





## Leçons Apprises



- Small systems over GF(2) are trivial with XOR and bitmasks.

- Gaussian Elimination is very robust.

- Free variable iteration works perfectly for underdetermined systems when minimizing Hamming weight (for small number of free vars).

- Even for ILP-like problems, if dimensions are small, brute-force over free variables (after reduction) is efficient.


