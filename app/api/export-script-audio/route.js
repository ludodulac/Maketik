import {NextResponse} from 'next/server';
import {EdgeTTS} from 'node-edge-tts';
import {readFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export const runtime='nodejs';

const PROVIDER='edge-read-aloud-experimental';
const VOICE='fr-FR-HenriNeural';
const OUTPUT_FORMAT='audio-24khz-96kbitrate-mono-mp3';
const PROVIDER_TIMEOUT_MS=25000;

function safeFilename(value){
  return String(value||'script')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,70)||'script';
}

function withTimeout(promise,ms){
  let timer;
  const timeout=new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error(`Fournisseur audio sans réponse après ${Math.round(ms/1000)} s`)),ms);
  });
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const script=body.script||{};
  const text=String(script.script||'').trim();

  if(script.status!=='validated'){
    return NextResponse.json({ok:false,error:'Seul un script validé peut produire un fichier audio.'},{status:409});
  }
  if(!text){
    return NextResponse.json({ok:false,error:'Le script validé est vide.'},{status:400});
  }
  if(text.length>12000){
    return NextResponse.json({ok:false,error:'Le script est trop long pour cet export audio.'},{status:413});
  }

  const outputPath=join(tmpdir(),`maketik-${randomUUID()}.mp3`);
  try{
    const tts=new EdgeTTS({
      voice:VOICE,
      lang:'fr-FR',
      outputFormat:OUTPUT_FORMAT,
      rate:'-4%',
      pitch:'-2Hz',
      volume:'default',
      timeout:18000
    });
    await withTimeout(tts.ttsPromise(text,outputPath),PROVIDER_TIMEOUT_MS);
    const audio=await readFile(outputPath);
    if(audio.length<1000) throw new Error('Fichier audio anormalement court');

    const filename=`maketik-${safeFilename(body.projectName)}-${safeFilename(script.title)}.mp3`;
    return new NextResponse(audio,{status:200,headers:{
      'content-type':'audio/mpeg',
      'content-disposition':`attachment; filename="${filename}"`,
      'cache-control':'no-store',
      'x-maketik-audio-provider':PROVIDER,
      'x-maketik-audio-voice':VOICE,
      'x-maketik-audio-stability':'experimental'
    }});
  }catch(error){
    return NextResponse.json({
      ok:false,
      code:'AUDIO_PROVIDER_UNAVAILABLE',
      error:'La génération du fichier audio est indisponible pour le moment.',
      detail:error?.message||'Erreur inconnue',
      provider:PROVIDER,
      voice:VOICE,
      fallback:'Le script validé et son PDF restent intacts. L’aperçu vocal du navigateur reste disponible sans créer de faux fichier audio.'
    },{status:502});
  }finally{
    await unlink(outputPath).catch(()=>{});
  }
}
