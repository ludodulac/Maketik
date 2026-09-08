function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildShotPrompt(canon, shot) {
  return [
    'Crée une illustration originale pour Maketik.',
    `Personnage canonique : ${canon.characterName}.`,
    canon.identityAnchor && `Ancre d’identité : ${canon.identityAnchor}`,
    canon.silhouette && `Silhouette : ${canon.silhouette}`,
    canon.face && `Visage : ${canon.face}`,
    canon.proportions && `Proportions : ${canon.proportions}`,
    canon.clothing && `Vêtements : ${canon.clothing}`,
    canon.recurringProps && `Accessoires récurrents : ${canon.recurringProps}`,
    canon.universeRule && `Règle d’univers : ${canon.universeRule}`,
    canon.continuityRules.length && `Continuité obligatoire : ${canon.continuityRules.join(' ; ')}`,
    `Scène à illustrer : ${clean(shot.visualNeed) || clean(shot.purpose)}`,
    clean(shot.narrationExcerpt) && `Passage narré correspondant : ${shot.narrationExcerpt}`,
    clean(shot.documentaryReference) && `Référence factuelle à ne pas dépasser : ${shot.documentaryReference}`,
    clean(shot.continuity) && `Continuité de cette scène : ${shot.continuity}`,
    'Composition verticale 9:16 pensée pour une vidéo courte. Aucun texte ni logo dans l’image.',
    'Ne copie aucun artiste, créateur ou personnage existant identifiable. Préserve strictement l’identité canonique ci-dessus.'
  ].filter(Boolean).join('\n');
}

export function buildConversationVisualPack({ project, script, characterBible, visualPlan }) {
  if (!script || script.status !== 'validated') throw new Error('VALIDATED_SCRIPT_REQUIRED');
  if (!characterBible || characterBible.status !== 'validated') throw new Error('VALIDATED_CHARACTER_BIBLE_REQUIRED');
  if (!visualPlan || visualPlan.status !== 'validated' || visualPlan.stale) throw new Error('VALIDATED_VISUAL_PLAN_REQUIRED');

  const sourceShots = Array.isArray(visualPlan.shots) ? visualPlan.shots.filter(Boolean) : [];
  if (!sourceShots.length) throw new Error('VISUAL_PLAN_SHOT_REQUIRED');

  const canon = {
    version: characterBible.version,
    validatedAt: characterBible.validatedAt,
    characterId: characterBible.characterId,
    characterName: characterBible.characterName || project?.character?.name || characterBible.characterId,
    identityAnchor: clean(characterBible.identityAnchor),
    silhouette: clean(characterBible.silhouette),
    face: clean(characterBible.face),
    proportions: clean(characterBible.proportions),
    clothing: clean(characterBible.clothing),
    recurringProps: clean(characterBible.recurringProps),
    universeRule: clean(characterBible.universeRule),
    continuityRules: Array.isArray(characterBible.continuityRules) ? characterBible.continuityRules : []
  };

  const shots = sourceShots.map((shot, index) => ({
    order: Number(shot.order) || index + 1,
    purpose: clean(shot.purpose),
    narrationExcerpt: clean(shot.narrationExcerpt),
    visualNeed: clean(shot.visualNeed),
    documentaryReference: clean(shot.documentaryReference),
    continuity: clean(shot.continuity),
    generation: 'not-generated',
    prompt: buildShotPrompt(canon, shot)
  }));

  return {
    version: 'conversation-visual-pack-v2',
    mode: 'chatgpt-conversation',
    generation: 'not-generated',
    projectName: project?.name || null,
    script: { id: script.id, validatedAt: script.validatedAt || null, title: script.title || script.angle || null },
    characterBible: canon,
    visualPlan: { generatedAt: visualPlan.generatedAt || null, shotCount: shots.length, shotOrder: shots[0].order },
    testProtocol: [
      'Générer la première image dans la conversation ChatGPT à partir du prompt du plan 1.',
      'Contrôler identité, silhouette, visage, proportions, vêtements/accessoires et univers.',
      'Demander une seule correction ciblée sur la même image si nécessaire.',
      'Pour chaque plan suivant, réutiliser l’image canonique validée comme référence visuelle.',
      'Ne déclarer la continuité vérifiée qu’après comparaison visuelle de toute la série.'
    ],
    prompt: shots[0].prompt,
    shots
  };
}
