function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function words(value){
  return new Set(clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9à-ÿ]+/gi,' ').split(/\s+/).filter(w=>w.length>3));
}

function similarity(a,b){
  const wa=words(a),wb=words(b);
  if(!wa.size||!wb.size)return 0;
  let common=0;
  for(const word of wa)if(wb.has(word))common++;
  return common/Math.max(wa.size,wb.size);
}

function splitNarration(text){
  const sentences=clean(text).split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
  if(sentences.length>=4&&sentences.length<=8)return sentences;
  if(sentences.length>8){
    const groups=[];
    const target=7;
    for(let i=0;i<target;i++){
      const start=Math.floor(i*sentences.length/target);
      const end=Math.floor((i+1)*sentences.length/target);
      groups.push(clean(sentences.slice(start,Math.max(start+1,end)).join(' ')));
    }
    return groups.filter(Boolean);
  }
  const tokens=clean(text).split(/\s+/).filter(Boolean);
  if(tokens.length<25)return sentences.length?sentences:[clean(text)];
  const count=Math.min(6,Math.max(4,Math.round(tokens.length/28)));
  const groups=[];
  for(let i=0;i<count;i++){
    const start=Math.floor(i*tokens.length/count);
    const end=Math.floor((i+1)*tokens.length/count);
    groups.push(tokens.slice(start,end).join(' '));
  }
  return groups.filter(Boolean);
}

function purposeFor(index,total){
  if(index===0)return 'ouverture';
  if(index===total-1)return 'conclusion';
  if(index===1)return 'mise-en-contexte';
  return index%2===0?'fait-cle':'progression';
}

export function buildLocalVisualPlan({script,universe,character}){
  const narration=splitNarration(script?.script||'');
  if(narration.length<3)return null;
  const sourceFacts=Array.isArray(script?.sourceFacts)?script.sourceFacts.map(clean).filter(Boolean):[];
  const shots=narration.map((excerpt,index)=>{
    const ranked=sourceFacts.map(fact=>({fact,score:similarity(excerpt,fact)})).sort((a,b)=>b.score-a.score);
    const supportingFact=ranked[0]?.score>0?ranked[0].fact:(sourceFacts[index%Math.max(1,sourceFacts.length)]||'Aucun fait source distinct associé automatiquement.');
    return {
      order:index+1,
      purpose:purposeFor(index,narration.length),
      narrationExcerpt:excerpt,
      visualNeed:`Illustrer précisément ce passage sans ajouter de fait : ${excerpt}`,
      documentaryReference: supportingFact,
      continuity:`Conserver le personnage ${clean(character)||'du projet'} et l’univers ${clean(universe)||'du projet'} de façon cohérente avec les autres plans.`,
      limitation:'Besoin visuel dérivé localement du texte. Il ne remplace pas une recherche documentaire ni une génération d’image.'
    };
  });
  return {
    shots,
    mode:'structural-fallback',
    provider:'local-visual-planner',
    model:'local-visual-plan-v1',
    limitations:'Plan visuel structurel dérivé sans IA externe. Les passages et faits source sont traçables, mais les références documentaires et les choix d’illustration doivent encore être vérifiés avant génération d’images.'
  };
}
