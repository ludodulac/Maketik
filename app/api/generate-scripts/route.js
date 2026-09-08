import { NextResponse } from 'next/server';
import { extractSourceAwareSegments, parseFactualYoutubeSources, verifyDetailedFacts } from '../../../lib/script-factual-sources.mjs';

export const runtime='nodejs';

const detailedFactSchema={
  type:'object',
  properties:{
    text:{type:'string'},
    sourceLabel:{type:'string'},
    sourceUrl:{type:'string'},
    sourceExcerpt:{type:'string'}
  },
  required:['text','sourceLabel','sourceUrl','sourceExcerpt'],
  additionalProperties:false
};

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
        properties:{
          title:{type:'string'},angle:{type:'string'},hook:{type:'string'},script:{type:'string'},estimatedSeconds:{type:'integer'},
          sourceFacts:{type:'array',items:{type:'string'}},
          sourceFactsDetailed:{type:'array',items:detailedFactSchema}
        },
        required:['title','angle','hook','script','estimatedSeconds','sourceFacts','sourceFactsDetailed'],
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

function localFallback(transcript){
  const segments=extractSourceAwareSegments(transcript);
  if(segments.length<6) return null;
  const pick=(start,count=6)=>{
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
    {title:'Les points essentiels',angle:'Synthèse directe de la matière source',hook:'Voici les éléments des sources qui posent le mieux le sujet.'},
    {title:'Le fil à suivre',angle:'Progression en plusieurs temps à partir de passages distincts',hook:'Pour suivre cette histoire, il faut remettre plusieurs éléments des sources dans l’ordre.'},
    {title:'Une autre piste',angle:'Sélection d’un autre ensemble de passages pour ouvrir un angle différent',hook:'Le corpus permet aussi d’ouvrir un autre angle, à partir de passages différents.'}
  ];
  const connectors=['D’abord','Puis','Ensuite','À ce stade','Autre élément','Enfin'];
  const scripts=groups.map((facts,index)=>{
    const d=definitions[index];
    const body=facts.map((fact,i)=>`${connectors[i]} : ${fact.text}`).join(' ');
    const script=`${d.hook} ${body}`;
    const wordCount=script.split(/\s+/).filter(Boolean).length;
    return {
      ...d,
      script,
      estimatedSeconds:Math.min(75,Math.max(35,Math.round(wordCount/2.6))),
      sourceFacts:facts.map(fact=>fact.text),
      sourceFactsDetailed:facts.map(fact=>({
        text:fact.text,
        sourceLabel:fact.sourceLabel,
        sourceUrl:fact.sourceUrl,
        sourceExcerpt:fact.text,
        provenanceVerified:true
      }))
    };
  });
  return {
    editorialProfile:{
      hook:'Non dérivé automatiquement sans moteur génératif externe.',
      rhythm:'Brouillon extractif court, découpé en plusieurs passages source.',
      structure:'Hook neutre puis six passages directement traçables au corpus YouTube.',
      language:'Le secours local privilégie la fidélité à la source plutôt que la réécriture stylistique.',
      transitions:'Transitions neutres et explicites.',
      ending:'À retravailler avant publication : ce mode ne remplace pas une génération éditoriale complète.'
    },
    scripts
  };
}

function formatEditorialReference(reference,index){
  const evidence=reference?.evidence||null;
  const lines=[`Référence ${index+1}: ${reference?.author||reference?.title||reference?.url||'TikTok'}`];
  if(reference?.description)lines.push(`Caption/métadonnée oEmbed: ${String(reference.description).slice(0,1200)}`);
  if(evidence?.spokenText)lines.push(`Texte parlé fourni manuellement: ${String(evidence.spokenText).slice(0,6000)}`);
  if(evidence?.editorialMetrics)lines.push(`Mesures: ${JSON.stringify(evidence.editorialMetrics)}`);
  lines.push(`Statut de preuve: ${evidence?.evidenceStatus||'metadata-only'}`);
  lines.push('INTERDICTION: cette référence TikTok n’est pas une source factuelle. Ne reprendre aucun fait, chiffre, nom ou événement depuis elle dans sourceFacts ou dans le contenu factuel du script.');
  lines.push('USAGE AUTORISÉ: mécanismes éditoriaux abstraits seulement; ne pas copier les formulations ni imiter une voix identifiable.');
  return lines.join('\n');
}

