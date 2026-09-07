'use client';

import { useEffect, useMemo, useState } from 'react';

const universes = [
  { id:'animal', name:'Chroniqueur animalier', icon:'◉', desc:'Minimaliste, expressif, drôle. Un narrateur anthropomorphe au milieu de scènes très lisibles.' },
  { id:'reporter', name:'Petit reporter', icon:'●', desc:'Grosse tête, petit corps, attitude curieuse. Idéal pour enquête, histoire et faits étonnants.' },
  { id:'bird', name:'Oiseau enquêteur', icon:'◆', desc:'Silhouette à bec très reconnaissable, gestuelle forte et dessin volontairement simple.' },
  { id:'notebook', name:'Carnet illustré', icon:'✎', desc:'Trait vivant, texture papier et objets légèrement disproportionnés.' },
  { id:'encyclo', name:'Encyclopédie absurde', icon:'▤', desc:'Décors documentaires détaillés confrontés à un personnage très simple.' },
  { id:'tiny', name:'Mini-aventurier', icon:'▲', desc:'Petit héros dans des décors immenses : monuments, machines, animaux, événements.' },
  { id:'paper', name:'Théâtre de papier', icon:'▰', desc:'Formes découpées, profondeur légère et compositions très graphiques.' },
  { id:'clear', name:'Ligne claire décalée', icon:'○', desc:'Contours nets, peu de détails et expressions concentrées dans la posture et le visage.' }
];

const characters = [
  { id:'bec', name:'Bec', trait:'curieux · sec · expressif', face:'◁ •' },
  { id:'milo', name:'Milo', trait:'malin · calme · observateur', face:'◉‿◉' },
  { id:'pico', name:'Pico', trait:'étonné · vif · attachant', face:'◇•' },
  { id:'nox', name:'Nox', trait:'impassible · drôle · précis', face:'●—●' }
];

const emptyDraft = () => ({ name:'', universe:'bird', character:'bec', tiktoks:[''], youtube:'' });

