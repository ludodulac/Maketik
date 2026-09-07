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

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const transcript=String(body.transcript||'').trim();
  if(!transcript) return NextResponse.json({ok:false,error:'Transcription source manquante'},{status:400});
  if(!process.env.OPENAI_API_KEY){
    return NextResponse.json({ok:false,code:'AI_NOT_CONFIGURED',error:'Le moteur IA n’est pas encore configuré sur le serveur. La transcription reste enregistrée.'},{status:503});
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
    return NextResponse.json({ok:true,...parsed,model:data.model||process.env.OPENAI_MODEL||'gpt-5.6-luna',generatedAt:new Date().toISOString()});
  }catch(error){
    return NextResponse.json({ok:false,error:'Génération des scripts impossible.',detail:error?.message||'Erreur inconnue'},{status:502});
  }
}
