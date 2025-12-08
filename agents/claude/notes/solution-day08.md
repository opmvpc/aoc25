# Day 8 - Playground (Junction Boxes)

> Date de resolution : 2025-12-08
> Temps total de developpement : ~15 min

## Analyse du Probleme

### Enonce
Des boites de jonction 3D doivent etre connectees par ordre de distance.
On connecte les 1000 paires les plus proches et on retourne le produit des tailles des 3 plus grands circuits formes.

### Contraintes
- **Taille de l'input** : 1000 points 3D
- **Valeurs maximales** : Coordonnees jusqu'a ~100 000
- **Complexite requise** : O(n^2 log n) acceptable (n=1000 => ~500K paires)

### Observations Initiales
- Probleme similaire a Kruskal's MST mais avec arret apres k connexions
- Union-Find est parfait pour tracker les composantes connexes
- Distance euclidienne -> on peut comparer les carres (evite sqrt)

---

## Approches Considerees

### Approche 1 : Brute Force
- **Complexite** : O(n^2 * k) avec k connexions
- **Description** : Recalculer le min a chaque iteration
- **Verdict** : Rejeté - Trop lent

### Approche 2 : Tri + Union-Find (Kruskal-style)
- **Complexite** : O(n^2 log n) pour tri, O(k * alpha(n)) pour unions
- **Description** :
  1. Generer toutes les paires avec leur distance^2
  2. Trier par distance
  3. Parcourir et union-find les k premieres
- **Insight mathematique** : Union-Find avec path compression = O(alpha(n)) ≈ O(1)
- **Verdict** : Selectionne

### Approche 3 : Partial Sort (nth_element)
- **Complexite** : O(n^2) pour partial sort des k premiers
- **Description** : Ne trier que les k plus petits elements
- **Verdict** : A explorer si tri trop lent

---

## Solution Choisie

### Algorithme

```
1. Parser les n points (x, y, z)
2. Generer toutes les n*(n-1)/2 paires avec dist^2
3. Trier les paires par distance croissante
4. Initialiser Union-Find (parent[i] = i, size[i] = 1)
5. Pour les k premieres paires:
   - Union des deux points
6. Collecter les tailles des circuits (racines du UF)
7. Retourner produit des 3 plus grandes
```

### Optimisations Appliquees

#### 1. Distance au carre
Evite sqrt() couteux - la comparaison d'ordre est preservee.

#### 2. Union-Find avec path compression + union by rank
- Path compression: find() aplatit l'arbre
- Union by rank: garde l'arbre equilibre
- Complexite quasi-constante par operation

#### 3. Typed Arrays (TS)
Int32Array pour parent/rank/size - meilleure cache locality.

#### 4. Parsing manuel (C)
Evite strtol/sscanf - parsing inline des entiers.

---

## Implementation

### TypeScript
Points cles:
- `Int32Array` pour les tableaux Union-Find
- Distance calculee inline sans fonction
- Sort natif de JS (optimise V8)

### C
Points cles:
- Structures compactes (`int16_t` pour indices dans Pair)
- Tableaux globaux statiques (evite malloc/stack overflow)
- `qsort` standard
- Parsing inline des entiers

---

## Benchmarks

### Resultats

| Version | Langage | Temps | Notes |
|---------|---------|-------|-------|
| v1 | TS | 286ms | Implementation standard |
| v1 | C | 68ms | 4x plus rapide |

### Analyse
Le goulot d'etranglement est le tri des ~500K paires.
Le gain C vient de:
- qsort natif tres optimise
- Structures compactes (meilleur cache)
- Pas d'overhead GC

---

## Lecons Apprises

### Ce qui a bien fonctionne
- Union-Find classique = solution elegante
- Eviter sqrt pour les comparaisons

### Techniques a retenir
- Kruskal's algorithm pattern pour "connect k closest"
- Union-Find avec path compression = essentiel

### Ameliorations possibles
- Partial sort (std::nth_element) pour ne pas trier tout
- SIMD pour le calcul des distances en batch
- Radix sort si les distances sont bornees

---

## Part 2

### Difference avec Part 1
- Part 1: connecter les 1000 premieres paires, retourner produit des 3 plus grands circuits
- Part 2: connecter jusqu'a 1 seul circuit (MST complet), retourner produit des X de la derniere paire

### Algorithme Part 2
Kruskal's MST classique:
1. Trier toutes les paires par distance
2. Union-Find jusqu'a `numComponents == 1`
3. Tracker la derniere paire qui a fusionne deux composantes
4. Retourner `X[lastI] * X[lastJ]`

### Resultats Part 2

| Langage | Temps | Reponse |
|---------|-------|---------|
| TS | 286ms | 170629052 |
| C | 69ms | 170629052 |

---

## Fichiers

- Solution Part 1 TS : `ts/day08/part1.ts`
- Solution Part 1 C : `c/day08/part1.c`
- Solution Part 2 TS : `ts/day08/part2.ts`
- Solution Part 2 C : `c/day08/part2.c`
