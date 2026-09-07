# PROJECT HANDOFF — Maketik

> Document de passation autoritaire pour reprendre le projet dans une nouvelle conversation ChatGPT.
> Dernière mise à jour : 2026-09-08.

## 0. Instruction de reprise pour le prochain ChatGPT

Tu reprends **Maketik**. Ne repars pas de zéro et ne demande pas à l’utilisateur de répéter le contexte.

Avant toute modification :
1. Ouvre le dépôt GitHub `ludodulac/Maketik` et vérifie l’état réel de `main`.
2. Lis `PROJECT_PRINCIPLES.md`, `AI_START_HERE.md` et ce `PROJECT_HANDOFF.md`.
3. Inspecte les fichiers réellement utilisés (`app/page.js`, routes API, `package.json`, workflow CI) avant d’écrire.
4. L’état réel du dépôt et des déploiements prime sur cette passation si quelque chose a changé.
5. Préserve strictement les capacités existantes. Toute addition doit être ciblée et non destructive.
6. L’utilisateur veut que ChatGPT **fasse le travail directement**. Ne lui donne pas une liste d’étapes à effectuer à ta place. Ne le sollicite que pour une autorisation/connexion, un secret, un coût ou une décision produit réellement impossible à prendre seul.
7. Ne prétends jamais qu’un build, une transcription, une génération IA, un audio, une image ou un déploiement fonctionne sans vérification réelle.

## 1. Objectif produit

Maketik est un **studio personnel** de préparation de vidéos courtes. L’utilisateur met tous ses liens directement dans le logiciel.

Boucle cible :

`Projet → univers/personnage → références TikTok → analyse éditoriale → source YouTube → extraction/transcription → angles → plusieurs scripts → validation individuelle → audio → plan visuel → références visuelles → illustrations cohérentes → exports → montage manuel dans CapCut`

Maketik s’arrête avant le montage final. L’utilisateur monte lui-même dans CapCut.

Ce n’est pas un SaaS multi-utilisateur : ne pas ajouter prématurément équipes, facturation, rôles complexes ou architecture lourde.

## 2. Modèle produit à préserver

Le **projet** est l’unité centrale.

Chaque projet possède :
- un nom ;
- un univers graphique ;
- un personnage récurrent ;
- plusieurs références TikTok ;
- une source YouTube dans la V1 actuelle ;
- plusieurs scripts ;
- à terme plusieurs audios et plusieurs séries d’images.

L’univers et le personnage sont **par projet**, jamais globaux.

Les TikTok sont des références pour analyser des mécanismes éditoriaux de haut niveau : hooks, structure, rythme, transitions, longueur des phrases, suspense, densité, humour, relances, etc. Ils ne doivent jamais servir à copier mot pour mot ou imiter étroitement la voix d’un créateur identifiable.

YouTube est la source factuelle : faits, anecdotes, personnes, événements, chiffres, chronologie et matière narrative.

Les scripts produits doivent être originaux et traçables à la matière source.

## 3. Direction visuelle décidée

À la création d’un nouveau projet, l’utilisateur choisit d’abord un univers puis un personnage compatible. Un projet peut avoir un univers/personnage différent d’un autre.

Univers actuellement proposés dans l’interface :
- Chroniqueur animalier
- Petit reporter
- Oiseau enquêteur
- Carnet illustré
- Encyclopédie absurde
- Mini-aventurier
- Théâtre de papier
- Ligne claire décalée

Personnages actuellement présents comme **placeholders symboliques**, pas comme vraies fiches graphiques :
- Bec
- Milo
- Pico
- Nox

Besoin futur important : le logiciel doit proposer de **vraies propositions de personnages visuels** lors de la création d’un projet, puis verrouiller une fiche canonique/character sheet pour garantir la cohérence des illustrations suivantes.

Ne pas copier Lewis Trondheim ni un personnage/style protégé. Les qualités générales recherchées sont simplicité graphique, anthropomorphisme possible, expressivité, économie de ligne et humour visuel.

## 4. Architecture conceptuelle

Toujours garder séparés :

`Source/Evidence → Canonical Model → Derived Analysis → Scripts → Validation → Audio/Visual Outputs`

Ne jamais fusionner vérité source et contenu dérivé.

Préserver provenance, statut, limites et erreurs. Une description oEmbed n’est pas une transcription. Un lien accessible n’est pas une transcription réussie.

Une régénération ne doit jamais écraser silencieusement un script validé ou un autre artefact validé.

## 5. État réel actuellement codé sur `main`

Application Next.js App Router.

### Interface principale — `app/page.js`

