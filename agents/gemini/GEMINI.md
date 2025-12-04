# 🤖 Gemini - AoC 2025 Battle Royale

## 🎯 OBJECTIF PRINCIPAL

**Ce n'est PAS juste trouver la bonne réponse.**

L'objectif est de créer l'algorithme **LE PLUS PERFORMANT POSSIBLE**.
Tu es en compétition contre d'autres IA. Les solutions seront benchmarkées 100x.
**Chaque microseconde compte.**

---

## 🧠 PHILOSOPHIE DE L'OPTIMISATION

### Penser en Code Machine

Quand tu écris du code, pense à ce qui se passe au niveau CPU :
- **Chaque instruction compte** : ADD, MUL, CMP, JMP ont des coûts différents
- **Les branches sont coûteuses** : Une mauvaise prédiction = ~15-20 cycles perdus
- **Le cache est roi** : L1 cache hit = ~4 cycles, RAM = ~100+ cycles
- **Le parallélisme existe** : SIMD peut traiter 4-32 valeurs en une instruction

### La Hiérarchie des Optimisations

```
1. Complexité Algorithmique    O(n²) → O(n log n) → O(n) → O(1)
2. Optimisation Mathématique   Formules fermées, propriétés algébriques
3. Structure de Données        HashMap O(1) vs Array O(n)
4. Optimisation Mémoire        Cache locality, préallocation
5. Micro-optimisations         Branchless, SIMD, bit tricks
```

---

## ⚡ TECHNIQUES D'OPTIMISATION AVANCÉES

### 📊 1. Réduction de Complexité Algorithmique

| Problème | Naïf | Optimisé | Technique |
|----------|------|----------|-----------|
| Recherche dans liste | O(n) | O(1) | HashMap/Set |
| Tri | O(n²) | O(n log n) | QuickSort/MergeSort |
| Sous-séquence max | O(n²) | O(n) | Kadane's algorithm |
| Plus court chemin | O(V²) | O(E log V) | Dijkstra avec heap |
| Paires avec somme | O(n²) | O(n) | Two pointers ou HashMap |

**Exemple - Compter les paires (a,b) où a+b divisible par K :**
```
Naïf O(n²): Pour chaque paire, tester (a+b) % K == 0
Optimisé O(n): Grouper par reste modulo K, combiner les groupes complémentaires
```

### 🧮 2. Optimisations Mathématiques

#### Formules Fermées
Remplacer les boucles par des formules mathématiques :

```c
// ❌ O(n) - Somme de 1 à n
long sum = 0;
for (int i = 1; i <= n; i++) sum += i;

// ✅ O(1) - Formule de Gauss
long sum = (long)n * (n + 1) / 2;
```

**Formules utiles :**
- Somme 1..n : `n*(n+1)/2`
- Somme carrés : `n*(n+1)*(2n+1)/6`
- Somme cubes : `(n*(n+1)/2)²`
- Somme géométrique : `(rⁿ - 1) / (r - 1)`
- Progression arithmétique : `n * (a₁ + aₙ) / 2`

#### Propriétés Modulo
```c
// (a + b) % m == ((a % m) + (b % m)) % m
// (a * b) % m == ((a % m) * (b % m)) % m

// Pour les restes négatifs en C :
int mod(int a, int m) {
    return ((a % m) + m) % m;
}
```

#### Manipulation de Bits
```c
// Vérifier si n est puissance de 2
bool isPow2 = n && !(n & (n - 1));

// Compter les bits à 1
int popcount = __builtin_popcount(n);

// Plus proche puissance de 2 supérieure
int nextPow2 = 1 << (32 - __builtin_clz(n - 1));

// Extraire le bit de poids faible
int lowestBit = n & (-n);

// Division par 2 (plus rapide que n/2)
int half = n >> 1;

// Multiplication par 2
int doubled = n << 1;

// Swap sans variable temporaire
a ^= b; b ^= a; a ^= b;
```

### 💾 3. Optimisations Mémoire

#### Localité du Cache
```c
// ❌ Mauvais - Accès par colonne (stride = largeur)
for (int j = 0; j < cols; j++)
    for (int i = 0; i < rows; i++)
        sum += matrix[i][j];

// ✅ Bon - Accès par ligne (stride = 1)
for (int i = 0; i < rows; i++)
    for (int j = 0; j < cols; j++)
        sum += matrix[i][j];
```

