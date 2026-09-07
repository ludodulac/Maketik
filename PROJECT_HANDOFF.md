# Maketik — état courant

## Fait
- Application Next.js sur `main`.
- Création de projet : nom → univers → personnage → sources.
- Plusieurs TikTok + une source YouTube par projet.
- Sauvegarde locale, liste, réouverture et suppression des projets.
- Univers et personnage attachés au projet.
- Espace projet et pipeline explicite.
- Endpoint serveur `/api/inspect-source` : vérification réelle des liens publics via oEmbed YouTube/TikTok, avec titre/auteur/miniature quand disponibles et erreurs explicites sinon.
- Résultat de vérification enregistré dans le projet.
- Aperçu vocal français gratuit via Web Speech API.

## Vérifié
- Les changements sont présents sur `main` dans `ludodulac/Maketik`.
- L’application distingue explicitement un lien vérifié d’une transcription : aucune transcription n’est simulée.

## Non vérifié / non encore branché
- Build de production et déploiement Vercel : aucun espace Vercel n’est exposé par le connecteur de cette session.
- Extraction/transcription audio TikTok et YouTube.
- Analyse éditoriale IA.
- Génération des angles/scripts.
- PDF et export MP3 serveur.
- Recherche de références visuelles et génération d’illustrations.

## Prochaine boucle utile
Ajouter un vrai moteur de transcription avec provenance, puis seulement débloquer analyse et scripts. Ne jamais faire passer une description oEmbed pour une transcription.

## À ne pas refaire
- Ne pas déplacer l’univers ou le personnage au niveau global.
- Ne pas transformer les références TikTok en copie textuelle d’un créateur identifiable.
- Ne pas remplacer silencieusement un script ou élément validé lors d’une régénération.
- Ne jamais afficher « transcription réussie » sans texte réellement extrait et vérifiable.
