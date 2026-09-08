'use client';

import {useEffect,useMemo,useState} from 'react';

function words(text){return String(text||'').trim().split(/\s+/).filter(Boolean).length}

export default function YouTubeCorpusWorkspace({project,updateProject,setNotice}){
  const urls=useMemo(()=>{
    const source=Array.isArray(project.youtubes)&&project.youtubes.length?project.youtubes:[project.youtube].filter(Boolean);
    return [...new Set(source.map(x=>String(x||'').trim()).filter(Boolean))];
  },[project.youtubes,project.youtube]);
  const [busy,setBusy]=useState(false);
  const [manual,setManual]=useState({});
  const corpus=project.youtubeCorpus||null;
  useEffect(()=>{
    const next={};
    for(const source of corpus?.sources||[]) if(source.provider==='manual') next[source.url]=source.text||'';
    setManual(next);
  },[project.id,corpus?.updatedAt]);

  async function transcribeAll(){
    if(!urls.length||busy)return;
    setBusy(true);setNotice('');
    try{
      const r=await fetch('/api/transcribe-youtube',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({urls})});
      const data=await r.json();
      if(!data.corpus) throw new Error(data.error||'Corpus YouTube indisponible');
      updateProject(project.id,{youtubeCorpus:{...data.corpus,updatedAt:new Date().toISOString()},transcript:data.corpus.readyCount?{status:'corpus',text:data.corpus.text,provider:'youtube-corpus-v1',wordCount:data.corpus.wordCount,capturedAt:new Date().toISOString(),provenance:{method:'Corpus multi-YouTube',sourceCount:data.corpus.sourceCount,readyCount:data.corpus.readyCount}}:project.transcript,status:data.corpus.readyCount?'transcript_ready':project.status});
      setNotice(`${data.corpus.readyCount}/${data.corpus.sourceCount} source(s) YouTube transcrite(s) automatiquement. Les autres restent explicitement indisponibles.`);
    }catch(error){setNotice(error.message)}finally{setBusy(false)}
  }

  function saveManual(url){
    const text=String(manual[url]||'').trim();if(!text)return;
    const previous=corpus?.sources||urls.map((item,index)=>({index:index+1,url:item,status:'unavailable',provider:null,text:'',wordCount:0}));
    const sources=previous.map((source,index)=>source.url===url?{...source,index:index+1,status:'ready',provider:'manual',text,wordCount:words(text),capturedAt:new Date().toISOString(),error:null,detail:null}:{...source,index:index+1});
    const ready=sources.filter(source=>source.status==='ready'&&source.text);
    const combined=ready.map(source=>`[SOURCE YOUTUBE ${source.index}]\nURL: ${source.url}\n${source.text}`).join('\n\n');
    const next={version:'youtube-corpus-v1',factualUse:'allowed',sourceCount:sources.length,readyCount:ready.length,unavailableCount:sources.length-ready.length,wordCount:ready.reduce((sum,source)=>sum+Number(source.wordCount||0),0),sources,text:combined,limitations:'Seules les sources ready alimentent le corpus factuel. Les transcriptions manuelles sont explicitement marquées manual.',updatedAt:new Date().toISOString()};
    updateProject(project.id,{youtubeCorpus:next,transcript:{status:'corpus',text:combined,provider:'youtube-corpus-v1',wordCount:next.wordCount,capturedAt:new Date().toISOString(),provenance:{method:'Corpus multi-YouTube avec fallback manuel',sourceCount:next.sourceCount,readyCount:next.readyCount}},status:'transcript_ready'});
    setNotice(`Transcription manuelle enregistrée pour cette source · corpus ${next.readyCount}/${next.sourceCount}.`);
  }

  return <div className="panel wide"><h2>2. Corpus YouTube</h2><p>Chaque vidéo est traitée séparément. Une vidéo bloquée ne devient jamais un fait : colle uniquement sa transcription si l’automatique échoue.</p><div className="inlineActions"><button className="primary" onClick={transcribeAll} disabled={busy||!urls.length}>{busy?'Transcription du corpus…':'Transcrire toutes les sources'}</button>{corpus&&<span className="chip">{corpus.readyCount}/{corpus.sourceCount} prêtes · {corpus.wordCount} mots</span>}</div>{urls.map((url,index)=>{const source=corpus?.sources?.find(x=>x.url===url);const ready=source?.status==='ready';return <div className="source" key={url}><div><b>YOUTUBE {index+1}</b><small>{url}</small></div><div className="inlineActions"><span className="chip">{ready?(source.provider==='manual'?'Manuelle':'Automatique'):'Indisponible'}</span>{ready&&<small>{source.wordCount||0} mots · {source.provider}</small>}</div>{!ready&&<><textarea className="transcript" value={manual[url]||''} onChange={e=>setManual(v=>({...v,[url]:e.target.value}))} placeholder="Colle ici uniquement la transcription de cette vidéo."/><button onClick={()=>saveManual(url)} disabled={!String(manual[url]||'').trim()}>Enregistrer pour cette vidéo</button></>}{source?.error&&<small className="blockHint">{source.error}</small>}</div>})}</div>;
}
