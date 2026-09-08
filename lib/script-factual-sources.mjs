function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

export function parseFactualYoutubeSources(transcript){
  const input=String(transcript||'').trim();
  if(!input) return [];
  const marker=/\[SOURCE YOUTUBE (\d+)\]\s*\nURL:\s*([^\n]+)\n([\s\S]*?)(?=\n\n\[SOURCE YOUTUBE \d+\]|$)/g;
  const sources=[];
  for(const match of input.matchAll(marker)){
    const text=clean(match[3]);
    if(text) sources.push({sourceLabel:`SOURCE YOUTUBE ${match[1]}`,sourceUrl:clean(match[2]),text});
  }
  if(sources.length) return sources;
  return [{sourceLabel:'SOURCE YOUTUBE 1',sourceUrl:'',text:clean(input)}];
}

function chunks(value,size=18){
  const words=clean(value).replace(/\[[^\]]*\]/g,' ').replace(/[♪♫]+/g,' ').split(/\s+/).filter(Boolean);
  const out=[];
  for(let i=0;i<words.length;i+=size){
    const text=words.slice(i,i+size).join(' ');
    if(text.split(/\s+/).length>=6) out.push(text);
  }
  return out;
}

export function extractSourceAwareSegments(transcript){
  const seen=new Set();
  const output=[];
  for(const source of parseFactualYoutubeSources(transcript)){
    const raw=source.text.split(/(?<=[.!?])\s+|\n+/).map(clean).filter(Boolean);
    const candidates=raw.flatMap(segment=>segment.split(/\s+/).length>28?chunks(segment):[segment]);
    if(candidates.length<6) candidates.push(...chunks(source.text));
    for(const text of candidates){
      if(text.split(/\s+/).length<6) continue;
      const key=`${source.sourceUrl}|${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}`;
      if(!key||seen.has(key)) continue;
      seen.add(key);
      output.push({...source,text});
    }
  }
  return output.slice(0,120);
}

export function verifyDetailedFacts(detailedFacts,transcript){
  const sources=parseFactualYoutubeSources(transcript);
  const byUrl=new Map(sources.filter(source=>source.sourceUrl).map(source=>[source.sourceUrl,source]));
  const byLabel=new Map(sources.map(source=>[source.sourceLabel,source]));
  return (Array.isArray(detailedFacts)?detailedFacts:[]).map(fact=>{
    const requestedUrl=clean(fact?.sourceUrl);
    const requestedLabel=clean(fact?.sourceLabel);
    const source=(requestedUrl&&byUrl.get(requestedUrl))||byLabel.get(requestedLabel)||null;
    const excerpt=clean(fact?.sourceExcerpt);
    const excerptVerified=Boolean(source&&excerpt&&source.text.toLowerCase().includes(excerpt.toLowerCase()));
    return {
      text:clean(fact?.text),
      sourceLabel:source?.sourceLabel||requestedLabel||'',
      sourceUrl:source?.sourceUrl||'',
      sourceExcerpt:excerptVerified?excerpt:'',
      provenanceVerified:excerptVerified
    };
  }).filter(fact=>fact.text);
}
