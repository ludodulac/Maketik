import { NextResponse } from 'next/server';

export const runtime='nodejs';

const schema={
  type:'object',
  properties:{
    editorialProfile:{
      type:'object',
      properties:{hook:{type:'string'},rhythm:{type:'string'},structure:{type:'string'},language:{type:'string'},transitions:{type:'string'},ending:{type:'string'}},
      required:['hook','rhythm','structure','language','transitions','ending'],
      additionalProperties:false
    },
    scripts:{
      type:'array',minItems:3,maxItems:8,
      items:{
        type:'object',
        properties:{title:{type:'string'},angle:{type:'string'},hook:{type:'string'},script:{type:'string'},estimatedSeconds:{type:'integer'},sourceFacts:{type:'array',items:{type:'string'}}},
        required:['title','angle','hook','script','estimatedSeconds','sourceFacts'],
        additionalProperties:false
      }
    }
  },
  required:['editorialProfile','scripts'],
  additionalProperties:false
};

function outputText(data){
  if(typeof data.output_text==='string') return data.output_text;
  for(const item of data.output||[]){
    for(const part of item.content||[]){
      if(part.type==='output_text'&&part.text) return part.text;
    }
  }
  return '';
}

function cleanSegment(value){
  return String(value||'')
    .replace(/\[[^\]]*\]/g,' ')
    .replace(/[♪♫]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function extractSegments(transcript){
  const direct=String(transcript||'')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSegment)
    .filter(x=>x.split(/\s+/).length>=5);
  const seen=new Set();
  const unique=direct.filter(x=>{
    const key=x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(!key||seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if(unique.length>=9) return unique;
  const words=cleanSegment(transcript).split(/\s+/).filter(Boolean);
  for(let i=0;i<words.length&&unique.length<18;i+=22){
    const chunk=words.slice(i,i+22).join(' ').trim();
    if(chunk.split(/\s+/).length>=8) unique.push(chunk);
  }
  return unique;
}

function localFallback(transcript){
  const segments=extractSegments(transcript);
  if(segments.length<3){
    return null;
  }
  const pick=(start,count=3)=>{
    const out=[];
    for(let i=0;i<count;i++) out.push(segments[(start+i)%segments.length]);
    return out;
  };
  const groups=[
    pick(0),
    pick(Math.max(1,Math.floor(segments.length/3))),
    pick(Math.max(2,Math.floor((segments.length*2)/3)))
  ];
  const definitions=[
    {title:'Les points essentiels',angle:'Synthèse directe de la matière source',hook:'Trois éléments de la source suffisent déjà à poser le sujet.'},
    {title:'Le fil à suivre',angle:'Progression en trois temps à partir de passages distincts',hook:'Pour comprendre la matière, il faut regarder comment les éléments s’enchaînent.'},
    {title:'Un autre passage à creuser',angle:'Sélection d’un autre ensemble de faits pour ouvrir un angle différent',hook:'La même source contient aussi une autre piste exploitable.'}
  ];
  const scripts=groups.map((facts,index)=>{
    const d=definitions[index];
    const script=`${d.hook} D’abord : ${facts[0]} Ensuite : ${facts[1]} Enfin : ${facts[2]}`;
    const words=script.split(/\s+/).filter(Boolean).length;
    return {...d,script,estimatedSeconds:Math.max(20,Math.round(words/2.6)),sourceFacts:facts};
  });
  return {
    editorialProfile:{
      hook:'Non dérivé automatiquement sans moteur génératif externe.',
      rhythm:'Brouillon extractif : structure courte en trois temps.',
      structure:'Hook générique puis trois passages directement traçables à la transcription.',
      language:'Le secours local privilégie la fidélité à la source plutôt que la réécriture stylistique.',
      transitions:'Transitions neutres et explicites.',
      ending:'À retravailler avant publication : ce mode ne remplace pas une génération éditoriale complète.'
    },
    scripts
  };
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const transcript=String(body.transcript||'').trim();
  if(!transcript) return NextResponse.json({ok:false,error:'Transcription source manquante'},{status:400});

  if(!process.env.OPENAI_API_KEY){
    const fallback=localFallback(transcript);
    if(!fallback){
      return NextResponse.json({ok:false,code:'LOCAL_GENERATION_INSUFFICIENT_SOURCE',error:'La transcription est trop courte pour produire honnêtement plusieurs brouillons traçables.'},{status:422});
    }
    return NextResponse.json({
      ok:true,
      ...fallback,
      provider:'local-extractive',
      model:'local-extractive-v1',
      generationMode:'fallback',
      originality:'extractive-draft',
      limitations:'Brouillons extractifs générés sans IA externe. Ils restent fidèles aux passages source mais ne constituent pas une réécriture éditoriale originale équivalente au moteur IA.',
      generatedAt:new Date().toISOString()
    });
  }

  const references=(body.references||[]).map((r,i)=>`Référence ${i+1}: ${r.title||r.url||'TikTok'}${r.author?` — ${r.author}`:''}`).join('\n');
  const prompt=`Tu es le moteur éditorial de Maketik, un outil personnel de création de vidéos courtes en français.\n\nOBJECTIF\nÀ partir d'une transcription YouTube factuelle, proposer plusieurs angles distincts et scripts courts originaux. Les références TikTok servent uniquement à déduire des mécanismes éditoriaux généraux: hook, rythme, longueur des phrases, transitions, densité, suspense, humour, relances et type de conclusion. Ne copie jamais des formulations, tournures distinctives, personnages, blagues ou une voix identifiable d'un créateur.\n\nCONTRAINTES\n- Rester fidèle aux faits réellement présents dans la transcription.\n- Ne pas inventer un fait non supporté.\n- Chaque script doit fonctionner seul et viser environ 45 à 75 secondes.\n- Français naturel à l'oral, phrases plutôt courtes.\n- Produire au moins 3 scripts réellement différents si la matière le permet.\n- sourceFacts doit lister les faits du transcript utilisés dans le script.\n\nPROJET\nNom: ${body.projectName||'Sans nom'}\nUnivers graphique: ${body.universe||'non précisé'}\nPersonnage: ${body.character||'non précisé'}\n\nRÉFÉRENCES ÉDITORIALES\n${references||'Métadonnées seules; aucune transcription TikTok fournie.'}\n\nTRANSCRIPTION YOUTUBE\n${transcript.slice(0,120000)}`;

  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-5.6-luna',
        input:prompt,
        reasoning:{effort:'low'},
        store:false,
        text:{format:{type:'json_schema',name:'maketik_scripts',strict:true,schema}}
      })
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data?.error?.message||'Erreur du moteur IA');
    const text=outputText(data);
    const parsed=JSON.parse(text);
    return NextResponse.json({ok:true,...parsed,provider:'openai',generationMode:'ai',model:data.model||process.env.OPENAI_MODEL||'gpt-5.6-luna',generatedAt:new Date().toISOString()});
  }catch(error){
    return NextResponse.json({ok:false,error:'Génération des scripts impossible.',detail:error?.message||'Erreur inconnue'},{status:502});
  }
}
