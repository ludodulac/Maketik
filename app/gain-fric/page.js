'use client';

import {useEffect,useState} from 'react';
import {mergeGeneratedScripts,scriptFactProvenanceStatus} from '../../lib/script-state.mjs';
import YouTubeCorpusWorkspace from '../components/YouTubeCorpusWorkspace';
import TikTokReferenceWorkspace from '../components/TikTokReferenceWorkspace';
import CharacterBibleWorkspace from '../components/CharacterBibleWorkspace';

const tiktoks=[
  'https://vm.tiktok.com/ZN82rvSDb/',
  'https://vm.tiktok.com/ZN82h2nDL/',
  'https://vm.tiktok.com/ZN82hNHF7/',
  'https://vm.tiktok.com/ZN82rGs15/'
];
const youtubes=[
  'https://youtu.be/b1m_6km44JQ?is=p4LLagtOGx3C7kMl',
  'https://youtu.be/horkXy4kMro?is=lbNvJhFt07ZzQJIt',
  'https://youtu.be/xnCHNrVrTTs?is=xvwnCm4VstM5Ns85',
  'https://youtu.be/e9M0bLmRQC0?is=Ksbr7odmymsRyMaC'
];
const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random());
const initialProject=()=>({
  id:'gain-fric-v1',name:'Gain fric',universe:'bird',character:'bec',tiktoks,youtubes,youtube:youtubes[0],
  status:'sources_ready',inspection:null,youtubeCorpus:null,transcript:null,tiktokEvidence:{},scripts:[],editorialProfile:null,lastGeneration:null,characterBible:null
});

function ScriptFacts({script}){
  const detailed=Array.isArray(script.sourceFactsDetailed)?script.sourceFactsDetailed:[];
  if(detailed.length){
    return <details><summary>Faits source utilisés · provenance YouTube</summary><ul>{detailed.map((fact,n)=><li key={n}><b>{fact.sourceLabel||'SOURCE YOUTUBE'}</b>{' · '}{fact.text}{fact.sourceUrl&&<><br/><small>{fact.sourceUrl}</small></>}{fact.sourceExcerpt&&<><br/><small>Extrait vérifié : “{fact.sourceExcerpt}”</small></>}{fact.provenanceVerified===false&&<><br/><small className="blockHint">Provenance non vérifiée automatiquement : validation bloquée.</small></>}</li>)}</ul></details>;
  }
  if(script.sourceFacts?.length) return <details><summary>Faits source utilisés</summary><ul>{script.sourceFacts.map((fact,n)=><li key={n}>{fact}</li>)}</ul></details>;
  return null;
}

