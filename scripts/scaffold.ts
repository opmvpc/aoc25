#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Scaffold Script
 * Génère TOUTE la structure du projet depuis zéro
 *
 * Usage: npm run scaffold
 */

import { mkdir, writeFile, access, readdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const ROOT = process.cwd();
const DAYS = 12;
const AGENTS = ["claude", "codex", "gemini"] as const;
type Agent = (typeof AGENTS)[number];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function writeIfNotExists(
  path: string,
  content: string
): Promise<boolean> {
  try {
    await access(path);
    console.log(`  ⏭️  Skip (exists): ${path}`);
    return false;
  } catch {
    await ensureDir(dirname(path));
    await writeFile(path, content, "utf-8");
    console.log(`  ✅ Created: ${path}`);
    return true;
  }
}

function dayDir(day: number): string {
  return `day${day.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// Templates - Core Data
// ═══════════════════════════════════════════════════════════════

const PUZZLE_MD_TEMPLATE = (day: number, part: number) => `# Day ${day
  .toString()
  .padStart(2, "0")} - Part ${part}

## Description

<!-- Coller l'énoncé ici -->

## Notes

<!-- Notes personnelles -->
`;

const SAMPLE_EXPECTED_JSON = `{
  "part1": null,
  "part2": null
}
`;

const ANSWERS_JSON = `{
  "part1": null,
  "part2": null
}
`;

// ═══════════════════════════════════════════════════════════════
// Templates - Day 00 (Test Day with full example)
// ═══════════════════════════════════════════════════════════════

const DAY00_PUZZLE1 = `# Day 00 - Number Cruncher (Test Day)

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

\`\`\`
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
\`\`\`

With K=7, the pairs whose sum is divisible by 7 are counted.
The answer for the sample is **8**.

## Optimization Challenge

⚠️ **The naive O(n²) solution will be too slow for the real input!**

Think about how you can use the **modulo properties** to solve this in O(n) time.

Hint: If (a + b) % K == 0, then (a % K) + (b % K) == K (or both are 0).
`;

const DAY00_PUZZLE2 = `# Day 00 - Part 2: Weighted Pairs

## Description

The Elves want more data! Now instead of just counting pairs, they want the **sum of products** of all valid pairs.

For each valid pair (i, j) where (numbers[i] + numbers[j]) % K == 0, calculate numbers[i] * numbers[j], then sum all these products.

## Example

Using the same sample input with K=7, multiply each valid pair and sum them all.
The answer for the sample is **146**.

## Optimization Challenge

Same optimization applies - you need O(n) or O(n log n) to handle the real input!
`;

const DAY00_SAMPLE = `10 7
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
`;

const DAY00_SAMPLE_EXPECTED = `{
  "part1": "8",
  "part2": "146"
}
`;

function generateDay00Input(): string {
  const N = 50000;
  const K = 97;
  let out = `${N} ${K}\n`;
  // Use seeded random for reproducibility
  let seed = 12345;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let i = 0; i < N; i++) {
    out += (random() % 1000000) + "\n";
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════
// Templates - Solver (generic)
// ═══════════════════════════════════════════════════════════════

const TS_SOLVER_TEMPLATE = (day: number, part: number) => `/**
 * 🎄 Advent of Code 2025 - Day ${day.toString().padStart(2, "0")} Part ${part}
 * @see https://adventofcode.com/2025/day/${day}
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\\n");

    // TODO: Implement solution

    return "NOT_IMPLEMENTED";
  },
};
`;

const C_SOLVER_TEMPLATE = (day: number, part: number) => `/**
 * 🎄 Advent of Code 2025 - Day ${day.toString().padStart(2, "0")} Part ${part}
 * Compile: clang -O2 -o part${part} part${part}.c
 * Run: ./part${part} < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Parse input
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // TODO: Implement solution
    long long result = 0;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
`;

// ═══════════════════════════════════════════════════════════════
// Templates - Day 00 OPTIMIZED Solutions (Example for agents)
// ═══════════════════════════════════════════════════════════════

const DAY00_TS_PART1_OPTIMIZED = `/**
 * 🎄 Advent of Code 2025 - Day 00 Part 1
 * Number Cruncher - Count pairs with sum divisible by K
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping
 *
 * Key insight: (a + b) % K == 0 means (a%K + b%K) % K == 0
 * So we group numbers by their remainder and count valid pairs.
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\\n");
    const [n, k] = lines[0]!.split(" ").map(Number);

    // Count numbers by their remainder when divided by K
    const remainderCount = new Map<number, number>();

    for (let i = 1; i <= n!; i++) {
      const num = parseInt(lines[i]!, 10);
      const rem = ((num % k!) + k!) % k!; // Handle negative numbers
      remainderCount.set(rem, (remainderCount.get(rem) || 0) + 1);
    }

    let pairs = 0n; // Use BigInt for large counts

    // Pairs where both numbers have remainder 0
    const count0 = BigInt(remainderCount.get(0) || 0);
    pairs += (count0 * (count0 - 1n)) / 2n;

    // Pairs where remainders sum to K
    for (let r = 1; r < Math.ceil(k! / 2); r++) {
      const countR = BigInt(remainderCount.get(r) || 0);
      const countKR = BigInt(remainderCount.get(k! - r) || 0);
      pairs += countR * countKR;
    }

    // If K is even, pairs where both have remainder K/2
    if (k! % 2 === 0) {
      const countHalf = BigInt(remainderCount.get(k! / 2) || 0);
      pairs += (countHalf * (countHalf - 1n)) / 2n;
    }

    return pairs.toString();
  },
};
`;

const DAY00_TS_PART2_OPTIMIZED = `/**
 * 🎄 Advent of Code 2025 - Day 00 Part 2
 * Number Cruncher - Sum of products of valid pairs
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping with sum tracking
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\\n");
    const [n, k] = lines[0]!.split(" ").map(Number);

    // Group numbers by remainder, track both count and sum
    const groups = new Map<number, { count: number; sum: bigint; nums: number[] }>();

    for (let i = 1; i <= n!; i++) {
      const num = parseInt(lines[i]!, 10);
      const rem = ((num % k!) + k!) % k!;

      if (!groups.has(rem)) {
        groups.set(rem, { count: 0, sum: 0n, nums: [] });
      }
      const g = groups.get(rem)!;
      g.count++;
      g.sum += BigInt(num);
      g.nums.push(num);
    }

    let totalProduct = 0n;

    // For remainder 0: sum of products within the group
    const g0 = groups.get(0);
    if (g0 && g0.count >= 2) {
      let sumSquares = 0n;
      for (const num of g0.nums) {
        sumSquares += BigInt(num) * BigInt(num);
      }
      totalProduct += (g0.sum * g0.sum - sumSquares) / 2n;
    }

    // For pairs (r, k-r): sum of products between groups
    for (let r = 1; r < Math.ceil(k! / 2); r++) {
      const gR = groups.get(r);
      const gKR = groups.get(k! - r);

      if (gR && gKR) {
        totalProduct += gR.sum * gKR.sum;
      }
    }

    // If K is even, pairs within K/2 group
    if (k! % 2 === 0) {
      const gHalf = groups.get(k! / 2);
      if (gHalf && gHalf.count >= 2) {
        let sumSquares = 0n;
        for (const num of gHalf.nums) {
          sumSquares += BigInt(num) * BigInt(num);
        }
        totalProduct += (gHalf.sum * gHalf.sum - sumSquares) / 2n;
      }
    }

    return totalProduct.toString();
  },
};
`;

const DAY00_C_PART1_OPTIMIZED = `/**
 * 🎄 Advent of Code 2025 - Day 00 Part 1
 * Number Cruncher - Count pairs with sum divisible by K
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping
 * Uses fixed-size array for remainders (faster than hash map)
 */

#include "../../tools/runner/c/common.h"

#define MAX_K 1000000

static long long remainder_count[MAX_K];

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int n, k;
    char* ptr = input;
    n = (int)strtol(ptr, &ptr, 10);
    k = (int)strtol(ptr, &ptr, 10);

    // Reset remainder counts
    memset(remainder_count, 0, k * sizeof(long long));

    // Count numbers by remainder
    for (int i = 0; i < n; i++) {
        long long num = strtoll(ptr, &ptr, 10);
        int rem = ((num % k) + k) % k;
        remainder_count[rem]++;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    long long pairs = 0;

    // Pairs where both have remainder 0
    long long c0 = remainder_count[0];
    pairs += (c0 * (c0 - 1)) / 2;

    // Pairs where remainders sum to K
    for (int r = 1; r < (k + 1) / 2; r++) {
        pairs += remainder_count[r] * remainder_count[k - r];
    }

    // If K is even, pairs where both have remainder K/2
    if (k % 2 == 0) {
        long long ch = remainder_count[k / 2];
        pairs += (ch * (ch - 1)) / 2;
    }

    AOC_TIMER_END(solve);

    AOC_RESULT_INT(pairs);

    aoc_cleanup(input);
    return 0;
}
`;

const DAY00_C_PART2_OPTIMIZED = `/**
 * 🎄 Advent of Code 2025 - Day 00 Part 2
 * Number Cruncher - Sum of products of valid pairs
 *
 * OPTIMIZED SOLUTION: O(n) using modulo grouping with sum tracking
 * Uses 128-bit integers for large products
 */

#include "../../tools/runner/c/common.h"

#define MAX_K 1000000

// Group data: count, sum, and sum of squares
static long long group_count[MAX_K];
static __int128 group_sum[MAX_K];
static __int128 group_sum_sq[MAX_K];

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);

    int n, k;
    char* ptr = input;
    n = (int)strtol(ptr, &ptr, 10);
    k = (int)strtol(ptr, &ptr, 10);

    // Reset groups
    memset(group_count, 0, k * sizeof(long long));
    memset(group_sum, 0, k * sizeof(__int128));
    memset(group_sum_sq, 0, k * sizeof(__int128));

    // Group numbers by remainder
    for (int i = 0; i < n; i++) {
        long long num = strtoll(ptr, &ptr, 10);
        int rem = ((num % k) + k) % k;
        group_count[rem]++;
        group_sum[rem] += num;
        group_sum_sq[rem] += (__int128)num * num;
    }

    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);

    __int128 total = 0;

    // Pairs within remainder 0 group
    if (group_count[0] >= 2) {
        __int128 s = group_sum[0];
        total += (s * s - group_sum_sq[0]) / 2;
    }

    // Pairs between groups r and k-r
    for (int r = 1; r < (k + 1) / 2; r++) {
        total += group_sum[r] * group_sum[k - r];
    }

    // If K is even, pairs within K/2 group
    if (k % 2 == 0 && group_count[k / 2] >= 2) {
        __int128 s = group_sum[k / 2];
        total += (s * s - group_sum_sq[k / 2]) / 2;
    }

    AOC_TIMER_END(solve);

    // Print 128-bit integer
    char buf[64];
    if (total == 0) {
        printf("ANSWER:0\\n");
    } else {
        int i = 63;
        buf[i--] = '\\0';
        __int128 t = total;
        while (t > 0) {
            buf[i--] = '0' + (t % 10);
            t /= 10;
        }
        printf("ANSWER:%s\\n", &buf[i + 1]);
    }

    aoc_cleanup(input);
    return 0;
}
`;

// ═══════════════════════════════════════════════════════════════
// Template - Agent Instructions (PERFORMANCE FOCUSED)
// ═══════════════════════════════════════════════════════════════

const AGENT_MD_TEMPLATE = (agent: Agent) => `# 🤖 ${
  agent.charAt(0).toUpperCase() + agent.slice(1)
} - AoC 2025 Battle Royale

## 🎯 OBJECTIF PRINCIPAL

**Ce n'est PAS juste trouver la bonne réponse.**

L'objectif est de créer l'algorithme **LE PLUS PERFORMANT POSSIBLE**.
Tu es en compétition contre d'autres IA. Les solutions seront benchmarkées 100x.
**Chaque microseconde compte.**

---

## ⚡ TECHNIQUES D'OPTIMISATION

Tu DOIS utiliser toutes les techniques pertinentes parmi celles-ci :

### 📊 Complexité Algorithmique

- **Réduire la complexité** : O(n²) → O(n log n) → O(n) → O(1)
- **Structures de données optimales** : HashMap O(1), TreeSet O(log n), Array O(1)
- **Pré-calcul** : Précalculer tout ce qui peut l'être
- **Mémoïsation** : Cache les résultats des sous-problèmes
- **Programmation dynamique** : Bottom-up vs Top-down selon le cas

### 🧮 Optimisations Mathématiques

- **Formules fermées** : Remplacer les boucles par des formules (somme arithmétique, etc.)
- **Propriétés modulo** : (a+b) % k exploitable pour grouper
- **Bit manipulation** : AND, OR, XOR, shifts pour les opérations rapides
- **Overflow handling** : BigInt en TS, __int128 en C quand nécessaire

### 💾 Optimisations Mémoire

- **Localité du cache** : Accès séquentiels > accès aléatoires
- **Éviter les allocations** : Réutiliser les buffers
- **Types primitifs** : number > object, int > string
- **Arrays typés** : Int32Array, Uint8Array en TS

### 🔧 Optimisations TypeScript

- **Éviter les closures** dans les hot loops
- **Map/Set** au lieu d'objets pour les lookups
- **Avoid spread operator** dans les boucles critiques
- **parseInt avec radix** : \`parseInt(s, 10)\`
- **Typed arrays** pour les données numériques
- **Éviter regex** dans les parsing critiques

### ⚙️ Optimisations C

- **-O2 ou -O3** : Optimisations du compilateur
- **Inlining** : \`static inline\` pour les petites fonctions
- **Déroulement de boucles** : Unroll manuellement si nécessaire
- **SIMD** : Vectorisation si applicable
- **Pointeurs vs indices** : Parfois plus rapide
- **Alignement mémoire** : Structures alignées
- **Éviter les branches** : Branchless programming
- **strtoll vs atoi** : Plus rapide pour le parsing

### 📈 Stratégies de Parsing

- **Parsing manuel** : Souvent plus rapide que split/regex
- **Lecture caractère par caractère** : Évite les allocations
- **Conversion en-place** : Ne pas créer de strings intermédiaires

---

## 📁 Structure Workspace

\`\`\`
${agent}/
├── ${agent}.md              # Ce fichier
├── data/day00-12/           # Énoncés et inputs (synced from core)
├── notes/                   # Ton bloc-notes libre
├── tools/                   # CLI runner (synced from core)
├── ts/day00-12/             # Tes solutions TypeScript
└── c/day00-12/              # Tes solutions C
\`\`\`

---

## 🛠️ Commandes

\`\`\`bash
# Exécuter une solution
./tools/aoc run <day> <part>              # Input final
./tools/aoc run <day> <part> --sample     # Sample input
./tools/aoc run <day> <part> --lang c     # Version C

# Vérifier une solution
./tools/aoc check <day> <part>            # Compare vs expected
./tools/aoc check <day> <part> --sample   # Avec sample
\`\`\`

---

## 📝 Format des Solutions

### TypeScript (\`ts/dayXX/part1.ts\`)

\`\`\`typescript
import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    // input = contenu brut du fichier
    // return = réponse en string
    return "42";
  },
};
\`\`\`

### C (\`c/dayXX/part1.c\`)

\`\`\`c
#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // ... parsing ...
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // ... solving ...
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);
    aoc_cleanup(input);
    return 0;
}
\`\`\`

---

## 🔄 Workflow

1. **Lire l'énoncé** dans \`data/dayXX/puzzle1.md\`
2. **Analyser** la complexité requise
3. **Implémenter** en TS d'abord (plus rapide à itérer)
4. **Tester** : \`./tools/aoc run X 1 --sample\`
5. **Vérifier** : \`./tools/aoc check X 1 --sample\`
6. **Optimiser** : Profiler, réduire la complexité
7. **Porter en C** si tu veux les meilleures perfs
8. **Benchmark** : Compare TS vs C

---

## 🏆 Critères de Victoire

1. **Correctness** : La réponse doit être correcte
2. **Performance** : Temps d'exécution minimal (benchmark x100)
3. **Les deux langages** : TS ET C doivent fonctionner

**May the fastest algorithm win!** 🚀
`;

const GITKEEP = "";

// ═══════════════════════════════════════════════════════════════
// Scaffold Functions
// ═══════════════════════════════════════════════════════════════

async function scaffoldCoreData(): Promise<void> {
  console.log("\n📦 Scaffolding core/data...");

  // Day 00 - Test Day
  const day00Dir = join(ROOT, "core", "data", "day00");
  await writeIfNotExists(join(day00Dir, "puzzle1.md"), DAY00_PUZZLE1);
  await writeIfNotExists(join(day00Dir, "puzzle2.md"), DAY00_PUZZLE2);
  await writeIfNotExists(join(day00Dir, "sample.txt"), DAY00_SAMPLE);
  await writeIfNotExists(
    join(day00Dir, "sample.expected.json"),
    DAY00_SAMPLE_EXPECTED
  );
  await writeIfNotExists(join(day00Dir, "input.txt"), generateDay00Input());
  await writeIfNotExists(join(day00Dir, "answers.json"), ANSWERS_JSON);

  // Days 1-12
  for (let day = 1; day <= DAYS; day++) {
    const dir = join(ROOT, "core", "data", dayDir(day));

    await writeIfNotExists(join(dir, "puzzle1.md"), PUZZLE_MD_TEMPLATE(day, 1));
    await writeIfNotExists(join(dir, "puzzle2.md"), PUZZLE_MD_TEMPLATE(day, 2));
    await writeIfNotExists(join(dir, "sample.txt"), "");
    await writeIfNotExists(
      join(dir, "sample.expected.json"),
      SAMPLE_EXPECTED_JSON
    );
    await writeIfNotExists(join(dir, "input.txt"), "");
    await writeIfNotExists(join(dir, "answers.json"), ANSWERS_JSON);
  }
}

async function scaffoldAgents(): Promise<void> {
  console.log("\n🤖 Scaffolding agents...");

  for (const agent of AGENTS) {
    console.log(`\n  📂 ${agent}/`);
    const agentDir = join(ROOT, "agents", agent);

    // Agent-specific MD file
    await writeIfNotExists(
      join(agentDir, `${agent}.md`),
      AGENT_MD_TEMPLATE(agent)
    );

    // notes/
    await writeIfNotExists(join(agentDir, "notes", ".gitkeep"), GITKEEP);

    // data/ (placeholder, will be synced)
    await writeIfNotExists(join(agentDir, "data", ".gitkeep"), GITKEEP);

    // tools/ (placeholder, will be synced)
    await writeIfNotExists(join(agentDir, "tools", ".gitkeep"), GITKEEP);

    // Day 00 - OPTIMIZED solutions as examples
    await writeIfNotExists(
      join(agentDir, "ts", "day00", "part1.ts"),
      DAY00_TS_PART1_OPTIMIZED
    );
    await writeIfNotExists(
      join(agentDir, "ts", "day00", "part2.ts"),
      DAY00_TS_PART2_OPTIMIZED
    );
    await writeIfNotExists(
      join(agentDir, "c", "day00", "part1.c"),
      DAY00_C_PART1_OPTIMIZED
    );
    await writeIfNotExists(
      join(agentDir, "c", "day00", "part2.c"),
      DAY00_C_PART2_OPTIMIZED
    );

    // Days 1-12 - Templates
    for (let day = 1; day <= DAYS; day++) {
      const tsDir = join(agentDir, "ts", dayDir(day));
      await writeIfNotExists(
        join(tsDir, "part1.ts"),
        TS_SOLVER_TEMPLATE(day, 1)
      );
      await writeIfNotExists(
        join(tsDir, "part2.ts"),
        TS_SOLVER_TEMPLATE(day, 2)
      );

      const cDir = join(agentDir, "c", dayDir(day));
      await writeIfNotExists(join(cDir, "part1.c"), C_SOLVER_TEMPLATE(day, 1));
      await writeIfNotExists(join(cDir, "part2.c"), C_SOLVER_TEMPLATE(day, 2));
    }
  }
}

async function scaffoldCoreRunner(): Promise<void> {
  console.log("\n🔧 Scaffolding core/runner...");

  const runnerDir = join(ROOT, "core", "runner");

  await writeIfNotExists(
    join(runnerDir, "package.json"),
    JSON.stringify(
      {
        name: "@aoc25/runner",
        version: "1.0.0",
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        bin: {
          aoc: "./dist/cli.js",
        },
        scripts: {
          build: "tsc",
          dev: "tsc --watch",
        },
        dependencies: {
          commander: "^12.0.0",
        },
        devDependencies: {
          "@types/node": "^20.10.0",
          typescript: "^5.3.0",
        },
      },
      null,
      2
    )
  );

  await writeIfNotExists(
    join(runnerDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          outDir: "./dist",
          rootDir: "./src",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );
}

async function scaffoldCoreDb(): Promise<void> {
  console.log("\n🗄️ Scaffolding core/db...");

  const dbDir = join(ROOT, "core", "db");

  await writeIfNotExists(
    join(dbDir, "package.json"),
    JSON.stringify(
      {
        name: "@aoc25/db",
        version: "1.0.0",
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: {
          build: "tsc",
        },
        dependencies: {
          "better-sqlite3": "^11.0.0",
        },
        devDependencies: {
          "@types/better-sqlite3": "^7.6.8",
          "@types/node": "^20.10.0",
          typescript: "^5.3.0",
        },
      },
      null,
      2
    )
  );

  await writeIfNotExists(
    join(dbDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          outDir: "./dist",
          rootDir: "./src",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );
}

async function scaffoldGitignore(): Promise<void> {
  console.log("\n📝 Scaffolding .gitignore...");

  const gitignore = `# Dependencies
node_modules/

# Build outputs
dist/
*.js.map

# Database
*.db
*.db-journal

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Compiled C binaries
agents/*/c/**/*.exe
agents/*/c/**/part1
agents/*/c/**/part2

# Nuxt
.nuxt/
.output/
.data/

# Logs
*.log

# Playwright
.playwright-mcp/
`;

  await writeIfNotExists(join(ROOT, ".gitignore"), gitignore);
}

// ═══════════════════════════════════════════════════════════════
// Sync Tools - Copy runner to agents
// ═══════════════════════════════════════════════════════════════

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function syncTools(): Promise<boolean> {
  console.log("\n🔧 Syncing tools to agents...");

  const runnerSrcDir = join(ROOT, "core", "runner");
  const runnerDistDir = join(runnerSrcDir, "dist");

  // Check if runner is built
  if (!existsSync(runnerDistDir)) {
    // Try to build it if node_modules exists
    if (existsSync(join(ROOT, "node_modules"))) {
      console.log("  📦 Building runner...");
      try {
        execSync("npm run build", {
          cwd: runnerSrcDir,
          stdio: "pipe",
        });
        console.log("  ✅ Runner built successfully");
      } catch {
        console.log(
          "  ⚠️  Could not build runner. Run 'npm install' then 'npm run sync-tools'"
        );
        return false;
      }
    } else {
      console.log(
        "  ⚠️  Runner not built. Run 'npm install' then 'npm run sync-tools'"
      );
      return false;
    }
  }

  // Copy to each agent
  for (const agent of AGENTS) {
    const toolsDir = join(ROOT, "agents", agent, "tools");
    const runnerDestDir = join(toolsDir, "runner");

    console.log(`  🤖 Syncing to ${agent}...`);

    // Create tools dir
    await mkdir(toolsDir, { recursive: true });
    await mkdir(runnerDestDir, { recursive: true });

    // Copy dist/
    if (existsSync(runnerDistDir)) {
      await copyDir(runnerDistDir, join(runnerDestDir, "dist"));
    }

    // Copy package.json
    const pkgSrc = join(runnerSrcDir, "package.json");
    if (existsSync(pkgSrc)) {
      await copyFile(pkgSrc, join(runnerDestDir, "package.json"));
    }

    // Create types.js for solver imports
    await writeFile(
      join(runnerDestDir, "types.js"),
      `// Re-export types for solver imports\nexport * from "./dist/types.js";\n`
    );

    // Copy C common header
    const cHeaderSrc = join(runnerSrcDir, "c", "common.h");
    if (existsSync(cHeaderSrc)) {
      const cHeaderDir = join(runnerDestDir, "c");
      await mkdir(cHeaderDir, { recursive: true });
      await copyFile(cHeaderSrc, join(cHeaderDir, "common.h"));
    }

    // Create shell wrapper (Unix)
    const shellWrapper = `#!/bin/bash
# AoC 2025 Runner Wrapper
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.." && npx tsx "$SCRIPT_DIR/runner/dist/cli.js" "$@"
`;
    await writeFile(join(toolsDir, "aoc"), shellWrapper);

    // Create batch wrapper (Windows)
    const batchWrapper = `@echo off
REM AoC 2025 Runner Wrapper
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.." && npx tsx "%SCRIPT_DIR%runner\\dist\\cli.js" %*
`;
    await writeFile(join(toolsDir, "aoc.bat"), batchWrapper);

    // Create PowerShell wrapper
    const psWrapper = `# AoC 2025 Runner Wrapper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")
npx tsx (Join-Path $ScriptDir "runner\\dist\\cli.js") $args
`;
    await writeFile(join(toolsDir, "aoc.ps1"), psWrapper);
  }

  console.log("  ✅ Tools synced to all agents");
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log("🏗️  AoC 2025 Battle Royale - Scaffold\n");
  console.log("═".repeat(50));

  await scaffoldGitignore();
  await scaffoldCoreData();
  await scaffoldCoreRunner();
  await scaffoldCoreDb();
  await scaffoldAgents();

  // Try to sync tools
  const toolsSynced = await syncTools();

  console.log("\n" + "═".repeat(50));
  console.log("✨ Scaffold complete!");

  if (!toolsSynced) {
    console.log("\n⚠️  Tools not synced. Complete setup:");
    console.log("  1. npm install");
    console.log("  2. npm run sync-tools");
    console.log("  3. npm run init-db");
    console.log("  4. npm run publish-day -- 0");
    console.log("  5. npm run dev");
  } else {
    console.log("\n✅ Tools synced! Remaining steps:");
    console.log("  1. npm run init-db");
    console.log("  2. npm run publish-day -- 0");
    console.log("  3. npm run dev");
  }
}

main().catch((err) => {
  console.error("❌ Scaffold failed:", err);
  process.exit(1);
});
