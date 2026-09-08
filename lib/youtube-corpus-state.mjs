function wordCount(text){
  return String(text||'').trim().split(/\s+/).filter(Boolean).length;
}

function normalizeSource(source,index){
  return {
    ...source,
    index:index+1,
    url:String(source?.url||'').trim(),
    text:String(source?.text||''),
    wordCount:Number(source?.wordCount||wordCount(source?.text))
  };
}

export function rebuildYouTubeCorpus(sources,{version='youtube-corpus-v1',limitations}={}){
  const normalized=(sources||[]).map(normalizeSource);
  const ready=normalized.filter(source=>source.status==='ready'&&source.text);
  const text=ready.map(source=>`[SOURCE YOUTUBE ${source.index}]\nURL: ${source.url}\n${source.text}`).join('\n\n');
  return {
    version,
    factualUse:'allowed',
    sourceCount:normalized.length,
    readyCount:ready.length,
    unavailableCount:normalized.length-ready.length,
    wordCount:ready.reduce((sum,source)=>sum+Number(source.wordCount||0),0),
    sources:normalized,
    text,
    limitations:limitations||'Seules les sources ready alimentent le corpus factuel. Les transcriptions manuelles restent explicitement marquées manual.',
  };
}

export function mergeCorpusPreservingManual(previous,incoming){
  const previousManual=new Map(
    (previous?.sources||[])
      .filter(source=>source?.provider==='manual'&&source?.status==='ready'&&String(source?.text||'').trim())
      .map(source=>[String(source.url||'').trim(),source])
  );

  const incomingSources=(incoming?.sources||[]).map((source,index)=>{
    const key=String(source?.url||'').trim();
    const manual=previousManual.get(key);
    if(!manual) return normalizeSource(source,index);
    return normalizeSource({
      ...source,
      ...manual,
      url:key,
      status:'ready',
      provider:'manual',
      error:null,
      detail:null,
      preservedFromManual:true
    },index);
  });

  return {
    ...incoming,
    ...rebuildYouTubeCorpus(incomingSources,{
      version:incoming?.version||previous?.version||'youtube-corpus-v1',
      limitations:incoming?.limitations||previous?.limitations
    }),
    updatedAt:new Date().toISOString()
  };
}
