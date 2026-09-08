import fs from 'node:fs';

const path='app/page.js';
let source=fs.readFileSync(path,'utf8');

function replaceOnce(label, before, after){
  if(source.includes(after)) return;
  const count=source.split(before).length-1;
  if(count!==1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source=source.replace(before,after);
}

replaceOnce('import corpus workspace',
"import CharacterBibleWorkspace from './components/CharacterBibleWorkspace';",
"import CharacterBibleWorkspace from './components/CharacterBibleWorkspace';\nimport YouTubeCorpusWorkspace from './components/YouTubeCorpusWorkspace';");

replaceOnce('draft youtube list',
"const emptyDraft=()=>({name:'',universe:'bird',character:'bec',tiktoks:[''],youtube:''});",
"const emptyDraft=()=>({name:'',universe:'bird',character:'bec',tiktoks:[''],youtubes:[''],youtube:''});");

replaceOnce('save project multi youtube',
"function saveProject(){const now=new Date().toISOString();const p={id:uid(),name:draft.name.trim(),universe:draft.universe,character:draft.character,tiktoks:draft.tiktoks.filter(Boolean),youtube:draft.youtube.trim(),createdAt:now,updatedAt:now,scripts:[],status:'sources_ready',inspection:null,transcript:null,tiktokEvidence:{},editorialProfile:null,characterBible:null,visualPlan:null,referenceResearch:null,referenceSearches:{},documentaryReferences:[]};setProjects(v=>[p,...v]);setCurrentId(p.id);setView('project')}",
"function saveProject(){const now=new Date().toISOString();const youtubes=[...new Set((draft.youtubes||[]).map(x=>x.trim()).filter(Boolean))];const legacyYoutube=(youtubes[0]||draft.youtube||'').trim();const p={id:uid(),name:draft.name.trim(),universe:draft.universe,character:draft.character,tiktoks:draft.tiktoks.filter(Boolean),youtubes,youtube:legacyYoutube,createdAt:now,updatedAt:now,scripts:[],status:'sources_ready',inspection:null,transcript:null,youtubeCorpus:null,tiktokEvidence:{},editorialProfile:null,characterBible:null,visualPlan:null,referenceResearch:null,referenceSearches:{},documentaryReferences:[]};setProjects(v=>[p,...v]);setCurrentId(p.id);setView('project')}");

replaceOnce('inspect multi youtube',
"async function inspectSources(){if(!current||inspecting)return;setInspecting(true);setNotice('');const tik=await Promise.all(current.tiktoks.map(async url=>{try{return await inspectOne(url)}catch{return{ok:false,url,error:'Échec réseau'}}}));let yt;try{yt=await inspectOne(current.youtube)}catch{yt={ok:false,url:current.youtube,error:'Échec réseau'}}const ok=tik.every(x=>x.ok)&&yt.ok;updateProject(current.id,{inspection:{tiktoks:tik,youtube:yt,checkedAt:new Date().toISOString()},status:ok?'sources_verified':'sources_attention'});setInspecting(false)}",
"async function inspectSources(){if(!current||inspecting)return;setInspecting(true);setNotice('');const tik=await Promise.all(current.tiktoks.map(async url=>{try{return await inspectOne(url)}catch{return{ok:false,url,error:'Échec réseau'}}}));const youtubeUrls=Array.isArray(current.youtubes)&&current.youtubes.length?current.youtubes:[current.youtube].filter(Boolean);const youtubes=await Promise.all(youtubeUrls.map(async url=>{try{return await inspectOne(url)}catch{return{ok:false,url,error:'Échec réseau'}}}));const yt=youtubes[0]||null;const ok=tik.every(x=>x.ok)&&youtubes.length>0&&youtubes.every(x=>x.ok);updateProject(current.id,{inspection:{tiktoks:tik,youtubes,youtube:yt,checkedAt:new Date().toISOString()},status:ok?'sources_verified':'sources_attention'});setInspecting(false)}");

replaceOnce('home copy',
"Chaque projet possède son univers, son personnage, ses références TikTok et sa source YouTube.",
"Chaque projet possède son univers, son personnage, ses références TikTok et ses sources YouTube.");

replaceOnce('home project source count',
"{u?.name} · {c?.name} · {p.tiktoks.length} TikTok · {statusLabel[p.status]||p.status}",
"{u?.name} · {c?.name} · {p.tiktoks.length} TikTok · {(p.youtubes?.length||[p.youtube].filter(Boolean).length)} YouTube · {statusLabel[p.status]||p.status}");

replaceOnce('creation youtube inputs',
"<div className=\"source\"><div><b>SOURCE YOUTUBE</b><small>Une source longue pour extraire plusieurs sujets.</small></div><input value={draft.youtube} onChange={e=>update({youtube:e.target.value})} placeholder=\"https://www.youtube.com/watch?v=…\"/></div><div className=\"summary\"><b>{draft.name}</b><span>{selectedUniverse.name} · {selectedCharacter?.name}</span><span>{draft.tiktoks.filter(Boolean).length} TikTok · {draft.youtube?'1 YouTube':'YouTube manquant'}</span></div><div className=\"actions\"><button onClick={()=>setStep(3)}>← Retour</button><button className=\"primary\" onClick={saveProject} disabled={!draft.name.trim()||!draft.youtube.trim()||!draft.tiktoks.some(Boolean)}>Créer le projet →</button></div>",
"<div className=\"source\"><div><b>SOURCES YOUTUBE</b><small>Ajoute une ou plusieurs vidéos longues. Chaque transcription garde sa provenance.</small></div>{(draft.youtubes||['']).map((x,i)=><input key={i} value={x} onChange={e=>update({youtubes:(draft.youtubes||['']).map((v,n)=>n===i?e.target.value:v)})} placeholder=\"https://www.youtube.com/watch?v=…\"/>)}<button className=\"add\" onClick={()=>update({youtubes:[...(draft.youtubes||[]),'']})}>+ Ajouter un lien YouTube</button></div><div className=\"summary\"><b>{draft.name}</b><span>{selectedUniverse.name} · {selectedCharacter?.name}</span><span>{draft.tiktoks.filter(Boolean).length} TikTok · {(draft.youtubes||[]).filter(Boolean).length?`${(draft.youtubes||[]).filter(Boolean).length} YouTube`:'YouTube manquant'}</span></div><div className=\"actions\"><button onClick={()=>setStep(3)}>← Retour</button><button className=\"primary\" onClick={saveProject} disabled={!draft.name.trim()||!(draft.youtubes||[]).some(x=>x.trim())||!draft.tiktoks.some(Boolean)}>Créer le projet →</button></div>");

replaceOnce('source inspection multi youtube',
"<p className=\"muted\">YouTube</p><SourceResult source={current.inspection.youtube} fallback=\"YouTube\"/>",
"<p className=\"muted\">YouTube</p>{(current.inspection.youtubes||[current.inspection.youtube].filter(Boolean)).map((s,i)=><SourceResult key={i} source={s} fallback={'YouTube '+(i+1)}/>)}");

replaceOnce('workspace corpus component',
"<div className=\"panel wide\"><h2>2. Transcription YouTube</h2><p>Maketik tente d’utiliser les sous-titres disponibles. Si YouTube les bloque, la source reste intacte et tu peux fournir le texte manuellement.</p><div className=\"inlineActions\"><button className=\"primary\" onClick={transcribeYoutube} disabled={transcribing}>{transcribing?'Transcription…':'Transcrire automatiquement'}</button>{current.transcript?.wordCount&&<span className=\"chip\">{current.transcript.wordCount} mots</span>}</div><textarea className=\"transcript\" value={manualTranscript} onChange={e=>setManualTranscript(e.target.value)} placeholder=\"La transcription apparaîtra ici. En secours, colle-la manuellement.\"/><div className=\"inlineActions\"><button onClick={saveManualTranscript} disabled={!manualTranscript.trim()}>Enregistrer ce texte</button>{current.transcript?.provider&&<small>Source texte : {current.transcript.provider}</small>}</div></div>",
"<YouTubeCorpusWorkspace project={current} updateProject={updateProject} setNotice={setNotice}/>");

replaceOnce('pipeline label corpus',
"['03','Transcription YouTube',current.transcript?.text?'Prête':'À faire']",
"['03','Corpus YouTube',current.transcript?.text?(current.youtubeCorpus?`${current.youtubeCorpus.readyCount}/${current.youtubeCorpus.sourceCount} prêtes`:'Prêt'):'À faire']");

fs.writeFileSync(path,source);
console.log('MAIN_YOUTUBE_CORPUS_INTEGRATION_PATCHED');
