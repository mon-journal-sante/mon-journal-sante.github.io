# Spécifications — Phases du cycle menstruel

## 1. Objectif

Définir un modèle de calcul dynamique des quatre phases du cycle menstruel, adapté à toute durée de cycle (court, normal ou long), en s'appuyant sur les données médicales consensuelles.

---

## 2. Principes fondamentaux

### 2.1 Phase lutéale constante

La phase lutéale est **relativement stable** quelle que soit la durée du cycle. Sa durée médiane est de **14 jours** (plage normale : 10–17 jours).

> Conséquence : toute variation de durée du cycle se répercute sur la phase folliculaire, jamais sur la phase lutéale.

### 2.2 Calcul à rebours

Le jour d'ovulation se déduit de la fin du cycle :

```
jour_ovulation = durée_cycle − DUREE_LUTEALE
```

Toutes les autres bornes se calculent **à partir de ce pivot**.

---

## 3. Constantes

| Constante | Valeur par défaut | Plage acceptable | Unité |
|---|---|---|---|
| `DUREE_LUTEALE` | 14 | 10 – 17 | jours |
| `DUREE_MENSTRUATION` | 5 | 3 – 7 | jours |
| `FENETRE_OVULATOIRE` | 3 | 2 – 4 | jours |
| `DUREE_CYCLE_MIN` | 21 | — | jours |
| `DUREE_CYCLE_MAX` | 35 | — | jours |

**Note d'implémentation :**
- `DUREE_LUTEALE` est une vraie constante biologique — hardcodée à 14, jamais dérivée des données.
- `DUREE_MENSTRUATION` est dérivée de la durée moyenne des runs de `jourRegles` dans le journal. Valeur de repli : 5.
- `DUREE_CYCLE` est dérivée de l'intervalle moyen entre deux débuts de run consécutifs. Nécessite au moins 2 cycles de données. Valeur de repli : 28.
- Les cycles hors de la plage [21–35] jours sont hors scope.

---

## 4. Définition des phases

### 4.1 Vue d'ensemble

Le cycle comporte quatre phases séquentielles, sans chevauchement ni trou :

```
|-- menstruelle --|-- folliculaire --|-- ovulatoire --|-- lutéale --|
Jour 1                                                        Jour N
```

### 4.2 Algorithme de calcul

**Entrées :**

- `duree_cycle` : durée totale du cycle en jours (entier, entre `DUREE_CYCLE_MIN` et `DUREE_CYCLE_MAX`)
- `duree_luteale` : durée de la phase lutéale (entier, défaut : `DUREE_LUTEALE`)
- `duree_menstruation` : durée des règles (entier, défaut : `DUREE_MENSTRUATION`)

**Calculs :**

```
jour_ovulation       = duree_cycle − duree_luteale
debut_ovulatoire     = jour_ovulation − 1
fin_ovulatoire       = jour_ovulation + 1
```

**Bornes des phases (jours inclus) :**

| Phase | Début | Fin | Identifiant |
|---|---|---|---|
| Menstruelle | `1` | `duree_menstruation` | `menstruelle` |
| Folliculaire | `duree_menstruation + 1` | `debut_ovulatoire − 1` | `folliculaire` |
| Ovulatoire | `debut_ovulatoire` | `fin_ovulatoire` | `ovulatoire` |
| Lutéale | `fin_ovulatoire + 1` | `duree_cycle` | `luteale` |

### 4.3 Contrainte de cohérence

La phase folliculaire doit avoir une durée ≥ 1 jour. Si le calcul produit une phase folliculaire vide ou négative, le jeu de paramètres est invalide :

```
SI (duree_menstruation + 1) > (debut_ovulatoire − 1)
   → ERREUR : paramètres incohérents
```

---

## 5. Exemples de référence

### 5.1 Cycle normal — 28 jours

```
jour_ovulation   = 28 − 14 = 14
debut_ovulatoire = 13
fin_ovulatoire   = 15
```

| Phase | Jours | Durée |
|---|---|---|
| Menstruelle | 1 – 5 | 5 j |
| Folliculaire | 6 – 12 | 7 j |
| Ovulatoire | 13 – 15 | 3 j |
| Lutéale | 16 – 28 | 13 j |

### 5.2 Cycle court — 21 jours