Fonctionnalités déjà codées :
- accueil Maketik ;
- création de projet en 4 étapes : Projet → Univers → Personnage → Sources ;
- plusieurs liens TikTok ;
- une URL YouTube ;
- sauvegarde des projets dans `localStorage` ;
- liste, réouverture et suppression des projets ;
- espace projet ;
- pipeline visible ;
- vérification des sources ;
- parcours de transcription ;
- secours permettant de coller manuellement une transcription quand l’automatique échoue ;
- génération de propositions de scripts ;
- profil éditorial séparé ;
- scripts avec état `proposed` ou `validated` ;
- validation individuelle ;
- conservation des scripts déjà validés lors d’une régénération ;
- aperçu de voix française via Web Speech API du navigateur.

### Vérification des sources — `app/api/inspect-source/route.js`

Vérifie réellement les URLs publiques via oEmbed YouTube/TikTok et renvoie quand disponible :
- type de source ;
- URL canonique ;
- titre ;
- auteur ;
- miniature ;
- identifiant YouTube.

La route distingue explicitement métadonnée vérifiée et transcription.

### Transcription YouTube — `app/api/transcribe-youtube/route.js`

Route ajoutée pour tenter une vraie récupération des sous-titres YouTube avec `youtube-transcript`.

Elle doit conserver :
- texte réel ;
- provenance ;
- nombre de mots ;
- limites/erreurs explicites.

Si YouTube bloque ou si aucun sous-titre n’est accessible, l’interface permet une transcription manuelle. Ne jamais remplacer cet échec par un faux texte.

### Génération — `app/api/generate-scripts/route.js`

Route serveur ajoutée pour produire :
- un profil éditorial structuré ;
- plusieurs angles/scripts originaux ;
- hook ;
- texte ;
- durée estimée ;
- faits source utilisés.

Elle utilise l’API OpenAI seulement si une clé serveur existe.

Variables prévues :
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optionnel

Le code actuel a été écrit avec `gpt-5.6-luna` comme valeur par défaut. **Avant de poursuivre cette intégration, vérifier les docs OpenAI actuelles et le nom de modèle réellement disponible ; ne pas supposer que ce choix est correct uniquement parce qu’il apparaît dans cette passation.**

La clé ne doit jamais être exposée côté navigateur ni commitée dans GitHub.

### Dépendances — `package.json`

Le projet contient Next.js/React et `youtube-transcript` a été ajouté pour la transcription YouTube. Vérifier le fichier réel avant tout changement.

### Styles — `app/globals.css`

UI éditoriale beige/noire, responsive de base. Préserver le langage visuel existant sauf raison produit claire.

### Documentation de continuité

Présente dans le dépôt :
- `PROJECT_PRINCIPLES.md`
- `AI_START_HERE.md`
- `PROJECT_HANDOFF.md`

## 6. CI / build

Un workflow `.github/workflows/ci.yml` a été ajouté pour exécuter l’installation puis `npm run build` sur GitHub Actions.

À la dernière vérification, aucun run n’était encore visible. Donc :
- **ne pas dire que le build est vert** ;
- vérifier GitHub Actions dans la nouvelle conversation ;
- s’il échoue, lire les logs, corriger le code et relancer jusqu’au build vert si les outils le permettent.

Il n’y a pas encore de build production confirmé dans cette passation.

## 7. Vercel — état précis du blocage

L’utilisateur a explicitement autorisé l’accès à Vercel et a reconnecté son compte.

Historique :
1. Le connecteur Vercel renvoyait initialement `teams: []`.
2. L’utilisateur a reconnecté Vercel.
3. Lors de la nouvelle tentative dans cette conversation, les outils Vercel ont été rediscoverés mais l’appel a ensuite échoué côté session/connecteur avant qu’un espace/projet puisse être obtenu.

Conclusion : **ce n’est pas un refus de l’utilisateur**. Dans une nouvelle conversation, tenter Vercel immédiatement :
1. lire la skill Vercel/deployment si nécessaire ;
2. `list_teams` ;
3. lister les projets ;
4. chercher un projet Maketik existant ;
5. s’il n’existe pas et que l’outil de déploiement peut créer/lier le projet, le faire ;
6. déployer ;
7. inspecter le résultat et les build logs ;
8. corriger toute erreur réelle ;
9. tester l’URL déployée.

Ne demande pas à l’utilisateur de reconnecter Vercel avant d’avoir réellement tenté les outils dans la nouvelle conversation.

## 8. Voix / audio

Priorité utilisateur : **chercher une solution de voix française masculine gratuite ou quasi gratuite, naturelle et élégante, pour automatiser la narration**.