export default function Home(){
  const [view,setView]=useState('home');
  const [step,setStep]=useState(1);
  const [draft,setDraft]=useState(emptyDraft());
  const [projects,setProjects]=useState([]);
  const [currentId,setCurrentId]=useState(null);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try { setProjects(JSON.parse(localStorage.getItem('maketik-projects') || '[]')); } catch { setProjects([]); }
    setReady(true);
  },[]);
  useEffect(()=>{ if(ready) localStorage.setItem('maketik-projects', JSON.stringify(projects)); },[projects,ready]);

  const current = projects.find(p=>p.id===currentId) || null;
  const selectedUniverse = useMemo(()=>universes.find(x=>x.id===draft.universe),[draft.universe]);
  const selectedCharacter = characters.find(x=>x.id===draft.character);
  const update = patch => setDraft(d=>({...d,...patch}));
  const addTik = () => update({tiktoks:[...draft.tiktoks,'']});
  const updateTik = (i,val) => update({tiktoks:draft.tiktoks.map((x,n)=>n===i?val:x)});

  function startNew(){ setDraft(emptyDraft()); setStep(1); setView('new'); setCurrentId(null); }
  function openProject(id){ setCurrentId(id); setView('project'); }
  function saveProject(){
    const now = new Date().toISOString();
    const project = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name:draft.name.trim(), universe:draft.universe, character:draft.character,
      tiktoks:draft.tiktoks.filter(Boolean), youtube:draft.youtube.trim(),
      createdAt:now, updatedAt:now,
      scripts:[], status:'sources_ready'
    };
    setProjects(v=>[project,...v]); setCurrentId(project.id); setView('project');
  }
  function removeProject(id){ setProjects(v=>v.filter(p=>p.id!==id)); if(currentId===id){setCurrentId(null);setView('home');} }
  function speakDemo(){
    if(!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance('Bienvenue dans Maketik. Ceci est un aperçu de narration française gratuite disponible sur cet appareil.');
    utter.lang='fr-FR'; utter.rate=.96;
    const voices=window.speechSynthesis.getVoices();
    const maleHint=voices.find(v=>v.lang?.startsWith('fr') && /henri|paul|thomas|male|homme/i.test(v.name)) || voices.find(v=>v.lang?.startsWith('fr'));
    if(maleHint) utter.voice=maleHint;
    window.speechSynthesis.speak(utter);
  }

  return <main>
    <header><button className="brand brandBtn" onClick={()=>setView('home')}>MAKE<span>TIK</span></button><div className="tag">studio personnel</div><div className="headerRight"><button onClick={startNew}>+ Nouveau projet</button></div></header>

    {view==='home'&&<div className="homeWrap">
      <div className="hero"><p className="kicker">STUDIO PERSONNEL</p><h1>De tes sources à une série de vidéos courtes.</h1><p className="lead">Chaque projet possède son univers, son personnage, ses références TikTok et sa source YouTube. Maketik garde tout au même endroit.</p><button className="primary large" onClick={startNew}>Créer un projet →</button></div>
      <div className="projectList"><div className="listHead"><b>TES PROJETS</b><span>{projects.length}</span></div>{projects.length===0?<div className="empty">Aucun projet pour l’instant.</div>:projects.map(p=>{const u=universes.find(x=>x.id===p.universe);const c=characters.find(x=>x.id===p.character);return <div className="projectRow" key={p.id}><button className="projectOpen" onClick={()=>openProject(p.id)}><span className="miniPoster">{u?.icon}</span><span><b>{p.name}</b><small>{u?.name} · {c?.name} · {p.tiktoks.length} TikTok</small></span></button><button className="danger" onClick={()=>removeProject(p.id)}>Supprimer</button></div>})}</div>
    </div>}

    {view==='new'&&<div className="shell">
      <aside><div className="eyebrow">NOUVEAU PROJET</div>{['Projet','Univers','Personnage','Sources'].map((x,i)=><button key={x} onClick={()=>setStep(i+1)} className={step===i+1?'active':''}><b>0{i+1}</b>{x}</button>)}</aside>
      <section>
        {step===1&&<><p className="kicker">01 / PROJET</p><h1>Qu’est-ce qu’on raconte ?</h1><p className="lead">Un projet peut produire plusieurs scripts, voix et séries d’illustrations.</p><label>Nom du projet</label><input className="big" value={draft.name} onChange={e=>update({name:e.target.value})} placeholder="Ex. Les histoires incroyables de l’espace"/><div className="actions"><button className="primary" onClick={()=>setStep(2)} disabled={!draft.name.trim()}>Choisir l’univers →</button></div></>}
        {step===2&&<><p className="kicker">02 / UNIVERS</p><h1>Choisis une direction graphique.</h1><p className="lead">Ce choix appartient uniquement à ce projet. Un autre projet pourra utiliser un univers complètement différent.</p><div className="grid">{universes.map(u=><button className={'card '+(draft.universe===u.id?'chosen':'')} key={u.id} onClick={()=>update({universe:u.id})}><div className="poster"><span>{u.icon}</span></div><h3>{u.name}</h3><p>{u.desc}</p></button>)}</div><div className="actions"><button onClick={()=>setStep(1)}>← Retour</button><button className="primary" onClick={()=>setStep(3)}>Choisir le personnage →</button></div></>}
        {step===3&&<><p className="kicker">03 / PERSONNAGE · {selectedUniverse.name.toUpperCase()}</p><h1>Ton personnage récurrent.</h1><p className="lead">Le personnage est verrouillé pour garder une continuité visuelle entre toutes les images du projet.</p><div className="characters">{characters.map(c=><button key={c.id} className={'character '+(draft.character===c.id?'chosen':'')} onClick={()=>update({character:c.id})}><div className="avatar">{c.face}</div><h3>{c.name}</h3><p>{c.trait}</p></button>)}</div><div className="actions"><button onClick={()=>setStep(2)}>← Retour</button><button className="primary" onClick={()=>setStep(4)}>Ajouter les sources →</button></div></>}
        {step===4&&<><p className="kicker">04 / SOURCES</p><h1>Ajoute directement tes liens.</h1><p className="lead">Les TikTok servent de références d’écriture. YouTube fournit la matière à transformer en plusieurs vidéos.</p><div className="source"><div><b>RÉFÉRENCES TIKTOK</b><small>Plusieurs liens sont possibles dans le même projet.</small></div>{draft.tiktoks.map((x,i)=><input key={i} value={x} onChange={e=>updateTik(i,e.target.value)} placeholder="https://www.tiktok.com/…"/>)}<button className="add" onClick={addTik}>+ Ajouter un lien TikTok</button></div><div className="source"><div><b>SOURCE YOUTUBE</b><small>Une première source longue pour extraire plusieurs sujets.</small></div><input value={draft.youtube} onChange={e=>update({youtube:e.target.value})} placeholder="https://www.youtube.com/watch?v=…"/></div><div className="summary"><b>{draft.name}</b><span>{selectedUniverse.name} · {selectedCharacter?.name}</span><span>{draft.tiktoks.filter(Boolean).length} TikTok · {draft.youtube?'1 YouTube':'YouTube manquant'}</span></div><div className="actions"><button onClick={()=>setStep(3)}>← Retour</button><button className="primary" onClick={saveProject} disabled={!draft.name.trim()||!draft.youtube.trim()||!draft.tiktoks.some(Boolean)}>Créer le projet →</button></div></>}
      </section>
    </div>}

    {view==='project'&&current&&<div className="projectPage"><div className="projectTop"><div><p className="kicker">PROJET</p><h1>{current.name}</h1><p className="lead compact">{universes.find(x=>x.id===current.universe)?.name} · {characters.find(x=>x.id===current.character)?.name}</p></div><div className="status">Sources enregistrées</div></div>
      <div className="workspace">
        <div className="panel"><h2>Sources</h2><p className="muted">Références TikTok</p>{current.tiktoks.map((url,i)=><a className="sourceLink" key={url+i} href={url} target="_blank" rel="noreferrer">TikTok {i+1} ↗</a>)}<p className="muted">Source YouTube</p><a className="sourceLink" href={current.youtube} target="_blank" rel="noreferrer">Ouvrir YouTube ↗</a></div>
        <div className="panel"><h2>Pipeline</h2>{[['01','Transcriptions','À brancher'],['02','Analyse éditoriale','À brancher'],['03','Angles & scripts','À brancher'],['04','Validation','Prêt'],['05','Audio','Aperçu gratuit'],['06','Illustrations','À brancher']].map(x=><div className="pipeline" key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><em>{x[2]}</em></div>)}</div>
        <div className="panel"><h2>Voix française</h2><p>Tu peux déjà tester gratuitement une voix française installée sur ton appareil. L’export MP3 automatique sera branché côté serveur ensuite.</p><button className="primary" onClick={speakDemo}>▶ Tester la voix</button></div>
      </div>
    </div>}
  </main>
}