```
jour_ovulation   = 21 − 14 = 7
debut_ovulatoire = 6
fin_ovulatoire   = 8
```

| Phase | Jours | Durée |
|---|---|---|
| Menstruelle | 1 – 5 | 5 j |
| Folliculaire | 6 – 5 | ⚠️ 0 j |
| Ovulatoire | 6 – 8 | 3 j |
| Lutéale | 9 – 21 | 13 j |

> **Note :** Avec un cycle de 21 jours et 5 jours de règles, la phase folliculaire disparaît. La menstruation peut chevaucher la maturation folliculaire. Deux options :
>
> - **Option A** — Réduire `duree_menstruation` à 3 jours (valeur basse de la plage normale), ce qui libère de la place pour la phase folliculaire.
> - **Option B** — Considérer que la phase folliculaire inclut les derniers jours de menstruation (modèle médical strict, où la phase folliculaire commence à J1).

### 5.3 Cycle long — 35 jours

```
jour_ovulation   = 35 − 14 = 21
debut_ovulatoire = 20
fin_ovulatoire   = 22
```

| Phase | Jours | Durée |
|---|---|---|
| Menstruelle | 1 – 5 | 5 j |
| Folliculaire | 6 – 19 | 14 j |
| Ovulatoire | 20 – 22 | 3 j |
| Lutéale | 23 – 35 | 13 j |

---

## 6. Modèle médical strict vs. modèle simplifié

Le modèle médical reconnaît **deux phases ovariennes** (folliculaire et lutéale), séparées par l'ovulation. La phase folliculaire **inclut** la menstruation (elle commence à J1).

Le modèle ci-dessus est un **modèle simplifié à quatre phases disjointes**, adapté aux interfaces utilisateur (apps de suivi de cycle). Il sépare la menstruation de la phase folliculaire pour offrir un retour visuel distinct à l'utilisatrice.

| Aspect | Modèle médical | Modèle simplifié (ce doc) |
|---|---|---|
| Début phase folliculaire | J1 (premier jour des règles) | Après la fin des règles |
| Phases | 2 ovariennes + ovulation | 4 disjointes |
| Usage | Clinique, recherche | Applications, UI |

---

## 7. Fonction de résolution de phase

Étant donné un `jour_courant` (1 ≤ jour_courant ≤ duree_cycle), retourner l'identifiant de phase :

```
FONCTION get_phase(jour_courant, duree_cycle, duree_luteale, duree_menstruation):

    jour_ovulation   = duree_cycle − duree_luteale
    debut_ovulatoire = jour_ovulation − 1
    fin_ovulatoire   = jour_ovulation + 1

    SI jour_courant < 1 OU jour_courant > duree_cycle:
        → ERREUR : jour hors cycle

    SI jour_courant ≤ duree_menstruation:
        → "menstruelle"

    SI jour_courant < debut_ovulatoire:
        → "folliculaire"

    SI jour_courant ≤ fin_ovulatoire:
        → "ovulatoire"

    → "luteale"
```

---

## 8. Cas limites et validation

| Cas | Comportement attendu |
|---|---|
| `duree_cycle < DUREE_CYCLE_MIN` | Rejet — cycle anormalement court (polyménorrhée) |
| `duree_cycle > DUREE_CYCLE_MAX` | Rejet — cycle anormalement long (oligoménorrhée) |
| `duree_menstruation ≥ jour_ovulation − 1` | Avertissement — phase folliculaire absente, suggérer une réduction de `duree_menstruation` ou un avis médical |
| `duree_luteale < 10` | Avertissement — insuffisance lutéale possible |
| `duree_luteale > 17` | Avertissement — phase lutéale longue, évoquer un test de grossesse ou un bilan hormonal |

---

## 9. Références

- Cleveland Clinic — *Menstrual Cycle: Overview & Phases*
- Cleveland Clinic — *Luteal Phase: Symptoms & Length*
- Cleveland Clinic — *Follicular Phase: Hormone Levels & Length*
- UCSF Center for Reproductive Health — *Normal Menstrual Cycle*
- NCBI / StatPearls — *Proliferative and Follicular Phases of the Menstrual Cycle*
- NCBI / Endotext — *The Normal Menstrual Cycle and the Control of Ovulation*
- Bull et al. (2019) — *Real-world menstrual cycle characteristics of more than 600,000 menstrual cycles*, npj Digital Medicine
