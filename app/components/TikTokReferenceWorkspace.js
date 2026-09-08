'use client';
import {useEffect,useState} from 'react';

export default function TikTokReferenceWorkspace({project,updateProject,setNotice}){
  const sources=(project.inspection?.tiktoks||[]).filter(source=>source?.ok&&source.kind==='tiktok');
  const evidenceByUrl=project.tiktokEvidence||{};
  const[drafts,setDrafts]=useState({});
  const[preparing,setPreparing]=useState(null);

  useEffect(()=>{
    const next={};
    for(const source of sources) next[source.url]=evidenceByUrl[source.url]?.spokenText||'';
    setDrafts(next);
  },[project.id,project.inspection?.checkedAt]);

  async function prepare(source){
    if(preparing===source.url)return;
    setPreparing(source.url);setNotice('');
    try{
      const r=await fetch('/api/prepare-tiktok-reference',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source,manualTranscript:drafts[source.url]||''})});
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.error||'Préparation TikTok impossible');
      updateProject(project.id,{tiktokEvidence:{...evidenceByUrl,[source.url]:data.evidence}});
      setNotice(data.evidence.evidenceStatus==='manual-spoken-text'?'Référence TikTok enregistrée avec texte parlé manuel et provenance explicite.':'Référence TikTok enregistrée en métadonnées seules. Aucune transcription n’est simulée.');
    }catch(error){setNotice(error.message)}finally{setPreparing(null)}
  }

  if(!sources.length)return null;
  return <div className="scriptsArea">
    <div className="sectionTitle"><div><p className="kicker">RÉFÉRENCES TIKTOK</p><h2>Mécanismes éditoriaux, pas source factuelle</h2></div><span>{Object.keys(evidenceByUrl).length}/{sources.length} préparée(s)</span></div>
    <p className="lead compact">La description TikTok issue d’oEmbed est une métadonnée. Si tu fournis le texte réellement prononcé, Maketik le garde séparément comme transcription manuelle et peut en extraire des indices de rythme/structure. Ce contenu ne devient jamais une source factuelle.</p>
    {sources.map((source,index)=>{const evidence=evidenceByUrl[source.url];return <article className="scriptCard" key={source.url}>
      <div className="scriptHead"><div><span className="scriptNo">TIKTOK {String(index+1).padStart(2,'0')}</span><h3>{source.author||'Créateur TikTok'}</h3><p>{source.description||source.title||'Description indisponible'}</p></div><span className="chip">{evidence?.evidenceStatus==='manual-spoken-text'?'texte parlé manuel':evidence?'métadonnées seules':'à préparer'}</span></div>
      <small className="blockHint">Caption oEmbed ≠ transcription. Usage autorisé : hook, rythme, structure, transitions, densité, suspense, humour et conclusion uniquement.</small>
      <label>Texte réellement prononcé — optionnel, saisi manuellement</label>
      <textarea className="transcript" value={drafts[source.url]||''} onChange={e=>setDrafts(value=>({...value,[source.url]:e.target.value}))} placeholder="Colle ici le texte parlé si tu l’as. Laisse vide pour conserver uniquement les métadonnées vérifiées."/>
      {evidence?.editorialMetrics&&<details><summary>Indices éditoriaux mesurés</summary><p>{evidence.editorialMetrics.wordCount} mots · {evidence.editorialMetrics.sentenceCount} phrases · moyenne {evidence.editorialMetrics.averageWordsPerSentence} mots/phrase</p><p>Ouverture : {evidence.editorialMetrics.openingExcerpt}</p><p>Fin : {evidence.editorialMetrics.closingExcerpt}</p></details>}
      <div className="inlineActions"><button className="primary" onClick={()=>prepare(source)} disabled={preparing===source.url}>{preparing===source.url?'Enregistrement…':evidence?'Mettre à jour la référence':'Préparer la référence'}</button></div>
      {evidence?.limitations&&<small className="blockHint">{evidence.limitations}</small>}
    </article>})}
  </div>;
}
