'use client';

import {useEffect,useState} from 'react';
import YouTubeCorpusWorkspace from '../components/YouTubeCorpusWorkspace';

const defaults=[
 'https://youtu.be/b1m_6km44JQ?is=p4LLagtOGx3C7kMl',
 'https://youtu.be/horkXy4kMro?is=lbNvJhFt07ZzQJIt',
 'https://youtu.be/xnCHNrVrTTs?is=xvwnCm4VstM5Ns85',
 'https://youtu.be/e9M0bLmRQC0?is=Ksbr7odmymsRyMaC'
];

export default function YouTubeCorpusTestPage(){
 const [project,setProject]=useState({id:'gain-fric-test',name:'Gain fric',youtubes:defaults,youtube:defaults[0],youtubeCorpus:null,transcript:null,status:'sources_ready'});
 const [notice,setNotice]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('maketik-gain-fric-corpus');if(saved)setProject(JSON.parse(saved))}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('maketik-gain-fric-corpus',JSON.stringify(project))}catch{}},[project]);
 const updateProject=(id,patch)=>setProject(current=>current.id===id?{...current,...patch}:current);
 return <main><header><div className="brand">MAKE<span>TIK</span></div><div className="tag">test corpus réel</div></header><div className="projectPage"><div className="projectTop"><div><p className="kicker">GAIN FRIC · TEST RÉEL</p><h1>4 sources YouTube, une vérité par source.</h1><p className="lead compact">Les quatre liens sont préchargés. Tente l’automatique, puis colle manuellement uniquement les transcriptions bloquées.</p></div></div>{notice&&<div className="notice">{notice}</div>}<div className="workspace"><YouTubeCorpusWorkspace project={project} updateProject={updateProject} setNotice={setNotice}/><div className="panel"><h2>Corpus factuel actif</h2><p>{project.transcript?.text?'Le corpus combiné est prêt pour la génération de scripts.':'Aucun texte n’est encore autorisé comme fait.'}</p>{project.youtubeCorpus&&<div className="pipeline"><b>{project.youtubeCorpus.readyCount}</b><span>sources prêtes</span><em>{project.youtubeCorpus.unavailableCount} indisponible(s)</em></div>}<small className="blockHint">Cette page de test ne contourne pas YouTube et ne transforme jamais une erreur en transcription.</small></div></div></div></main>;
}
