# Day 10 - Factory

## Analyse du Problème

**Énoncé :** Chaque machine a N lumières (initialement OFF). Chaque bouton toggle un sous-ensemble de lumières. Trouver le **minimum de pressions** pour atteindre le pattern cible.

**Contraintes de l'input :**
- ~200 machines
- Chaque machine : 4-10 lumières, 2-13 boutons
- Max boutons observé : ~13

**Insight clé :** Toggle est une opération XOR !
- `toggle(toggle(x)) = x`
- Chaque bouton n'a que 2 états utiles : pressé 0 ou 1 fois (mod 2)
- C'est un système d'équations linéaires sur **GF(2)** !

## Approches Considérées

### Approche 1 : Brute Force 2^k

- **Complexité** : O(2^k * k) par machine, où k = nombre de boutons
- **Description** : Énumérer toutes les 2^k combinaisons de boutons
- **Avantages** : Simple, garantit l'optimal
- **Inconvénients** : Exponentiel en k (mais k ≤ 13 → 8192 max)

### Approche 2 : Meet-in-the-Middle

- **Complexité** : O(2^(k/2) * k) par machine
- **Description** : Diviser les boutons en 2 groupes, précalculer les XOR possibles, chercher les compléments
- **Avantages** : Racine carrée du brute force
- **Inconvénients** : Plus complexe, overhead de hashmap

### Approche 3 : Gaussian Elimination + Search

- **Complexité** : O(n³) pour la réduction + recherche
- **Description** : Réduire la matrice en forme échelonnée, identifier les variables libres, énumérer
- **Avantages** : Plus efficace si beaucoup de boutons redondants
- **Inconvénients** : Complexité d'implémentation

## Solution Choisie

**Approche 1 (Brute Force)** pour la simplicité et la garantie d'optimalité.
- Avec k ≤ 13 boutons max, 2^13 = 8192 itérations par machine
- 200 machines * 8192 = ~1.6M opérations total
- Les opérations sont des XOR simples sur des bitmasks

**Optimisations :**
1. Représenter chaque bouton comme un bitmask (uint16_t suffit pour n ≤ 16)
2. Le target est aussi un bitmask
3. Utiliser popcount pour compter les bits (nombre de boutons pressés)
4. Parcourir par Gray Code pour minimiser les XOR (1 bit flip par itération)

## Détails Techniques

### Représentation Bitmask
```
Lumières:  [.##.] → target = 0b0110 = 6
Bouton (1,3): toggle bits 1 et 3 → mask = 0b1010 = 10
```

### Gray Code Optimization
Au lieu de parcourir 0→2^k-1 linéairement, utiliser le Gray code :
- `gray(i) = i ^ (i >> 1)`
- Entre gray(i) et gray(i+1), un seul bit change
- On peut maintenir le XOR courant en O(1) au lieu de recalculer

### Early Exit
Si on trouve une solution avec 1 bouton, on peut s'arrêter (optimal).

## Résultats

### Part 1 - XOR/Toggle (GF(2))

| Version | Langage | Temps | Notes |
|---------|---------|-------|-------|
| Gray code + early exit | TS | ~2.8ms | popcount manuel |
| Gray code + early exit | C | ~100µs | __builtin_popcount, __builtin_ctz |

### Part 2 - Integer Linear Programming

| Version | Langage | Temps | Notes |
|---------|---------|-------|-------|
| Gauss + DFS search | TS | ~15ms | Rational arithmetic, dynamic bounds |
| Gauss + DFS search | C | ~1.1ms | Double precision, pruning |

## Leçons Apprises

- **Part 1** : Les problèmes de toggle/XOR se mappent sur l'algèbre linéaire GF(2)
- Gray code permet O(1) XOR update par itération
- Early exit sur 1, 2, 3 pressions accélère énormément (cas communs)

- **Part 2** : C'est un problème d'ILP (Integer Linear Programming)
- Gaussian elimination donne la structure de la solution
- Les variables libres doivent être énumérées avec soin
- Les coefficients fractionnaires dans RREF imposent des contraintes d'intégralité
- Le calcul des bornes dynamiques avec pruning est crucial pour la performance
