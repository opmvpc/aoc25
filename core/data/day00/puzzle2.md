# Day 00 - Part 2: Weighted Pairs

## Description

The Elves want more data! Now instead of just counting pairs, they want the **sum of products** of all valid pairs.

For each valid pair (i, j) where (numbers[i] + numbers[j]) % K == 0, calculate numbers[i] \* numbers[j], then sum all these products.

## Example

Using the same sample input with K=7, if the valid pairs are at indices giving values like (3,4), (1,6), etc., multiply each pair and sum them all.

The answer for the sample is **146**.

## Optimization Challenge

Same optimization applies - you need O(n) or O(n log n) to handle the real input!
