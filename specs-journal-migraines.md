# Spécifications Fonctionnelles — Journal de Suivi des Migraines
**Application PWA — Android — Français**  
**Version** : 1.2  
**Date** : Avril 2026

---

## 1. Contexte et Objectif

L'utilisatrice souffre de migraines et nausées récurrentes chaque mois. L'objectif de cette application est de **tracer quotidiennement tous les facteurs susceptibles d'influencer ces symptômes** afin d'identifier des corrélations et d'apporter des données objectives à son médecin.

Facteurs suspectés à ce stade : hypoglycémie, intolérance alimentaire (histamine, sulfites), qualité du sommeil, cycle menstruel, hydratation.

---

## 2. Type d'Application

- **PWA (Progressive Web App)** installable sur Android
- **Stockage local uniquement** — aucune donnée envoyée sur un serveur
- **Langue** : Français uniquement
- **Identification des aliments par photo** via l'API Claude (voir section 10)

---

## 3. Structure de l'Application

### Navigation principale (barre en bas)

| Icône | Écran |
|-------|-------|
| 📅 | Aujourd'hui (saisie quotidienne) |
| 📖 | Historique (consulter les jours passés) |
| 📊 | Corrélations (analyse automatique) |
| ⚙️ | Paramètres |

---

## 4. Écran "Aujourd'hui" — Saisie Quotidienne

L'écran principal est divisé en sections. L'utilisatrice remplit ce qu'elle peut, quand elle peut. Aucun champ n'est obligatoire.

---

### 4.1 Section Sommeil

| Champ | Type | Détail |
|-------|------|--------|
| Heure de coucher | Sélecteur heure | Heure HH:MM |
| Heure de lever | Sélecteur heure | Heure HH:MM |
| Durée calculée automatiquement | Affichage | Ex : "7h30 de sommeil" |
| Fenêtre ouverte cette nuit ? | Bouton toggle Oui / Non | — |
| Symptômes présents dès le réveil ? | Bouton toggle Oui / Non | Si Oui → afficher sous-section Symptômes directement |

---

### 4.2 Section Repas

L'utilisatrice peut ajouter autant de repas que nécessaire dans la journée.

**Pour chaque repas :**

| Champ | Type | Détail |
|-------|------|--------|
| Catégorie | Sélecteur | Petit-déjeuner / Déjeuner / Dîner / Collation |
| Heure | Sélecteur heure | HH:MM — pré-remplie avec l'heure actuelle |
| Photo | Bouton appareil photo | Ouvre la caméra Android |
| Identification automatique | Appel API Claude | Après prise de photo, Claude identifie les aliments visibles |
| Liste des aliments identifiés | Affichage modifiable | L'utilisatrice peut corriger / compléter la liste |
| Note libre | Champ texte optionnel | Ex : "J'ai mangé très vite", "repas copieux" |

**Comportement de l'identification photo :**
- Après capture, afficher un indicateur de chargement
- Afficher la liste retournée sous forme de tags modifiables
- En cas d'échec API : permettre la saisie manuelle

---

### 4.3 Section Hydratation

| Champ | Type | Détail |
|-------|------|--------|
| Nombre de verres d'eau | Compteur + / − | Valeur entière, minimum 0 |

---

### 4.4 Section Symptômes

| Champ | Type | Détail |
|-------|------|--------|
| Température (°C) | Champ numérique | Ex : 37.5 — min 35, max 42, pas 0.1 |
| Migraine aujourd'hui ? | Toggle Oui / Non | Si Non → section réduite |
| Présente dès le réveil ? | Toggle Oui / Non | Visible seulement si Migraine = Oui |
| Heure d'apparition | Sélecteur heure | Visible si Migraine = Oui et pas dès le réveil |
| Heure de disparition | Sélecteur heure | Optionnel — si la migraine est passée |
| Intensité | Curseur 0 à 10 | Affiché avec valeur numérique |
| Localisation | Sélection multiple | Front / Tempes / Derrière les yeux / Nuque / Diffus / Autre |
| Nausées ? | Toggle Oui / Non | — |
| Migraine soulagée par un repas ? | Toggle Oui / Non | Champ clé pour la piste hypoglycémie |

---

### 4.5 Section Cycle Menstruel

| Champ | Type | Détail |
|-------|------|--------|
| Jour de règles ? | Toggle Oui / Non | — |

Le jour du cycle n'est pas affiché dans la saisie quotidienne. Il est calculé dynamiquement dans l'écran Corrélations à partir des runs de jours de règles enregistrés dans le journal (voir section 6).

---

### 4.6 Section Notes Libres

Champ texte libre pour tout ce qui ne rentre pas dans les cases : stress exceptionnel, médicament pris, activité physique, événement particulier, etc.

---

### 4.7 Bouton "Enregistrer la journée"

- Sauvegarde toutes les données du jour en local
- Confirmation visuelle (toast ou animation)
- Si une entrée existe déjà pour ce jour → proposer de modifier ou d'ajouter

---

## 5. Écran "Historique"

