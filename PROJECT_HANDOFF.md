# Maketik — état courant

## Fait
- Application Next.js sur `main`.
- Création de projet : nom → univers → personnage → sources.
- Plusieurs TikTok + une source YouTube par projet.
- Sauvegarde locale, liste, réouverture et suppression des projets.
- Univers et personnage attachés au projet.
- Endpoint `/api/inspect-source` : vérification réelle des liens publics YouTube/TikTok via oEmbed.
- Endpoint `/api/transcribe-youtube` : tentative réelle de récupération des sous-titres YouTube avec `youtube-transcript` 1.3.1, texte nettoyé, nombre de mots, provenance et limites explicites.
- Secours manuel : si la transcription automatique échoue, l’utilisateur peut coller une transcription sans perdre la source d’origine.
- Endpoint `/api/generate-scripts` : génération structurée de profil éditorial + plusieurs scripts originaux via OpenAI Responses API quand `OPENAI_API_KEY` est configurée. Modèle par défaut : `gpt-5.6-luna`, surcharge possible avec `OPENAI_MODEL`.
- La génération interdit explicitement l’imitation d’une voix identifiable et demande de rester fidèle aux faits de la transcription.
- Les scripts ont des états `proposed` / `validated` et une régénération conserve les scripts déjà validés.
- Chaque script conserve angle, hook, texte, durée estimée et faits source utilisés.
- Aperçu vocal gratuit dans le navigateur via Web Speech API.
- Workflow GitHub Actions `.github/workflows/ci.yml` ajouté pour vérifier `npm install` + `npm run build` sur les prochains runs.

## Vérifié
- Tous les changements ci-dessus sont présents sur `main` dans `ludodulac/Maketik`.
- La séparation source → transcription → analyse → scripts → validation est explicite dans les données et l’interface.
- Aucune transcription ni génération IA n’est simulée : les erreurs restent visibles et l’état n’est avancé qu’avec une sortie réelle.

## À vérifier / dépendances externes
- Le workflow GitHub Actions n’a pas encore produit de run visible après sa création ; le build production reste donc à confirmer.
- Déploiement Vercel : aucun espace/projet Vercel n’est exposé par le connecteur de cette session.
- `OPENAI_API_KEY` doit être fournie côté serveur pour activer réellement l’analyse et la génération de scripts.
- La récupération YouTube repose sur une API non officielle et peut être bloquée par YouTube ou par certaines IP serveur.
- Transcription audio TikTok automatique non encore branchée.
- PDF et export MP3 serveur non encore branchés.
- Recherche de références visuelles et génération d’illustrations non encore branchées.

## Prochaine boucle utile
1. Obtenir un build vert et déployer.
2. Ajouter une stratégie robuste de transcription TikTok (automatique quand techniquement possible + secours propre).
3. Ajouter export PDF des scripts validés.
4. Ajouter audio exportable puis pipeline visuel.

## À ne pas refaire
- Ne pas déplacer l’univers ou le personnage au niveau global.
- Ne pas transformer les références TikTok en copie textuelle d’un créateur identifiable.
- Ne pas remplacer silencieusement un script ou élément validé lors d’une régénération.
- Ne jamais afficher « transcription réussie » sans texte réellement extrait.
- Ne pas faire dépendre la conservation du projet d’un fournisseur IA externe.
