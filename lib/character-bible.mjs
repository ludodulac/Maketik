const CHARACTER_DEFAULTS={
  bec:{name:'Bec',identityAnchor:'Petit enquêteur à bec très lisible, posture curieuse et regard précis.',silhouette:'Tête légèrement dominante, bec triangulaire, petit corps compact, jambes fines.',face:'Deux yeux simples et très lisibles ; expression portée surtout par l’angle des yeux et du bec.',proportions:'Tête 40 %, torse compact, membres courts ; silhouette reconnaissable même en petit.',clothing:'Tenue sobre d’enquêteur sans marque ni motif complexe.',props:'Carnet ou petit crayon uniquement quand le plan le justifie.',expressions:'Curieux, sceptique, surpris, concentré, satisfait.',forbidden:'Ne pas changer la forme du bec, la proportion tête/corps ou le nombre d’éléments du visage.'},
  milo:{name:'Milo',identityAnchor:'Observateur calme à grosse tête ronde et petit corps stable.',silhouette:'Tête ronde dominante, épaules étroites, jambes courtes, posture posée.',face:'Yeux ronds simples, bouche minimale, sourcils discrets.',proportions:'Tête 45 %, corps compact, bras courts.',clothing:'Vêtements simples sans marque, une seule couche principale.',props:'Loupe ou carnet ponctuel.',expressions:'Calme, malin, attentif, perplexe, amusé.',forbidden:'Ne pas allonger le visage ni complexifier les yeux.'},
  pico:{name:'Pico',identityAnchor:'Petit personnage vif, légèrement anguleux, toujours très lisible.',silhouette:'Tête anguleuse, corps léger, posture dynamique.',face:'Un ou deux signes faciaux simples avec grande lisibilité.',proportions:'Tête 40 %, corps étroit, membres fins.',clothing:'Tenue minimale adaptée au contexte.',props:'Petit sac ou objet contextuel ponctuel.',expressions:'Étonné, vif, inquiet, enthousiaste, curieux.',forbidden:'Ne pas arrondir complètement la silhouette ni multiplier les accessoires.'},
  nox:{name:'Nox',identityAnchor:'Personnage impassible dont l’humour vient du contraste entre visage fixe et situation.',silhouette:'Formes pleines, tête simple, posture droite.',face:'Deux yeux simples et bouche quasi neutre.',proportions:'Tête 38 %, corps compact et stable.',clothing:'Tenue géométrique sobre.',props:'Objet fonctionnel unique selon le plan.',expressions:'Impassible, doute léger, surprise minimale, précision, satisfaction sèche.',forbidden:'Ne pas transformer le visage en expression cartoon exagérée.'}
};

const UNIVERSE_RULES={
  animal:'Trait minimal, aplats simples, décor secondaire et personnage immédiatement lisible.',
  reporter:'Ligne claire, poses narratives, accessoires d’enquête parcimonieux.',
  bird:'Silhouette forte, économie de ligne, décors lisibles et contraste personnage/contexte.',
  notebook:'Trait vivant, texture papier suggérée, irrégularités contrôlées.',
  encyclo:'Personnage très simple devant des éléments documentaires plus détaillés.',
  tiny:'Petit personnage face à des décors/objets volontairement immenses.',
  paper:'Formes découpées, profondeur légère et volumes simplifiés.',
  clear:'Contours nets, peu de détails, expression concentrée dans posture et visage.'
};

export function buildCharacterBible({characterId,universeId,characterName,universeName}){
  const base=CHARACTER_DEFAULTS[characterId]||CHARACTER_DEFAULTS.bec;
  return {
    version:'character-bible-v1',
    mode:'local-structural-canon',
    characterId:characterId||null,
    characterName:characterName||base.name,
    universeId:universeId||null,
    universeName:universeName||null,
    identityAnchor:base.identityAnchor,
    silhouette:base.silhouette,
    face:base.face,
    proportions:base.proportions,
    clothing:base.clothing,
    recurringProps:base.props,
    expressions:base.expressions,
    universeRule:UNIVERSE_RULES[universeId]||'Style simple, cohérent et lisible.',
    continuityRules:[
      base.forbidden,
      'Conserver la même identité visuelle d’un plan à l’autre, même si la pose et le cadrage changent.',
      'Les accessoires contextuels peuvent varier ; les traits d’identité ne doivent pas varier.',
      'Une référence documentaire décrit le monde autour du personnage, pas son identité graphique.'
    ],
    paletteGuidance:'Palette courte et stable au niveau projet ; les couleurs exactes restent à valider avant génération d’images.',
    status:'proposed',
    limitations:'Bible structurelle locale : elle fixe des invariants textuels de continuité mais ne constitue pas encore une character sheet dessinée ni une preuve de cohérence visuelle générée.'
  };
}