État actuel : uniquement un aperçu navigateur via Web Speech API. Ce n’est pas un export MP3.

Des pistes Edge TTS serveur ont été étudiées, mais rien n’est encore intégré. Les services gratuits/non officiels peuvent être fragiles. Avant intégration : vérifier maintenance, licence, conditions et fonctionnement réel en 2026.

Architecture souhaitée : abstraction du fournisseur + fallback. La conservation des projets/scripts ne doit jamais dépendre d’un fournisseur vocal.

## 9. Transcription TikTok

Pas encore branchée automatiquement.

Objectif : tenter une extraction/transcription réelle quand techniquement possible, avec provenance et erreur explicite. Prévoir un fallback propre si TikTok bloque l’accès.

Ne jamais annoncer une transcription TikTok réussie sans texte réellement récupéré/transcrit.

## 10. Exports

Pas encore branchés :
- PDF propre pour chaque script validé ;
- MP3/audio serveur ;
- exports d’images ;
- paquet d’assets destiné au montage CapCut.

Le PDF est une prochaine étape utile après build/déploiement et boucle script validée.

## 11. Pipeline visuel futur

Pour chaque passage d’un script :
1. dériver un besoin visuel précis (personne, lieu, objet, événement, époque, architecture, vêtement, véhicule, ambiance, etc.) ;
2. rechercher des références internet précises ;
3. utiliser ces références comme matière documentaire ;
4. générer une illustration nouvelle et cohérente avec l’univers du projet ;
5. préserver le même personnage via la bible visuelle canonique du projet.

Ne pas faire de collage incohérent de sources et ne pas générer vaguement « une image qui va avec ».

## 12. Données et persistance

Actuellement les projets sont conservés dans `localStorage`.

C’est volontairement simple pour le MVP personnel. Ne pas introduire Supabase juste pour faire plus « production ».

Supabase a été étudié mais **aucun projet Supabase n’a été créé ni branché**. Si un besoin réel de persistance cloud apparaît, réévaluer alors la solution.

## 13. Règles de non-régression

Avant chaque modification demander : « quelle capacité existante ce changement pourrait casser ? » puis vérifier cette capacité.

En particulier :
- ne pas casser création/réouverture/suppression de projet ;
- ne pas déplacer univers/personnage au niveau global ;
- ne pas perdre les URLs sources ;
- ne pas confondre source vérifiée et transcription ;
- ne pas écraser les scripts validés ;
- ne pas avancer artificiellement un statut ;
- ne pas prétendre qu’une fonction externe marche sans test ;
- ne pas exposer de secret client ;
- ne pas transformer les références TikTok en imitation d’un créateur.

## 14. Ordre recommandé de reprise

### Priorité 1 — réalité technique
- Vérifier `main` et les derniers commits.
- Vérifier le workflow GitHub Actions et obtenir un build vert.
- Reprendre la connexion Vercel et déployer Maketik.
- Tester réellement la page et les routes déployées.

### Priorité 2 — première boucle produit complète
- Tester une vraie URL YouTube dans l’application.
- Confirmer transcription ou fallback manuel.
- Brancher/configurer proprement le fournisseur IA côté serveur.
- Générer plusieurs scripts à partir d’une vraie transcription.
- Valider un script et confirmer qu’une régénération ne l’écrase pas.

### Priorité 3 — production d’assets
- PDF du script validé.
- voix française automatisée + export audio.
- transcription/références TikTok plus robuste.
- bible visuelle canonique et vraies propositions de personnages.
- plan visuel, recherche de références, illustrations cohérentes.
- exports prêts pour CapCut.

## 15. Ce que l’utilisateur attend de la prochaine conversation

Il ne veut pas une nouvelle séance de brainstorming ni une explication de ce qu’il pourrait faire.

Il veut pouvoir dire en substance : **« reprends Maketik »**, puis que ChatGPT :
- lise cette passation ;
- inspecte GitHub ;
- tente Vercel ;
- corrige le build ;
- déploie ;
- poursuive le produit de manière autonome ;
- rende compte uniquement de ce qui est réellement fait/vérifié et des rares blocages qui nécessitent son intervention.

## 16. Principe directeur

> Ne jamais améliorer artificiellement un indicateur, une interface ou une architecture en affaiblissant la vérité, la garantie ou une capacité réelle qu’ils sont censés servir.

Questions permanentes :
- Qu’est-ce qui est vrai ?
- Qu’est-ce qui est permis ?
- Qu’est-ce qui est préférable ?
- Qu’est-ce qui est réellement vérifié ?
- Quelle est la prochaine action utile sans casser ce qui fonctionne ?
