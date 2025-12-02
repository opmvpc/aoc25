# 🎓 Cours Magistral pour Hadopire : Les Secrets du Jour 2

Wesh Hadopire ! 👋

Tu t'es demandé comment on a plié le Jour 2 en quelques microsecondes alors que les plages d'ID faisaient des milliards de large ? Installe-toi, prends un café (ou un Monster), je vais t'expliquer la magie noire derrière l'algo. 🧙‍♂️✨

## 🚫 Le Piège des Boucles (La méthode "Noob")

L'erreur classique ici, c'est de se dire :
"Vas-y, je fais une boucle `for (i = min; i <= max; i++)` et je vérifie chaque nombre."

**Pourquoi ça casse ?**
Regarde cet input : `1188511880-1188511890`.
C'est petit. Mais imagine une plage du style `1-10000000000`.
Si tu itères, ton PC va chauffer pour rien. On est sur des complexités en **O(N)** où N est la taille de la plage. C'est beaucoup trop lent pour gagner la Battle Royale.

## ⚡ Le Secret : O(log N) ou O(1)

L'astuce de "PGM", c'est de ne jamais itérer. On utilise les **maths**.
Au lieu de compter entre A et B, on calcule :

```
Count(A, B) = Solve(B) - Solve(A - 1)
```

Où `Solve(X)` compte tous les nombres valides entre 0 et X.
C'est beaucoup plus simple de compter de 0 à X.

---

## 🧩 Partie 1 : La Répétition Simple

**Définition :** Un nombre est valide s'il est formé d'une séquence répétée **exactement deux fois**.
Exemple : `123123` (séquence `123` répétée 2 fois).

### L'Analyse Mathématique
Un nombre `XYXY` (où X, Y sont des chiffres) peut s'écrire mathématiquement.
Prenons `1212` (séquence `12` de longueur `L=2`).
C'est `12` suivi de `12`.
On peut écrire ça comme :
`1212 = 12 * 100 + 12 = 12 * (10^2 + 1)`

Généralisation :
Pour une séquence `S` (qui est un nombre) de longueur `L` (nombre de chiffres de `S`), le nombre complet `N` (qui est `S` répété 2 fois) vaut :
```
N = S * (10^L + 1)
```

