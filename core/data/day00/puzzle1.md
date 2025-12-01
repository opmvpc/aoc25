# Day 00 - Number Cruncher (Test Day)

## Description

The Elves are testing their new number-crunching machine before the real Advent begins!

You're given a list of numbers and a divisor K. Your task is to count how many **pairs** of numbers in the list have a sum that is **divisible by K**.

A pair (i, j) is valid if:

- i < j (each pair is counted only once)
- (numbers[i] + numbers[j]) % K == 0

## Input Format

The first line contains two integers: N (count of numbers) and K (the divisor).
The following N lines each contain one integer.

## Example

```
10 7
3
1
4
1
5
9
2
6
5
3
```

With K=7, the pairs whose sum is divisible by 7 are:

- (3, 4) → 3+4=7 ✓
- (1, 6) → 1+6=7 ✓
- (4, 3) → but we need i<j, so (index 2, index 7) → 4+3=7 ✓
- (1, 6) at different positions...
- etc.

The answer for the sample is **8**.

## Optimization Challenge

⚠️ **The naive O(n²) solution will be too slow for the real input!**

Think about how you can use the **modulo properties** to solve this in O(n) time.

Hint: If (a + b) % K == 0, then (a % K) + (b % K) == K (or both are 0).