#### Préallocation
```c
// ❌ Allocations répétées
for (int i = 0; i < n; i++) {
    char* buf = malloc(100);
    // ...
    free(buf);
}

// ✅ Allocation unique
char* buf = malloc(100);
for (int i = 0; i < n; i++) {
    // réutiliser buf
}
free(buf);
```

#### Structure Packing
```c
// ❌ 24 bytes (avec padding)
struct Bad {
    char a;      // 1 byte + 7 padding
    double b;    // 8 bytes
    char c;      // 1 byte + 7 padding
};

// ✅ 16 bytes
struct Good {
    double b;    // 8 bytes
    char a;      // 1 byte
    char c;      // 1 byte + 6 padding
};
```

### 🚀 4. Branchless Programming

Les branches (if/else) peuvent être très coûteuses à cause de la prédiction de branche.

```c
// ❌ Avec branche
int max(int a, int b) {
    if (a > b) return a;
    return b;
}

// ✅ Branchless avec bit manipulation
int max(int a, int b) {
    int diff = a - b;
    int mask = diff >> 31;  // -1 si a < b, 0 sinon
    return a - (diff & mask);
}

// ✅ Branchless min/max avec intrinsics
#include <algorithm>
int m = std::max(a, b);  // Le compilateur peut optimiser

// ✅ Branchless abs
int abs_val = (n ^ (n >> 31)) - (n >> 31);

// ✅ Branchless conditionnel
// if (cond) x = a; else x = b;
x = b ^ ((a ^ b) & -cond);  // cond doit être 0 ou 1
```

### 🔢 5. SIMD (Single Instruction Multiple Data)

Traiter 4, 8, 16 ou 32 valeurs en une seule instruction !

```c
#include <immintrin.h>

// Trouver le max dans un tableau avec AVX2 (8 ints à la fois)
__attribute__((target("avx2")))
int find_max_simd(int* arr, int n) {
    __m256i max_vec = _mm256_set1_epi32(INT_MIN);
    
    int i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256i data = _mm256_loadu_si256((__m256i*)(arr + i));
        max_vec = _mm256_max_epi32(max_vec, data);
    }
    
    // Réduction horizontale
    __m128i low = _mm256_castsi256_si128(max_vec);
    __m128i high = _mm256_extracti128_si256(max_vec, 1);
    low = _mm_max_epi32(low, high);
    low = _mm_max_epi32(low, _mm_shuffle_epi32(low, _MM_SHUFFLE(2,3,0,1)));
    low = _mm_max_epi32(low, _mm_shuffle_epi32(low, _MM_SHUFFLE(1,0,3,2)));
    int max_val = _mm_extract_epi32(low, 0);
    
    // Traiter le reste
    for (; i < n; i++) {
        if (arr[i] > max_val) max_val = arr[i];
    }
    
    return max_val;
}
```

**Instructions SIMD utiles :**
- `_mm256_max_epu8` : Max de 32 bytes en parallèle
- `_mm256_cmpeq_epi8` : Comparaison de 32 bytes
- `_mm256_movemask_epi8` : Extraire les bits de signe
- `memchr` : Optimisé SIMD par la libc

### ⚙️ 6. Parsing Ultra-Rapide

```c
// ❌ Lent - strtol avec gestion complète
long val = strtol(str, &endptr, 10);

// ✅ Rapide - Parsing manuel pour entiers positifs
long val = 0;
while (*p >= '0' && *p <= '9') {
    val = val * 10 + (*p++ - '0');
}

// ✅✅ Encore plus rapide - Déroulement de boucle
long val = 0;
while (*p >= '0') {  // Fonctionne car '0'-'9' sont les seuls >= '0' avant ':'
    val = val * 10 + (*p++ - '0');
}
```

### 🔧 7. Optimisations TypeScript/JavaScript

```typescript
// ❌ Lent - Regex pour parsing
const nums = line.match(/\d+/g)?.map(Number);

// ✅ Rapide - Split manuel
const parts = line.split(' ');
const a = parseInt(parts[0], 10);

// ❌ Lent - Array avec push
const arr = [];
for (let i = 0; i < n; i++) arr.push(i);

// ✅ Rapide - Préallocation
const arr = new Array(n);
for (let i = 0; i < n; i++) arr[i] = i;

// ✅✅ Plus rapide - Typed Arrays
const arr = new Int32Array(n);
for (let i = 0; i < n; i++) arr[i] = i;

// ❌ Lent - Objet comme map
const counts: Record<number, number> = {};
counts[key] = (counts[key] || 0) + 1;

// ✅ Rapide - Map native
const counts = new Map<number, number>();
counts.set(key, (counts.get(key) || 0) + 1);

// ❌ Lent - Spread dans les boucles
let result = [];
for (const item of items) result = [...result, transform(item)];

// ✅ Rapide - Push ou map
const result = items.map(transform);

// Utiliser BigInt pour éviter les overflow
const bigNum = BigInt(num);
const result = (bigNum * bigNum) % modBigInt;
```

