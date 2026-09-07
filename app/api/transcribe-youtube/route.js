import { NextResponse } from 'next/server';
import { fetchTranscript } from 'youtube-transcript';

export const runtime = 'nodejs';

function cleanText(segments){
  return segments
    .map(s=>String(s.text||'').replace(/\s+/g,' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g,' ')
    .trim();
}

export async function POST(request){
  const {url}=await request.json().catch(()=>({}));
  if(!url) return NextResponse.json({ok:false,error:'URL YouTube manquante'},{status:400});
  try{
    const segments=await fetchTranscript(url);
    const text=cleanText(segments);
    if(!text) return NextResponse.json({ok:false,error:'Aucune transcription disponible pour cette vidéo.'},{status:422});
    return NextResponse.json({
      ok:true,
      provider:'youtube-captions',
      text,
      segmentCount:segments.length,
      wordCount:text.split(/\s+/).filter(Boolean).length,
      capturedAt:new Date().toISOString(),
      provenance:{sourceUrl:url,method:'Sous-titres/captions YouTube via API non officielle',limitations:'Peut échouer si les sous-titres sont désactivés, si YouTube bloque la requête ou modifie son API interne.'}
    });
  }catch(error){
    return NextResponse.json({ok:false,error:'Transcription YouTube indisponible automatiquement.',detail:error?.message||'Erreur inconnue',fallback:'Tu peux coller une transcription manuellement dans le projet sans perdre la source.'},{status:422});
  }
}
