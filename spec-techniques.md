# Spécifications Techniques — Journal de Suivi des Migraines
**Version** : 1.0  
**Date** : Avril 2026

---

## 1. Stack Technique

| Composant | Choix |
|-----------|-------|
| Framework | React + Vite + TypeScript |
| PWA | vite-plugin-pwa |
| Styles | Tailwind CSS |
| Stockage local | IndexedDB via `idb` (journal) + localStorage (clé API, paramètres) |
| API Claude | Anthropic API `v1/messages` — modèle `claude-haiku-4-5-20251001` |
| Export JSON | Génération côté client (Blob + download) |
| Appareil photo | `<input type="file" accept="image/*" capture="environment">` |
| Hébergement | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 2. Hébergement et Déploiement

### 2.1 URLs

- **Dépôt** : https://github.com/mon-journal-sante/mon-journal-sante.github.io
- **URL de production** : https://mon-journal-sante.github.io/

Le dépôt suit la convention `<organisation>.github.io` : GitHub Pages sert l'application à la racine (`/`), sans sous-répertoire.

### 2.2 Activer GitHub Pages

Dans les paramètres du dépôt GitHub :  
`Settings → Pages → Source → GitHub Actions`

### 2.3 Workflow GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 3. Configuration Vite

```ts
// vite.config.ts
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mon Journal Santé',
        short_name: 'Journal',
        lang: 'fr',
        theme_color: '#8B7CF8',
        background_color: '#F9F8FF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

---

## 4. Thème Visuel

Mode clair uniquement (pas de dark mode pour le MVP).

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg` | `#F9F8FF` | Fond de l'application |
| `surface` | `#FFFFFF` | Cartes, modales |
| `primary` | `#8B7CF8` | Accent principal, boutons |
| `primary-dark` | `#7C6CF6` | Hover/focus |
| `text` | `#18181B` | Texte principal |
| `text-muted` | `#6B7280` | Labels secondaires |
| `border` | `#EDE9FE` | Séparateurs, bordures |
| `success` | `#10B981` | Confirmation, icône sans migraine |
| `danger` | `#EF4444` | Erreurs, migraine présente |

---

## 5. Assets PWA

### 5.1 Icône placeholder (SVG source)

Fichier `public/icon.svg` — journal avec une ligne de suivi (style ECG) :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#8B7CF8"/>
  <rect x="148" y="128" width="220" height="272" rx="16" fill="white" opacity="0.95"/>
  <rect x="148" y="128" width="30" height="272" rx="10" fill="#7C6CF6"/>
  <polyline
    points="200,268 222,268 242,210 264,322 284,232 302,284 318,268 346,268"
    fill="none" stroke="#8B7CF8" stroke-width="12"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Les fichiers `icon-192.png` et `icon-512.png` sont générés depuis ce SVG (ex. avec `sharp` ou Squoosh) et placés dans `public/`.

---

## 6. API Claude

### 6.1 Appel depuis le navigateur

L'API Anthropic est appelée directement depuis le navigateur. Cela requiert l'en-tête :

```
anthropic-dangerous-direct-browser-access: true
```

### 6.2 Modèle et prompt

- Modèle : `claude-haiku-4-5-20251001`
- Prompt système :  
  *"Tu es un assistant nutritionnel. Identifie tous les aliments visibles dans cette photo de repas. Réponds uniquement en JSON avec un tableau `aliments` contenant les noms en français. Sois précis et exhaustif."*

### 6.3 Stockage de la clé API

- Clé localStorage : `claude_api_key`
- URL d'appel : `https://api.anthropic.com/v1/messages`
- La clé n'est jamais incluse dans le code source ni dans le dépôt

---

## 7. Schéma de Données

### 7.1 IndexedDB — base `journal-sante`, store `entries`

Clé primaire : `date` (string ISO `YYYY-MM-DD`)

```ts
interface JournalEntry {
  date: string;

  // Sommeil
  heureCoucher?: string;        // "HH:MM"
  heureLever?: string;
  fenetreOuverte?: boolean;
  symptolesReveil?: boolean;

  // Repas
  repas: Repas[];

  // Hydratation
  nbVerresEau: number;

  // Symptômes
  migraine?: boolean;
  migraineAuReveil?: boolean;
  heureApparitionMigraine?: string;
  heureDisparitionMigraine?: string;
  intensiteMigraine?: number;     // 0–10
  localisationMigraine?: string[];
  nausees?: boolean;
  migraineSoulageeParRepas?: boolean;

  temperature?: number;        // °C, 35–42

  // Cycle
  jourRegles?: boolean;

  // Notes
  notesLibres?: string;
}

interface Repas {
  categorie: 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation';
  heure: string;
  aliments: string[];
  note?: string;
}
```

### 7.2 localStorage

| Clé | Type | Contenu |
|-----|------|---------|
| `claude_api_key` | string | Clé API Anthropic saisie par l'utilisatrice |
| `settings` | JSON | Paramètres de l'application (inclus dans l'export JSON) |
