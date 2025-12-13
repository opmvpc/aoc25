# Day 12 - Present Placement (Polyomino Fitting)

> Date de resolution : 2025-12-12
> Temps total de developpement : ~30 minutes

## Analyse du Probleme

### Enonce
Determiner combien de regions peuvent contenir tous les presents requis. Les presents sont des polyominos (formes de 7 cellules) qui peuvent etre tournes et retournes.

### Contraintes
- **Taille de l'input** : 1000 regions
- **Valeurs maximales** : Grilles 50x50, ~270 pieces par region
- **Complexite requise** : NP-complet mais avec structure exploitable

### Observations Initiales
- Chaque forme = 7 cellules exactement
- 6 types de formes differentes
- Les pieces peuvent etre tournees (4 rotations) et retournees (2 flips) = jusqu'a 8 orientations uniques

---

## Approches Considerees

### Approche 1 : Brute Force
- **Complexite** : O(positions^pieces) - exponentielle
- **Description** : Placer chaque piece a chaque position possible
- **Avantages** : Simple a implementer
- **Inconvenients** : Trop lent pour 270+ pieces
- **Verdict** : Rejeté

### Approche 2 : Cell Check + Backtracking avec Symmetry Breaking
- **Complexite** : O(1) pour le filtrage, exponentiel avec pruning pour le reste
- **Description** : Filtrer par capacite puis backtracking optimise
- **Insight mathematique** : Si pieces * 7 > area, echec immediat
- **Avantages** : Filtre 48% des regions immediatement
- **Inconvenients** : Toujours theoriquement lent
- **Verdict** : Selectionne

---

## Solution Choisie

### Algorithme

```
1. Parser les formes et precomputer toutes les orientations
2. Pour chaque region:
   a. Cell check: si cells_needed > area, echec
   b. Backtracking avec symmetry breaking:
      - Placer les pieces de meme type en ordre croissant de position
      - Cela evite d'explorer des configurations equivalentes
3. Compter les regions ou le placement reussit
```

### Optimisations Appliquees

#### 1. Cell Count Check
Elimination immediate de ~48% des regions (483/1000) car le nombre de cellules requises depasse la capacite.

#### 2. Symmetry Breaking
Pour des pieces identiques du meme type, forcer le placement en ordre croissant de position (ligne*width + colonne). Reduit exponentiellement l'espace de recherche.

#### 3. Precomputation des Orientations
Toutes les 8 orientations possibles (4 rotations x 2 flips) sont calculees une seule fois au debut, avec deduplication des orientations identiques.

---

## Benchmarks

### Resultats

| Version | Langage | Temps (sample) | Temps (final) | Notes |
|---------|---------|----------------|---------------|-------|
| v1 | TS | 14.45s | 246ms | JS overhead sur sample |
| v1 | C | 778ms | 11.33ms | ~20x plus rapide |

**Reponse:** 517

---

## Lecons Apprises

### Ce qui a bien fonctionne
- L'analyse des donnees a revele que 517 regions passent le cell check ET 517 est la reponse = design intentionnel du puzzle
- Symmetry breaking est critique pour les problemes de placement

### Ce qui aurait pu etre mieux
- J'ai d'abord essaye une approche "fill empty cell" qui ne marche pas quand le grid n'a pas besoin d'etre completement rempli

### Techniques a retenir
- Toujours analyser la distribution des donnees avant d'optimiser
- Pour les problemes de polyominos: precomputer orientations + symmetry breaking

---

## Fichiers

- Solution Part 1 TS : `ts/day12/part1.ts`
- Solution Part 1 C : `c/day12/part1.c`
