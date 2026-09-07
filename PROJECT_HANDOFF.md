# Maketik — état courant

## Fait
- Application Next.js initialisée sur `main`.
- Parcours Nouveau projet : nom → univers → personnage → sources.
- Plusieurs liens TikTok + une source YouTube par projet dans la V1.
- Sauvegarde des projets dans `localStorage`.
- Accueil listant les projets avec réouverture et suppression.
- Espace projet récapitulant sources et pipeline.
- Aperçu vocal français gratuit via Web Speech API de l'appareil.
- Interface responsive de base.

## Vérifié
- Les fichiers ont bien été écrits sur le dépôt GitHub `ludodulac/Maketik`.
- Le dépôt était vide avant cette première implémentation.

## Non vérifié / non encore branché
- Build de production et déploiement Vercel : le connecteur Vercel disponible dans cette session n'a aucun espace/projet lié et son action de déploiement direct a refusé l'appel sans métadonnées de projet.
- Extraction/transcription TikTok.
- Extraction/transcription YouTube.
- Analyse éditoriale IA.
- Génération des angles/scripts.
- PDF.
- Export MP3 serveur.
- Recherche d'images et génération d'illustrations.

## Prochaine boucle utile
Brancher l'ingestion/transcription et produire un premier script validable à partir des liens réellement saisis, sans casser la création/réouverture des projets.

## À ne pas refaire
- Ne pas déplacer l'univers ou le personnage au niveau global : ils appartiennent au projet.
- Ne pas transformer les références TikTok en copie textuelle d'un créateur identifiable.
- Ne pas remplacer silencieusement un script ou un élément validé lors d'une régénération.
