'use client';
import {useState} from 'react';

const EDITABLE_FIELDS=[
  ['identityAnchor','Ancre d’identité'],
  ['silhouette','Silhouette'],
  ['face','Visage'],
  ['proportions','Proportions'],
  ['clothing','Vêtements'],
  ['recurringProps','Accessoires récurrents'],
  ['expressions','Expressions'],
  ['universeRule','Règle d’univers'],
  ['paletteGuidance','Palette']
];

export default function CharacterBibleWorkspace({project,universeName,characterName,updateProject,setNotice}){
  const[generating,setGenerating]=useState(false);
  const[exporting,setExporting]=useState(false);
  const bible=project.characterBible||null;

  async function generate(){
    if(generating)return;
    setGenerating(true);setNotice('');
    try{
      const r=await fetch('/api/generate-character-bible',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({characterId:project.character,universeId:project.universe,characterName,universeName,existingBible:bible})});
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.error||'Bible personnage impossible');
      updateProject(project.id,{characterBible:{...data.bible,generatedAt:data.generatedAt}});
      setNotice('Bible personnage structurelle préparée. Elle reste éditable tant qu’elle n’est pas validée.');
    }catch(error){setNotice(error.message)}finally{setGenerating(false)}
  }

  function edit(field,value){
    if(!bible||bible.status==='validated')return;
    updateProject(project.id,{characterBible:{...bible,[field]:value,editedAt:new Date().toISOString()}});
  }

  function validate(){
    if(!bible||bible.status==='validated')return;
    updateProject(project.id,{characterBible:{...bible,status:'validated',validatedAt:new Date().toISOString()}});
    setNotice('Bible personnage validée et verrouillée. Toute modification nécessite maintenant de retirer explicitement la validation.');
  }

  function unvalidate(){
    if(!bible)return;
    updateProject(project.id,{characterBible:{...bible,status:'proposed'}});
    setNotice('Validation de la bible retirée. Les champs redeviennent éditables.');
  }

  async function exportSheet(){
    if(!bible||bible.status!=='validated'||exporting)return;
    setExporting(true);setNotice('');
    try{
      const r=await fetch('/api/export-character-sheet',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectName:project.name,characterBible:bible})});
      if(!r.ok){const data=await r.json().catch(()=>({}));throw new Error(data.error||'Export character sheet impossible')}
      const blob=await r.blob();
      if(!String(blob.type).startsWith('image/svg+xml')||blob.size<1000)throw new Error('Le serveur n’a pas renvoyé un SVG exploitable');
      const disposition=r.headers.get('content-disposition')||'';
      const filename=disposition.match(/filename="([^"]+)"/)?.[1]||'maketik-character-sheet.svg';
      const provider=r.headers.get('x-maketik-visual-provider')||'unknown';
      const mode=r.headers.get('x-maketik-visual-mode')||'unknown';
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      const visualExport={id:globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random()),type:'character-sheet',provider,mode,bibleVersion:bible.version,bibleValidatedAt:bible.validatedAt,bytes:blob.size,downloadedAt:new Date().toISOString(),status:'downloaded'};
      updateProject(project.id,{visualExports:[...(project.visualExports||[]),visualExport]});
      setNotice(`Character sheet SVG réellement générée et téléchargée · ${blob.size} octets. Rendu ${provider}, non IA et non final.`);
    }catch(error){setNotice(error.message)}finally{setExporting(false)}
  }

  return <div className="scriptsArea">
    <div className="sectionTitle"><div><p className="kicker">BIBLE PERSONNAGE CANONIQUE</p><h2>{characterName} · {universeName}</h2></div><span>{bible?.status==='validated'?'validée et verrouillée':bible?'à valider':'à préparer'}</span></div>
    <p className="lead compact">Cette bible fixe les invariants du personnage au niveau du projet. Une fois validée, Maketik peut en exporter une character sheet vectorielle déterministe. Ce rendu local n’est ni une image IA ni un design final approuvé.</p>
    {!bible&&<button className="primary" onClick={generate} disabled={generating}>{generating?'Préparation…':'Préparer la bible canonique'}</button>}
    {bible&&<>
      {EDITABLE_FIELDS.map(([field,label])=><div className="source" key={field}><div><b>{label.toUpperCase()}</b></div><textarea className="transcript" value={bible[field]||''} onChange={e=>edit(field,e.target.value)} readOnly={bible.status==='validated'}/></div>)}
      <div className="source"><div><b>RÈGLES DE CONTINUITÉ</b><small>Invariants protégés entre les plans.</small></div><ul>{(bible.continuityRules||[]).map((rule,index)=><li key={index}>{rule}</li>)}</ul></div>
      {bible.limitations&&<small className="blockHint">{bible.limitations}</small>}
      <div className="inlineActions">{bible.status==='validated'?<><button className="primary" onClick={exportSheet} disabled={exporting}>{exporting?'Export SVG…':'↓ Télécharger la character sheet SVG'}</button><button onClick={unvalidate}>Retirer la validation de la bible</button></>:<><button className="primary" onClick={validate}>✓ Valider et verrouiller la bible</button><button onClick={generate} disabled={generating}>{generating?'Régénération…':'Régénérer la proposition structurelle'}</button></>}</div>
      {(project.visualExports||[]).filter(item=>item.type==='character-sheet'&&item.bibleValidatedAt===bible.validatedAt).length>0&&<small className="blockHint">{(project.visualExports||[]).filter(item=>item.type==='character-sheet'&&item.bibleValidatedAt===bible.validatedAt).length} character sheet(s) exportée(s) pour cette version validée.</small>}
    </>}
  </div>;
}