function finalizeScripts(scripts,transcript){
  return (Array.isArray(scripts)?scripts:[]).map(script=>{
    const detailed=verifyDetailedFacts(script.sourceFactsDetailed,transcript);
    return {
      ...script,
      sourceFactsDetailed:detailed,
      provenanceVerified:detailed.length>0&&detailed.every(fact=>fact.provenanceVerified)
    };
  });
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const transcript=String(body.transcript||'').trim();
  if(!transcript) return NextResponse.json({ok:false,error:'Transcription source manquante'},{status:400});
  const references=Array.isArray(body.references)?body.references:[];
  const referenceEvidenceCount=references.filter(reference=>reference?.evidence).length;
  const factualSources=parseFactualYoutubeSources(transcript);

  if(!process.env.OPENAI_API_KEY){
    const fallback=localFallback(transcript);
    if(!fallback){
      return NextResponse.json({ok:false,code:'LOCAL_GENERATION_INSUFFICIENT_SOURCE',error:'La transcription est trop courte pour produire honnêtement plusieurs brouillons traçables.'},{status:422});
    }
    return NextResponse.json({
      ok:true,
      ...fallback,
      factualSourceCount:factualSources.length,
      provider:'local-extractive',
      model:'local-extractive-v2-source-aware',
      generationMode:'fallback',
      originality:'extractive-draft',
      referenceEvidenceCount,
      limitations:'Brouillons extractifs générés sans IA externe. Chaque passage conserve maintenant la vidéo YouTube dont il provient. Ils restent fidèles aux sources mais ne constituent pas une réécriture éditoriale originale équivalente au moteur IA. Les références TikTok ne sont jamais utilisées comme faits.',
      generatedAt:new Date().toISOString()
    });
  }

  const editorialReferences=references.map(formatEditorialReference).join('\n\n');
  const prompt=`Tu es le moteur éditorial de Maketik, un outil personnel de création de vidéos courtes en français.\n\nOBJECTIF\nÀ partir d'un corpus de transcriptions YouTube factuelles, proposer plusieurs angles distincts et scripts courts originaux. Les références TikTok servent uniquement à déduire des mécanismes éditoriaux généraux: hook, rythme, longueur des phrases, transitions, densité, suspense, humour, relances et type de conclusion. Ne copie jamais des formulations, tournures distinctives, personnages, blagues ou une voix identifiable d'un créateur.\n\nSÉPARATION DES SOURCES — OBLIGATOIRE\n- Le corpus YouTube ci-dessous est la seule matière factuelle.\n- Chaque bloc [SOURCE YOUTUBE N] possède son URL et doit rester traçable.\n- Les TikTok ne sont jamais une source factuelle, même lorsqu’un texte parlé manuel est fourni.\n- sourceFacts doit contenir uniquement des faits supportés par le corpus YouTube.\n- Pour chaque entrée sourceFactsDetailed, sourceLabel et sourceUrl doivent correspondre au bloc YouTube réellement utilisé.\n- sourceExcerpt doit être un court extrait VERBATIM présent dans cette même source et supportant le fait. N’invente jamais cet extrait.\n- Une caption TikTok oEmbed est une métadonnée du post, pas une transcription.\n\nCONTRAINTES\n- Rester fidèle aux faits réellement présents dans le corpus YouTube.\n- Ne pas inventer un fait non supporté.\n- Chaque script doit fonctionner seul et viser environ 45 à 75 secondes.\n- Français naturel à l'oral, phrases plutôt courtes.\n- Produire au moins 3 scripts réellement différents si la matière le permet.\n- Ne pas imiter un créateur identifiable.\n\nPROJET\nNom: ${body.projectName||'Sans nom'}\nUnivers graphique: ${body.universe||'non précisé'}\nPersonnage: ${body.character||'non précisé'}\n\nRÉFÉRENCES ÉDITORIALES TIKTOK\n${editorialReferences||'Aucune preuve TikTok préparée; ne déduis aucun style spécifique.'}\n\nCORPUS YOUTUBE — SEULE SOURCE FACTUELLE\n${transcript.slice(0,120000)}`;

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
    const scripts=finalizeScripts(parsed.scripts,transcript);
    return NextResponse.json({
      ok:true,
      ...parsed,
      scripts,
      factualSourceCount:factualSources.length,
      provider:'openai',
      generationMode:'ai',
      referenceEvidenceCount,
      model:data.model||process.env.OPENAI_MODEL||'gpt-5.6-luna',
      generatedAt:new Date().toISOString()
    });
  }catch(error){
    return NextResponse.json({ok:false,error:'Génération des scripts impossible.',detail:error?.message||'Erreur inconnue'},{status:502});
  }
}