export default function GainFricPage(){
  const [project,setProject]=useState(initialProject());
  const [notice,setNotice]=useState('');
  const [inspecting,setInspecting]=useState(false);
  const [generating,setGenerating]=useState(false);
  useEffect(()=>{try{const saved=localStorage.getItem('maketik-gain-fric-project');if(saved)setProject({...initialProject(),...JSON.parse(saved)})}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('maketik-gain-fric-project',JSON.stringify(project))}catch{}},[project]);
  const updateProject=(id,patch)=>setProject(current=>current.id===id?{...current,...patch,updatedAt:new Date().toISOString()}:current);
  async function inspectOne(url){const r=await fetch('/api/inspect-source',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});return r.json()}
  async function inspectSources(){
    if(inspecting)return;setInspecting(true);setNotice('');
    try{
      const tik=await Promise.all(project.tiktoks.map(async url=>{try{return await inspectOne(url)}catch{return{ok:false,url,error:'Échec réseau'}}}));
      const yt=await Promise.all(project.youtubes.map(async url=>{try{return await inspectOne(url)}catch{return{ok:false,url,error:'Échec réseau'}}}));
      updateProject(project.id,{inspection:{tiktoks:tik,youtubes:yt,checkedAt:new Date().toISOString()},status:tik.some(x=>x.ok)||yt.some(x=>x.ok)?'sources_verified':'sources_attention'});
      setNotice(`${tik.filter(x=>x.ok).length}/${tik.length} TikTok et ${yt.filter(x=>x.ok).length}/${yt.length} YouTube reconnus. Reconnu ne signifie pas transcrit.`);
    }finally{setInspecting(false)}
  }
  async function generateScripts(){
    if(!project.transcript?.text||generating)return;setGenerating(true);setNotice('');
    try{
      const refs=(project.inspection?.tiktoks||project.tiktoks.map(url=>({url}))).map(x=>({url:x.url,title:x.title,description:x.description,author:x.author,evidence:project.tiktokEvidence?.[x.url]||null}));
      const r=await fetch('/api/generate-scripts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectName:project.name,universe:'Oiseau enquêteur',character:'Bec',references:refs,transcript:project.transcript.text})});
      const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'Génération impossible');
      const scripts=mergeGeneratedScripts(project.scripts,data.scripts,data,uid);
      updateProject(project.id,{scripts,editorialProfile:data.editorialProfile,lastGeneration:{provider:data.provider,model:data.model,generationMode:data.generationMode,limitations:data.limitations,factualSourceCount:data.factualSourceCount,generatedAt:data.generatedAt},status:'scripts_ready'});
      setNotice(data.generationMode==='fallback'?`${data.scripts.length} brouillons extractifs créés depuis ${data.factualSourceCount||1} source(s) factuelle(s), avec provenance par vidéo.`:`${data.scripts.length} scripts originaux proposés depuis ${data.factualSourceCount||1} source(s) factuelle(s), avec provenance par vidéo.`);
    }catch(error){setNotice(error.message)}finally{setGenerating(false)}
  }
  function setScriptStatus(id,status){
    const target=(project.scripts||[]).find(script=>script.id===id);
    if(!target)return;
    if(status==='validated'){
      const provenance=scriptFactProvenanceStatus(target);
      if(!provenance.canValidate){
        setNotice(`Validation bloquée : ${provenance.reason}`);
        return;
      }
    }
    updateProject(project.id,{scripts:(project.scripts||[]).map(s=>s.id===id?{...s,status,validatedAt:status==='validated'?new Date().toISOString():s.validatedAt}:s)});
  }
  return <main>
    <header><div className="brand">MAKE<span>TIK</span></div><div className="tag">projet réel · Gain fric</div></header>
    <div className="projectPage">
      <div className="projectTop"><div><p className="kicker">PREMIER PROJET RÉEL</p><h1>Gain fric</h1><p className="lead compact">4 TikTok pour les mécanismes éditoriaux · 4 YouTube pour les faits · Bec comme personnage canonique.</p></div><div className="status">{project.status}</div></div>
      {notice&&<div className="notice">{notice}</div>}
      <div className="workspace">
        <div className="panel"><h2>1. Sources réelles</h2><p>La reconnaissance des liens reste séparée de la transcription.</p><button className="primary" onClick={inspectSources} disabled={inspecting}>{inspecting?'Vérification…':'Vérifier les 8 sources'}</button>{project.inspection&&<div className="pipeline"><b>{project.inspection.tiktoks.filter(x=>x.ok).length + project.inspection.youtubes.filter(x=>x.ok).length}</b><span>sources reconnues</span><em>/ 8</em></div>}</div>
        <div className="panel"><h2>Règle de vérité</h2><p>TikTok = structure et rythme seulement. YouTube = matière factuelle seulement. Une vidéo non transcrite ne fournit aucun fait.</p></div>
        <YouTubeCorpusWorkspace project={project} updateProject={updateProject} setNotice={setNotice}/>
        <div className="panel"><h2>3. Scripts</h2><p>La génération reste bloquée tant qu'aucune source YouTube n'est réellement prête. Chaque fait généré garde ensuite la vidéo YouTube dont il provient.</p><button className="primary" onClick={generateScripts} disabled={generating||!project.transcript?.text}>{generating?'Génération…':'Générer depuis le corpus'}</button>{!project.transcript?.text&&<small className="blockHint">Corpus factuel vide : aucune invention autorisée.</small>}{project.lastGeneration?.generationMode==='fallback'&&<small className="blockHint">Mode local : brouillons extractifs, pas scripts originaux IA.</small>}</div>
      </div>
      {project.inspection?.tiktoks?.some(source=>source?.ok)&&<TikTokReferenceWorkspace project={project} updateProject={updateProject} setNotice={setNotice}/>} 
      <CharacterBibleWorkspace project={project} universeName="Oiseau enquêteur" characterName="Bec" updateProject={updateProject} setNotice={setNotice}/>
      {(project.scripts||[]).length>0&&<div className="scriptsArea"><div className="sectionTitle"><div><p className="kicker">SCRIPTS GAIN FRIC</p><h2>Propositions à valider</h2></div><span>{project.scripts.filter(s=>s.status==='validated').length} validé(s)</span></div>{project.scripts.map((s,i)=>{const provenance=scriptFactProvenanceStatus(s);return <article className={'scriptCard '+(s.status==='validated'?'validated':'')} key={s.id}><div className="scriptHead"><div><span className="scriptNo">#{String(i+1).padStart(2,'0')}</span><h3>{s.title}</h3><p>{s.angle}</p></div><span className="chip">≈ {s.estimatedSeconds}s</span></div><blockquote>{s.hook}</blockquote><div className="scriptText">{s.script}</div><ScriptFacts script={s}/><div className="inlineActions">{s.status==='validated'?<button onClick={()=>setScriptStatus(s.id,'proposed')}>Retirer la validation</button>:<button className="primary" onClick={()=>setScriptStatus(s.id,'validated')} disabled={!provenance.canValidate}>✓ Valider ce script</button>}{!provenance.canValidate&&<small className="blockHint">{provenance.reason}</small>}</div></article>})}</div>}
    </div>
  </main>;
}
