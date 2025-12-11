# Day 11 - Reactor

## Analyse du Problème

- **Input** : Un graphe dirigé de devices, chaque device pointe vers d'autres devices
- **Objectif Part 1** : Compter le nombre de chemins distincts de `you` à `out`
- **Contraintes** : ~600 nœuds, max ~12 outputs par device
- **Type** : Comptage de chemins dans un DAG (Directed Acyclic Graph)

## Approches Considérées

### Approche 1 : DFS Naïf
- **Complexité** : O(nombre de chemins) - potentiellement exponentiel !
- **Description** : Explorer tous les chemins récursivement
- **Inconvénients** : Peut exploser si beaucoup de chemins

### Approche 2 : DP avec Mémoïsation ✓
- **Complexité** : O(V + E) où V = nœuds, E = arêtes
- **Description** : Calculer le nombre de chemins depuis chaque nœud vers `out` une seule fois
- **Formule** : `paths(node) = Σ paths(child)` pour chaque enfant
- **Avantages** : Chaque nœud n'est calculé qu'une fois

## Solution Choisie

**DP avec mémoïsation** - Pour un DAG, le nombre de chemins de A à B est la somme des chemins de chaque successeur de A vers B.

### Algorithme
```
countPaths(node):
    if node == "out": return 1
    if memo[node] exists: return memo[node]
    
    total = 0
    for each output of node:
        total += countPaths(output)
    
    memo[node] = total
    return total
```

### Optimisations C
1. **Hash map compact** : Noms de 3 caractères encodés en 24 bits
2. **DFS itératif** avec pile explicite (évite overflow de stack)
3. **Graphe par indices** au lieu de strings

## Résultats

### Part 1
| Version | Langage | Temps   | Speedup | Notes                  |
|---------|---------|---------|---------|------------------------|
| v1      | TS      | 519µs   | -       | Map + récursion        |
| v2      | TS      | 480µs   | 1.08x   | Micro-optimisations    |
| v3      | C       | 136µs   | 3.8x    | Hash table + DFS itératif |
| **v4**  | **C**   | **50µs**| **10x** | Perfect hash + short indices |

### Part 2
| Version | Langage | Temps   | Speedup | Notes                  |
|---------|---------|---------|---------|------------------------|
| v1      | TS      | 2.06ms  | -       | Map + mémoïsation      |
| v2      | TS      | 1.2ms   | 1.7x    | Separate memos per target |
| v3      | C       | 153µs   | 13x     | Hash table + DFS itératif |
| **v4**  | **C**   | **90µs**| **23x** | Perfect hash + short indices |

## Réponses

- **Part 1** : 634
- **Part 2** : 377452269415704

## Part 2 - Analyse

Le problème demande de compter les chemins de `svr` à `out` qui passent par **dac ET fft**.

**Insight clé** : On décompose en deux cas mutuellement exclusifs :
1. Chemins où on passe par `dac` avant `fft` : `paths(svr→dac) × paths(dac→fft) × paths(fft→out)`
2. Chemins où on passe par `fft` avant `dac` : `paths(svr→fft) × paths(fft→dac) × paths(dac→out)`

Dans notre input : `dac→fft = 0` donc seul le cas 2 contribue !

## Optimisations Clés

### Perfect Hash (26³ = 17576)
Les noms de devices font exactement 3 caractères lowercase. On peut les encoder directement :
```c
hash = (c0-'a') + 26*(c1-'a') + 676*(c2-'a')
```
→ Accès O(1) sans collision, pas de linear probing

### Types compacts
- `short` (2 bytes) au lieu de `int` (4 bytes) pour les indices
- `unsigned char` pour les compteurs d'adjacence
- Meilleure utilisation du cache L1

### Parsing branchless
```c
p += (*p == ' ');  // Équivalent à: if (*p == ' ') p++;
```

## Leçons Apprises

- Les problèmes de comptage de chemins dans un DAG se résolvent efficacement par DP
- La mémoïsation transforme un problème potentiellement exponentiel en O(V+E)
- Pour les chemins passant par des points intermédiaires, on peut décomposer en segments
- Attention au `MAX_EDGES` en C - toujours vérifier les contraintes réelles de l'input
- Un perfect hash est imbattable quand l'espace des clés est petit et connu
- Les TypedArrays en JS ne sont pas toujours plus rapides pour de petits datasets
