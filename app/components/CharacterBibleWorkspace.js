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

  return <div className="scriptsArea">
    <div className="sectionTitle"><div><p className="kicker">BIBLE PERSONNAGE CANONIQUE</p><h2>{characterName} · {universeName}</h2></div><span>{bible?.status==='validated'?'validée et verrouillée':bible?'à valider':'à préparer'}</span></div>
    <p className="lead compact">Cette bible fixe les invariants du personnage au niveau du projet. Elle reste textuelle : aucune image finale n’est générée à cette étape.</p>
    {!bible&&<button className="primary" onClick={generate} disabled={generating}>{generating?'Préparation…':'Préparer la bible canonique'}</button>}
    {bible&&<>
      {EDITABLE_FIELDS.map(([field,label])=><div className="source" key={field}><div><b>{label.toUpperCase()}</b></div><textarea className="transcript" value={bible[field]||''} onChange={e=>edit(field,e.target.value)} readOnly={bible.status==='validated'}/></div>)}
      <div className="source"><div><b>RÈGLES DE CONTINUITÉ</b><small>Invariants protégés entre les plans.</small></div><ul>{(bible.continuityRules||[]).map((rule,index)=><li key={index}>{rule}</li>)}</ul></div>
      {bible.limitations&&<small className="blockHint">{bible.limitations}</small>}
      <div className="inlineActions">{bible.status==='validated'?<button onClick={unvalidate}>Retirer la validation de la bible</button>:<><button className="primary" onClick={validate}>✓ Valider et verrouiller la bible</button><button onClick={generate} disabled={generating}>{generating?'Régénération…':'Régénérer la proposition structurelle'}</button></>}</div>
    </>}
  </div>;
}
