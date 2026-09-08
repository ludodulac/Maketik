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

export function buildYoutubeCorpus(results){
  const sources=(Array.isArray(results)?results:[]).map((result,index)=>({
    index:index+1,
    url:result.url,
    status:result.ok?'ready':'unavailable',
    provider:result.provider||null,
    text:result.ok?clean(result.text):'',
    wordCount:result.ok?Number(result.wordCount||0):0,
    capturedAt:result.capturedAt||null,
    error:result.ok?null:(result.error||'Transcription indisponible'),
    detail:result.ok?null:(result.detail||null)
  }));
  const ready=sources.filter(source=>source.status==='ready'&&source.text);
  const text=ready.map(source=>`[SOURCE YOUTUBE ${source.index}]\nURL: ${source.url}\n${source.text}`).join('\n\n');
  return {
    version:'youtube-corpus-v1',
    factualUse:'allowed',
    sourceCount:sources.length,
    readyCount:ready.length,
    unavailableCount:sources.length-ready.length,
    wordCount:ready.reduce((sum,source)=>sum+source.wordCount,0),
    sources,
    text,
    limitations:'Seules les transcriptions marquées ready font partie du corpus factuel. Une source indisponible reste visible et ne doit jamais être traitée comme transcrite.'
  };
}
