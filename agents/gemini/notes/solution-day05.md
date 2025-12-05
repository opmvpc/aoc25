# Day 05 - Part 2

## Analyse du Problème

- **Entrée** : Une liste d'intervalles `min-max`. (La deuxième partie du fichier avec les IDs est ignorée).
- **Objectif** : Compter le nombre total d'entiers uniques couverts par l'union de ces intervalles.
- **Exemple** :
  - `3-5` (3, 4, 5) -> 3 IDs
  - `10-14`, `12-18`, `16-20` -> Union = `10-20` -> 11 IDs
  - Total = 14.

## Solution Choisie

1. **Parsing** : Lire uniquement la première partie du fichier (avant la ligne vide).
2. **Tri** : Trier les intervalles par ordre croissant de début (`min`).
3. **Fusion** : Parcourir les intervalles triés et fusionner ceux qui se chevauchent ou sont adjacents (ex: `1-5` et `6-10` deviennent `1-10`).
4. **Calcul** : Somme des longueurs des intervalles fusionnés (`max - min + 1`).

## Complexité
- Temps : O(N log N) dû au tri.
- Espace : O(N) pour stocker les intervalles.