### L'Algorithme
Pour `Solve(Limit)` (qui compte les IDs valides jusqu'à `Limit`) :
1. On itère sur la longueur de la séquence `S`, notée `L` (de 1 à environ 9, car les IDs max fit dans un entier 64-bit).
2. Le "Multiplicateur" est `M = (10^L + 1)`.
3. On cherche combien de valeurs `S` existent telles que `S * M <= Limit`.
4. C'est une simple division entière : `MaxS = Limit / M`.
5. On fait attention aux bornes de `S` (par exemple, pour `L=3`, `S` doit être entre `100` et `999` pour éviter les zéros en tête comme `012` qui donnerait `012012`).
6. On additionne le tout.

**Complexité :** On fait environ 9 itérations (pour L=1 à L=9). C'est instantané. ⚡

---

## 🤯 Partie 2 : Le Boss Final (Inclusion-Exclusion)

**Définition :** Un nombre est valide s'il est formé d'une séquence répétée **au moins deux fois**.
Exemple : `123123` (séquence `123` répétée 2 fois), `121212` (séquence `12` répétée 3 fois), `1111` (séquence `1` répétée 4 fois).

### Le Problème du "Double Compte" ⚠️
C'est là que ça devient technique.
Prenons le nombre `111111` (6 fois '1').
- C'est la séquence `1` répétée 6 fois (période de longueur 1).
- C'est la séquence `11` répétée 3 fois (période de longueur 2).
- C'est la séquence `111` répétée 2 fois (période de longueur 3).

Si on additionne bêtement toutes les répétitions, on va compter `111111` trois fois ! On ne veut compter chaque ID valide qu'une seule fois.

### La Solution : Principe d'Inclusion-Exclusion 🧠

Pour une longueur totale du nombre `N`, disons `len` (par exemple `len=6` pour `111111`).
Un nombre est "périodique" s'il est formé par la répétition d'un bloc de taille `p`, où `p` est un diviseur de `len` et `p < len`.
On veut compter l'UNION de tous ces ensembles de nombres périodiques.

**La formule générale pour l'union de plusieurs ensembles :**
```
Count(A ou B) = Count(A) + Count(B) - Count(A et B)
```
Et ça se généralise pour 3 ensembles, 4, etc., avec des alternances de signes.

**Comment ça s'applique ici ?**
1. On prend la longueur totale du nombre `len`.
2. On trouve les **facteurs premiers uniques** de `len`. (Ex: pour `len=6`, les facteurs premiers uniques sont `2` et `3`).
3. Pour chaque facteur premier `q`, on considère les nombres formés par la répétition d'un bloc de longueur `len / q`.
   - Pour `len=6` et `q=2`, on considère les nombres faits de blocs de `6/2 = 3` chiffres (Ex: `123123`).
   - Pour `len=6` et `q=3`, on considère les nombres faits de blocs de `6/3 = 2` chiffres (Ex: `121212`).
4. On applique le principe d'Inclusion-Exclusion sur ces types de répétitions :
   - On **ajoute** les sommes des nombres générés par `len/2` et `len/3`.
   - On **retire** les sommes des nombres générés par `len / (LCM(2,3))` c'est-à-dire `len/6 = 1` (les `111111`, `222222` etc.).

### L'Implémentation "Brutale" (mais rapide !)
Pour chaque longueur `len` possible (de 2 à environ 18-19, car le max ID a 19 chiffres) :
1. On récupère les facteurs premiers *uniques* de `len`.
2. On génère toutes les combinaisons de ces facteurs premiers (via un parcours de bits).
3. Pour chaque combinaison (appelée "subset" ou "sous-ensemble") :
   - On calcule le `LCM` (plus petit commun multiple) de ces facteurs premiers.
   - On détermine la "longueur du bloc" `p = len / LCM`.
   - On calcule la somme des IDs périodiques avec cette longueur de bloc `p` (avec la même logique que la Partie 1, mais le multiplicateur `M` est plus complexe : `M = 1 + 10^p + 10^(2p) + ...`).
   - Si le nombre de facteurs premiers dans notre combinaison est **impair**, on **ajoute** cette somme au total.
   - Si le nombre de facteurs premiers dans notre combinaison est **pair**, on **soustrait** cette somme au total.

```typescript
// Pseudo-code simplifié pour calcSumForLen(len, limit)
function calcSumForLen(len, limit) {
  // factors = [q1, q2, ...] facteurs premiers uniques de len
  let sumForLen = 0;
  // Itérer sur toutes les combinaisons (subsets) de ces facteurs premiers
  for (chaque combinaison de facteurs) {
    let lcm_des_facteurs_combines = calculer_lcm(combinaison);
    let longueur_du_bloc = len / lcm_des_facteurs_combines;
    let somme_pour_ce_bloc = calculer_somme_periodique(len, longueur_du_bloc, limit);

    if (combinaison.size est impair) {
      sumForLen += somme_pour_ce_bloc;
    } else {
      sumForLen -= somme_pour_ce_bloc;
    }
  }
  return sumForLen;
}

// Fonction auxiliaire pour calculer la somme des IDs avec un bloc de longueur 'p'
// (similaire à la logique de Partie 1)
function calculer_somme_periodique(len, p, limit) {
  // Construire le multiplicateur M = 1 + 10^p + 10^(2p) + ... + 10^((len/p - 1)*p)
  // min_X = 10^(p-1)
  // max_X = 10^p - 1
  // Trouver combien de X * M <= limit
  // Somme arithmétique des X * M
  // ...
  return result;
}
```

## 🏆 Résultat des Courses

- **Complexité :** O(Log(Limit) * (nombre de facteurs premiers de Log(Limit)) * 2^(nombre de facteurs premiers de Log(Limit))).
  Comme le nombre de chiffres `Log(Limit)` est petit (max ~19), et le nombre de facteurs premiers de 19 est très petit, c'est extrêmement efficace.
- **Temps :** Moins d'une milliseconde pour les deux parties combinées.
- **Style :** Imbattable.

Voilà Hadopire, c'est comme ça qu'on passe de "ça va prendre 3 jours à calculer" à "c'est prêt avant que tu aies relâché la touche Entrée". 😉

*Signé : Ton agent IA préféré.*
