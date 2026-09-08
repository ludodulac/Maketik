import { NextResponse } from 'next/server';
import { fetchTranscript } from 'youtube-transcript';
import { buildYoutubeCorpus, normalizeYoutubeUrls } from '../../../lib/youtube-corpus.mjs';

export const runtime = 'nodejs';

function cleanText(segments){
  return segments
    .map(s=>String(s.text||'').replace(/\s+/g,' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g,' ')
    .trim();
}

async function transcribeOne(url){
  try{
    const segments=await fetchTranscript(url);
    const text=cleanText(segments);
    if(!text) return {ok:false,url,error:'Aucune transcription disponible pour cette vidéo.'};
    return {
      ok:true,
      url,
      provider:'youtube-captions',
      text,
      segmentCount:segments.length,
      wordCount:text.split(/\s+/).filter(Boolean).length,
      capturedAt:new Date().toISOString(),
      provenance:{sourceUrl:url,method:'Sous-titres/captions YouTube via API non officielle',limitations:'Peut échouer si les sous-titres sont désactivés, si YouTube bloque la requête ou modifie son API interne.'}
    };
  }catch(error){
    return {ok:false,url,error:'Transcription YouTube indisponible automatiquement.',detail:error?.message||'Erreur inconnue'};
  }
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const urls=normalizeYoutubeUrls(body.urls||body.url);
  if(!urls.length) return NextResponse.json({ok:false,error:'URL YouTube manquante'},{status:400});

  // Compatibilité avec les projets existants : une URL conserve exactement le contrat historique.
  if(urls.length===1){
    const result=await transcribeOne(urls[0]);
    if(!result.ok) return NextResponse.json({...result,fallback:'Tu peux coller une transcription manuellement dans le projet sans perdre la source.'},{status:422});
    return NextResponse.json(result);
  }

  // Plusieurs sources sont indépendantes : une vidéo bloquée ne fait pas disparaître les autres.
  const results=[];
  for(const url of urls) results.push(await transcribeOne(url));
  const corpus=buildYoutubeCorpus(results);
  return NextResponse.json({
    ok:corpus.readyCount>0,
    provider:'youtube-corpus',
    corpus,
    text:corpus.text,
    wordCount:corpus.wordCount,
    capturedAt:new Date().toISOString(),
    fallback:corpus.unavailableCount?'Les sources indisponibles restent explicitement marquées et peuvent recevoir une transcription manuelle.':null
  },{status:corpus.readyCount>0?200:422});
}
