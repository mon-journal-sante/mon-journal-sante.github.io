# Mon Journal Santé

PWA de suivi des migraines — React + Vite + TypeScript, hébergée sur GitHub Pages.

## Développement

```bash
npm install
npm run dev      # serveur local sur http://localhost:5173
npm run build    # build de production dans dist/
```

## Déploiement

Chaque push sur `main` déclenche le workflow GitHub Actions qui build et publie sur GitHub Pages. Aucune action manuelle requise.

## Comportement du cache PWA (service worker)

L'application utilise `vite-plugin-pwa` avec `registerType: 'autoUpdate'`. Ce mode installe automatiquement le nouveau service worker en arrière-plan dès qu'une mise à jour est disponible, **mais le nouvel asset n'est activé qu'au prochain rechargement de la page.**

En pratique, après un déploiement :

1. La première visite (ou le premier rechargement) sert encore l'ancienne version depuis le cache.
2. Pendant ce temps, le nouveau service worker se télécharge et s'installe en arrière-plan.
3. Au rechargement suivant, la nouvelle version est active.

**Conséquence pour les tests après un déploiement :** si la page semble ne pas avoir été mise à jour, recharger une deuxième fois suffit dans la plupart des cas. Pour forcer immédiatement la nouvelle version (par exemple en phase de développement), ouvrir les DevTools du navigateur et désinscrire manuellement le service worker via *Application → Service Workers → Unregister*, puis recharger.