- Liste des jours enregistrés, du plus récent au plus ancien
- Chaque entrée affiche : date, icône migraine (✅ ou ❌), intensité si applicable, icône nausées
- Clic sur un jour → vue détaillée de toutes les données saisies ce jour-là
- Possibilité de modifier une entrée passée

---

## 6. Écran "Corrélations"

Analyse automatique des données sur les 30 derniers jours minimum (ou depuis le début si moins de données).

### Corrélations calculées

| Corrélation | Description |
|-------------|-------------|
| Aliments fréquents les jours de migraine | Liste des aliments qui apparaissent le plus souvent dans les repas précédant une migraine |
| Migraine soulagée par repas | % de fois où manger a soulagé la migraine |
| Lien avec le sommeil | Durée moyenne de sommeil les nuits avant migraine vs sans migraine |
| Fenêtre ouverte / fermée | Fréquence de migraine selon fenêtre ouverte ou fermée |
| Hydratation | Nombre moyen de verres les jours avec / sans migraine |
| Cycle menstruel | Jours du cycle où les migraines sont les plus fréquentes |
| Symptômes au réveil | % de migraines présentes dès le réveil |

### Affichage

- Texte simple et lisible : *"Tu as eu une migraine 8 fois sur 10 après avoir mangé des œufs"*
- Pas de graphiques (non demandé)
- Message si données insuffisantes : *"Continue à remplir ton journal, les corrélations apparaîtront après 2 semaines de données"*

---

## 7. Sauvegarde / Restauration (JSON)

Accessible depuis l'écran Paramètres (carte "Sauvegarde / Restauration").

### Export

**Bouton : "Exporter mes données et configuration (JSON)"**

Génère un fichier JSON téléchargeable contenant :

```ts
{
  version: 1,
  exportDate: string,       // YYYY-MM-DD
  config: {
    claude_api_key?: string,
    settings?: unknown,
  },
  entries: JournalEntry[],
}
```

- Nom du fichier : `journal-sante-AAAA-MM-JJ.json`
- Téléchargement direct sur l'appareil
- ⚠️ Ce fichier contient la clé API — ne pas partager

### Import

**Bouton : "Importer mes données et configuration"**

- Ouvre le sélecteur de fichier (`.json` uniquement)
- Validation : `version === 1` et `entries` est un tableau ; message d'erreur si invalide
- Demande confirmation avant d'écraser les données existantes
- Efface IndexedDB, réimporte toutes les entrées, restaure `claude_api_key` et `settings` depuis `config`
- Recharge la page après import réussi

---

## 8. Notifications

Fonctionnalité abandonnée. L'API Web ne permet pas de déclencher une notification à une heure précise sans serveur push. L'application est hébergée statiquement sur GitHub Pages — ajouter un serveur contredit la contrainte de confidentialité (stockage local uniquement).

---

## 9. Écran Paramètres

| Paramètre | Type | Détail |
|-----------|------|--------|
| **Clé API Claude** | Champ texte (masqué) | Saisie manuelle par l'utilisatrice — voir section 10 |
| Exporter les données JSON | Bouton | — |
| Importer les données JSON | Bouton | — |
| Effacer toutes les données | Bouton (avec confirmation) | Action irréversible |

---

## 10. Gestion de la Clé API Claude

L'application est hébergée publiquement. Pour éviter d'exposer une clé API dans le code source, **l'utilisatrice saisit elle-même sa clé API** dans les Paramètres.

**Comportement :**
- Si aucune clé n'est renseignée → afficher un bandeau dans les Paramètres : *"Pour activer l'identification des aliments par photo, renseignez votre clé API Claude dans les paramètres."*
- La clé est masquée dans le champ (type password) avec un bouton "afficher/masquer"
- Si la clé est absente ou invalide lors d'une prise de photo → message d'erreur clair + saisie manuelle des aliments proposée
- Lien d'aide : *"Obtenir une clé API sur console.anthropic.com"*

**Coût estimé :** pour un usage typique de 3 photos par jour, moins de **0,15 $ par mois**.

---

## 11. Confidentialité

- Aucune donnée personnelle n'est envoyée sur un serveur, sauf les photos de repas transmises à l'API Claude pour identification (données éphémères, non conservées au-delà du traitement)
- La clé API n'est jamais incluse dans le code source ni dans le dépôt GitHub
- Toutes les données du journal restent sur l'appareil de l'utilisatrice
- Le dépôt GitHub peut rester public sans risque de fuite de données personnelles

---

## 12. Priorités de Développement (MVP)

| Priorité | Fonctionnalité |
|----------|---------------|
| 🔴 P1 | Saisie quotidienne complète (sommeil, repas, symptômes, cycle) |
| 🔴 P1 | Stockage local |
| 🔴 P1 | Saisie et stockage de la clé API dans les Paramètres |
| 🔴 P1 | Identification des aliments par photo (API Claude) |
| 🔴 P1 | Déploiement GitHub Pages + GitHub Actions |
| 🟠 P2 | Historique consultable et modifiable |
| 🟠 P2 | Export CSV |
| 🟡 P3 | Corrélations automatiques |
