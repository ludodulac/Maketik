function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function keywords(value,limit=10){
  const stop=new Set(['avec','dans','pour','sans','plus','moins','cette','cet','cela','comme','dont','leurs','leur','elle','elles','nous','vous','mais','donc','alors','entre','apres','avant','depuis','vers','aussi','encore','meme','etre','avoir','faire','peut','sont','est','une','des','les','aux','sur']);
  const seen=new Set();
  const out=[];
  for(const raw of clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/)){
    if(raw.length<4||stop.has(raw)||seen.has(raw))continue;
    seen.add(raw);out.push(raw);
    if(out.length>=limit)break;
  }
  return out;
}

function intentFor(purpose){
  switch(purpose){
    case 'ouverture': return 'image de contexte immédiatement lisible';
    case 'mise-en-contexte': return 'référence documentaire explicative';
    case 'conclusion': return 'image de synthèse fidèle au sujet';
    case 'fait-cle': return 'preuve visuelle ou représentation documentaire du fait clé';
    default: return 'référence documentaire illustrant précisément le passage';
  }
}

export function buildReferenceTargets({visualPlan,sourceTitle,sourceUrl}){
  if(!visualPlan||visualPlan.status!=='validated'||visualPlan.stale)return null;
  const shots=Array.isArray(visualPlan.shots)?visualPlan.shots:[];
  if(!shots.length)return null;
  const targets=shots.map(shot=>{
    const fact=clean(shot.documentaryReference);
    const excerpt=clean(shot.narrationExcerpt);
    const terms=keywords(`${fact} ${excerpt}`);
    const query=terms.join(' ');
    return {
      shotOrder:shot.order,
      purpose:shot.purpose,
      narrationExcerpt:excerpt,
      sourceFact:fact,
      researchIntent:intentFor(shot.purpose),
      searchQuery:query,
      preferredSources:['source primaire ou institutionnelle','archives ou musée si historique','média documentaire reconnu si source primaire absente'],
      acceptanceCriteria:[
        'La référence doit correspondre au fait ou au contexte du passage, pas seulement au thème général.',
        'La provenance et l’URL doivent être conservées avant utilisation.',
        'Une image décorative sans valeur documentaire ne valide pas cette cible.',
        'La référence sert à documenter une illustration nouvelle, pas à être copiée telle quelle.'
      ],
      sourceContext:sourceTitle||sourceUrl?{title:clean(sourceTitle),url:clean(sourceUrl)}:null,
      status:'needs-research'
    };
  });
  return {
    targets,
    provider:'local-reference-target-planner',
    model:'local-reference-targets-v1',
    mode:'research-targets-only',
    limitations:'Ces éléments sont des cibles et requêtes de recherche, pas des références trouvées ni vérifiées. Une URL, une provenance et une vérification documentaire réelle doivent être ajoutées avant toute génération d’image.'
  };
}
