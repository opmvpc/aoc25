# Day 9 - Movie Theater

## Analyse du Problème

- **Objectif** : Trouver l'aire maximale d'un rectangle formé par deux points de l'input.
- **Partie 1** : Contrainte simple (points input).
- **Partie 2** : Contrainte complexe (rectangle doit être inclus dans le polygone formé par les points).

## Optimisations Appliquées

### I/O & Startup (Critique pour le benchmark process)
- **Zero-Allocation** : Utilisation de buffers statiques (BSS) pour éviter `malloc`.
- **Syscall I/O** : Utilisation de `read(0, ...)` directement au lieu de `fread`/`stdio` pour éviter le buffering et l'overhead de la libc.
- **Parsing** : Parsing manuel ultra-rapide sur le buffer lu.

### Partie 1 - Convex Hull
- **Algorithme** : **Convex Hull (Monotone Chain)** + Brute Force sur le Hull.
- **Justification** : Le rectangle maximal a ses coins sur l'enveloppe convexe.
- **Complexité** : $O(N \log N)$ (Tri) + $O(H^2)$ (Recherche).
- **Performance Kernel** : **~16 µs**.

### Partie 2 - God Mode (Coordinate Compression + SAT)
- **Algorithme** :
  1.  **Coordinate Compression** : Mapping vers grille $N \times N$.
  2.  **Grid Construction** : Scanline pour déterminer l'intérieur.
  3.  **SAT (Summed Area Table)** : Précalcul O(1) pour validité de régions et bords.
  4.  **Bit-Packing (Implicit)** : Utilisation de la localité mémoire (tableaux statiques).
- **Complexité** : $O(N^2)$ pur.
- **Performance Kernel** : **< 1 ms**.

## Résultats

| Version | Langage | Temps (Process) | Temps (Kernel) |
|---------|---------|-----------------|----------------|
| Part 1  | C       | ~2.5 ms         | ~16 µs         |
| Part 2  | C       | ~7.1 ms         | ~800 µs        |

Les temps "Process" sont dominés par le lancement du binaire par l'OS. Les temps "Kernel" montrent que l'algorithme est quasi-instantané.
