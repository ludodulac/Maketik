# Maketik — carte de navigation

Commencer par `AI_START_HERE.md`, puis `PROJECT_PRINCIPLES.md`. `PROJECT_HANDOFF.md` est volumineux : ne le charger que si l'état opérationnel détaillé est réellement nécessaire.

## Pipeline conceptuel

`projet → sources → transcription/extraction → analyse des références TikTok → matière factuelle YouTube/source → scripts originaux → validation utilisateur → audio → visuels → exports`

Chaque couche doit rester identifiable. Une sortie dérivée ne devient pas la source canonique de la couche précédente.

## Routage

- Règles durables / identité du produit → `PROJECT_PRINCIPLES.md`.
- État détaillé d'une passe en cours → section pertinente de `PROJECT_HANDOFF.md`, puis code/fichiers réels.
- Application → `app/` et `lib/` concernés.
- Vérification/outillage → scripts et workflows réellement utilisés.

## Invariants

- scripts originaux même lorsque les références éditoriales viennent de TikTok ;
- sources factuelles distinctes des références de forme ;
- validation utilisateur préservée avant les couches dépendantes ;
- capacités absentes ou dégradées annoncées honnêtement ;
- ne pas réintroduire Vercel comme infrastructure supposée sans décision explicite ;
- ne pas lancer un travail visuel coûteux sur un script non validé.
