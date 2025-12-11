# Day 11 - Reactor

## Analyse du Problème

- **Objectif Part 1** : Compter le nombre de chemins distincts du noeud `you` vers le noeud `out`.
- **Objectif Part 2** : Compter le nombre de chemins de `svr` à `out` qui passent par **`dac` ET `fft`**.

## Approches Considérées

### Part 2 : Décomposition du problème

Le chemin doit être : `svr` -> ... -> (`dac` ou `fft`) -> ... -> (`fft` ou `dac`) -> ... -> `out`.

Il y a deux cas possibles pour l'ordre de visite de `dac` et `fft` (si le graphe n'a pas de cycles, l'un des ordres est impossible si l'un est prérequis de l'autre, ou les deux sont possibles si ce sont des branches parallèles qui se rejoignent, mais attendez... non).

Dans un DAG, si on doit passer par A et B, l'ordre est imposé par la topologie. Si A peut atteindre B, alors l'ordre est A -> B. Si B peut atteindre A, alors B -> A. Si aucun ne peut atteindre l'autre, alors il n'y a aucun chemin qui passe par les deux (car data "can't flow backwards").

Donc, on peut calculer :
1. Chemins `svr` -> `dac`
2. Chemins `dac` -> `fft`
3. Chemins `fft` -> `out`

Et aussi :
1. Chemins `svr` -> `fft`
2. Chemins `fft` -> `dac`
3. Chemins `dac` -> `out`

Le nombre total de chemins est :
`(chemins(svr->dac) * chemins(dac->fft) * chemins(fft->out)) + (chemins(svr->fft) * chemins(fft->dac) * chemins(dac->out))`

Cependant, comme c'est un DAG, un seul de ces termes sera non-nul (ou zéro si impossible). `dac` ne peut pas être à la fois un ancêtre et un descendant de `fft` sans cycle.

**Algorithme :**
1. Fonction générique `count_paths(start, end)`.
2. Calculer `n1 = count(svr, dac) * count(dac, fft) * count(fft, out)`.
3. Calculer `n2 = count(svr, fft) * count(fft, dac) * count(dac, out)`.
4. Résultat = `n1 + n2`.

Cette approche est très efficace avec la mémoïsation déjà en place.

## Solution Choisie

- **Approche** : Réutilisation de la fonction DFS méméisée `countPaths(u, target)`.
- **Note** : La mémoïsation doit dépendre de la cible (`target`), ou alors on vide le cache entre chaque appel de calcul de segment. Vider le cache est plus simple.

## Résultats

| Version | Langage | Temps | Notes |
| ------- | ------- | ----- | ----- |
| v1      | TS      |       | DFS + Memo segments |
