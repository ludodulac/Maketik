function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

export function normalizeYoutubeUrls(input){
  const raw=Array.isArray(input)?input:[input];
  const seen=new Set();
  return raw.map(clean).filter(Boolean).filter(url=>{
    if(seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function finalizeCorpus(sources){
  const ready=sources.filter(source=>['ready','manual'].includes(source.status)&&source.text);
  const text=ready.map(source=>`[SOURCE YOUTUBE ${source.index}]\nURL: ${source.url}\nPROVENANCE: ${source.provider||'unknown'}\n${source.text}`).join('\n\n');
  return {
    version:'youtube-corpus-v1',
    factualUse:'allowed',
    sourceCount:sources.length,
    readyCount:ready.length,
    unavailableCount:sources.length-ready.length,
    manualCount:ready.filter(source=>source.status==='manual').length,
    wordCount:ready.reduce((sum,source)=>sum+source.wordCount,0),
    sources,
    text,
    limitations:'Seules les transcriptions marquées ready ou manual font partie du corpus factuel. Une transcription manual est du texte fourni explicitement par l’utilisateur et reste étiquetée comme telle. Une source indisponible reste visible et ne doit jamais être traitée comme transcrite.'
  };
}

export function buildYoutubeCorpus(results){
  const sources=(Array.isArray(results)?results:[]).map((result,index)=>({
    index:index+1,
    url:result.url,
    status:result.ok?'ready':'unavailable',
    provider:result.provider||null,
    text:result.ok?clean(result.text):'',
    wordCount:result.ok?Number(result.wordCount||0):0,
    capturedAt:result.capturedAt||null,
    provenance:result.provenance||null,
    error:result.ok?null:(result.error||'Transcription indisponible'),
    detail:result.ok?null:(result.detail||null)
  }));
  return finalizeCorpus(sources);
}

export function applyManualYoutubeTranscripts(corpus,manualByUrl={}){
  const sources=(corpus?.sources||[]).map(source=>{
    const raw=manualByUrl?.[source.url];
    const text=clean(typeof raw==='string'?raw:raw?.text);
    if(!text) return source;
    const capturedAt=typeof raw==='object'&&raw?.capturedAt?raw.capturedAt:new Date().toISOString();
    return {
      ...source,
      status:'manual',
      provider:'manual',
      text,
      wordCount:text.split(/\s+/).filter(Boolean).length,
      capturedAt,
      provenance:{
        sourceUrl:source.url,
        method:'Transcription collée manuellement',
        limitations:'Le texte n’a pas été extrait automatiquement par Maketik.'
      },
      error:null,
      detail:null
    };
  });
  return finalizeCorpus(sources);
}