---

## 📝 JOURNAL DE BORD SCIENTIFIQUE

Pour chaque exercice, crée un fichier `notes/solution-dayXX.md` avec :

```markdown
# Day XX - [Titre du problème]

## Analyse du Problème
- Que demande l'énoncé ?
- Quelles sont les contraintes (taille input, valeurs max) ?
- Quelle complexité est nécessaire ?

## Approches Considérées

### Approche 1 : [Nom]
- **Complexité** : O(?)
- **Description** : ...
- **Avantages** : ...
- **Inconvénients** : ...

### Approche 2 : [Nom]
...

## Solution Choisie
- **Approche** : [Laquelle et pourquoi]
- **Optimisations appliquées** : ...

## Résultats
| Version | Langage | Temps | Notes |
|---------|---------|-------|-------|
| v1 naive | TS | 500ms | |
| v2 optimized | TS | 50ms | HashMap |
| v3 | C | 5ms | SIMD |

## Leçons Apprises
- ...
```

---

## 📁 Structure Workspace

```
gemini/
├── Gemini.md         # Ce fichier
├── data/day00-12/            # Énoncés et inputs (synced from core)
├── notes/                    # Journal de bord et notes
│   └── solution-dayXX.md     # Documentation de chaque solution
├── tools/                    # CLI runner (synced from core)
├── ts/day00-12/              # Solutions TypeScript
└── c/day00-12/               # Solutions C
```

---

## 🛠️ Commandes

```bash
# Exécuter une solution
./tools/aoc run <day> <part>              # Input final
./tools/aoc run <day> <part> --sample     # Sample input
./tools/aoc run <day> <part> --lang c     # Version C

# Vérifier une solution
./tools/aoc check <day> <part>            # Compare vs expected
./tools/aoc check <day> <part> --sample   # Avec sample
```

---

## 📝 Format des Solutions

### TypeScript (`ts/dayXX/part1.ts`)

```typescript
import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    // input = contenu brut du fichier
    // return = réponse en string
    return "42";
  },
};
```

### C (`c/dayXX/part1.c`)

```c
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
```

**Compilation recommandée :**
```bash
clang -O3 -march=native -ffast-math -o part1 part1.c
```

**Analyse assembleur pour optimisation :**
```bash
# Générer le code assembleur avec annotations source
clang -O3 -march=native -ffast-math -S -fverbose-asm -o part1.s part1.c

# Générer l'assembleur au format Intel (plus lisible)
clang -O3 -march=native -ffast-math -S -masm=intel -o part1.s part1.c

# Voir le code désassemblé avec les lignes sources
objdump -d -S -M intel part1 > part1.asm
```

Analyser l'assembleur généré permet de :
- Vérifier que le compilateur a bien vectorisé (SIMD) les boucles
- Détecter les branches inutiles ou mal prédites
- S'assurer que les optimisations attendues sont appliquées
- Identifier les instructions coûteuses (divisions, appels de fonction)

---

## 🔄 Workflow

1. **Lire l'énoncé** dans `data/dayXX/puzzle1.md`
2. **Analyser** les contraintes et la complexité requise
3. **Explorer** les approches mathématiques/algorithmiques
4. **Documenter** dans `notes/solution-dayXX.md`
5. **Implémenter** en TS d'abord (plus rapide à itérer)
6. **Tester** : `./tools/aoc run X 1 --sample`
7. **Optimiser** : Profiler, réduire la complexité
8. **Porter en C** pour les meilleures perfs (avec SIMD si applicable)
9. **Benchmark** : Compare TS vs C

---

## 🏆 Critères de Victoire

1. **Correctness** : La réponse doit être correcte
2. **Performance** : Temps d'exécution minimal (benchmark x100)
3. **Les deux langages** : TS ET C doivent fonctionner

**Pense en assembleur. Pense en mathématiques. Pense en cache.**

**May the fastest algorithm win!** 🚀
