'use client';

import { useMemo, useState } from 'react';

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

export default function Home(){
  const [step,setStep]=useState(1); const [name,setName]=useState('');
  const [universe,setUniverse]=useState('bird'); const [character,setCharacter]=useState('bec');
  const [tiktoks,setTiktoks]=useState(['']); const [youtube,setYoutube]=useState('');
  const selected=useMemo(()=>universes.find(x=>x.id===universe),[universe]);
  const addTik=()=>setTiktoks(v=>[...v,'']);
  const updateTik=(i,val)=>setTiktoks(v=>v.map((x,n)=>n===i?val:x));
  return <main>
    <header><div className="brand">MAKE<span>TIK</span></div><div className="tag">studio personnel</div></header>
    <div className="shell">
      <aside><div className="eyebrow">NOUVEAU PROJET</div>{['Projet','Univers','Personnage','Sources'].map((x,i)=><button key={x} onClick={()=>setStep(i+1)} className={step===i+1?'active':''}><b>0{i+1}</b>{x}</button>)}</aside>
      <section>
        {step===1&&<><p className="kicker">01 / PROJET</p><h1>Qu’est-ce qu’on raconte ?</h1><p className="lead">Un projet peut produire plusieurs scripts, voix et séries d’illustrations.</p><label>Nom du projet</label><input className="big" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Les histoires incroyables de l’espace"/><div className="actions"><button className="primary" onClick={()=>setStep(2)} disabled={!name.trim()}>Choisir l’univers →</button></div></>}
        {step===2&&<><p className="kicker">02 / UNIVERS</p><h1>Choisis une direction graphique.</h1><p className="lead">Ce choix appartient uniquement à ce projet. Tu pourras en choisir un autre au prochain.</p><div className="grid">{universes.map(u=><button className={'card '+(universe===u.id?'chosen':'')} key={u.id} onClick={()=>setUniverse(u.id)}><div className="poster"><span>{u.icon}</span></div><h3>{u.name}</h3><p>{u.desc}</p></button>)}</div><div className="actions"><button onClick={()=>setStep(1)}>← Retour</button><button className="primary" onClick={()=>setStep(3)}>Choisir le personnage →</button></div></>}
        {step===3&&<><p className="kicker">03 / PERSONNAGE · {selected.name.toUpperCase()}</p><h1>Ton personnage récurrent.</h1><p className="lead">Premières propositions. La version suivante générera de vraies planches de personnages à valider.</p><div className="characters">{characters.map(c=><button key={c.id} className={'character '+(character===c.id?'chosen':'')} onClick={()=>setCharacter(c.id)}><div className="avatar">{c.face}</div><h3>{c.name}</h3><p>{c.trait}</p></button>)}</div><div className="actions"><button onClick={()=>setStep(2)}>← Retour</button><button className="primary" onClick={()=>setStep(4)}>Ajouter les sources →</button></div></>}
        {step===4&&<><p className="kicker">04 / SOURCES</p><h1>Donne-moi la matière.</h1><p className="lead">Les TikTok servent de références d’écriture. YouTube fournit la matière à transformer en plusieurs vidéos.</p><div className="source"><div><b>RÉFÉRENCES TIKTOK</b><small>Analyse fine du rythme, hook, structure, ton et mécanique narrative.</small></div>{tiktoks.map((x,i)=><input key={i} value={x} onChange={e=>updateTik(i,e.target.value)} placeholder="https://www.tiktok.com/…"/>)}<button className="add" onClick={addTik}>+ Ajouter un lien TikTok</button></div><div className="source"><div><b>SOURCE YOUTUBE</b><small>La transcription sera découpée en sujets et angles exploitables.</small></div><input value={youtube} onChange={e=>setYoutube(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></div><div className="summary"><b>{name}</b><span>{selected.name} · {characters.find(c=>c.id===character)?.name}</span><span>{tiktoks.filter(Boolean).length} TikTok · {youtube?'1 YouTube':'YouTube manquant'}</span></div><div className="actions"><button onClick={()=>setStep(3)}>← Retour</button><button className="primary" disabled={!youtube||!tiktoks.some(Boolean)}>Créer le projet →</button></div></>}
      </section>
    </div>
  </main>
}
