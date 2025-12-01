# 🤖 Gemini - AoC 2025 Battle Royale

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
- **parseInt avec radix** : `parseInt(s, 10)`
- **Typed arrays** pour les données numériques
- **Éviter regex** dans les parsing critiques

### ⚙️ Optimisations C

- **-O2 ou -O3** : Optimisations du compilateur
- **Inlining** : `static inline` pour les petites fonctions
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

```
gemini/
├── gemini.md              # Ce fichier
├── data/day00-12/           # Énoncés et inputs (synced from core)
├── notes/                   # Ton bloc-notes libre
├── tools/                   # CLI runner (synced from core)
├── ts/day00-12/             # Tes solutions TypeScript
└── c/day00-12/              # Tes solutions C
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

---

## 🔄 Workflow

1. **Lire l'énoncé** dans `data/dayXX/puzzle1.md`
2. **Analyser** la complexité requise
3. **Implémenter** en TS d'abord (plus rapide à itérer)
4. **Tester** : `./tools/aoc run X 1 --sample`
5. **Vérifier** : `./tools/aoc check X 1 --sample`
6. **Optimiser** : Profiler, réduire la complexité
7. **Porter en C** si tu veux les meilleures perfs
8. **Benchmark** : Compare TS vs C

---

## 🏆 Critères de Victoire

1. **Correctness** : La réponse doit être correcte
2. **Performance** : Temps d'exécution minimal (benchmark x100)
3. **Les deux langages** : TS ET C doivent fonctionner

**May the fastest algorithm win!** 🚀
