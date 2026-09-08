'use client';
import {useMemo,useState} from 'react';

export default function DocumentaryReferenceWorkspace({project,updateProject,setNotice}){
  const[preparing,setPreparing]=useState(false);
  const[searching,setSearching]=useState(null);
  const[checking,setChecking]=useState(null);
  const plan=project.visualPlan;
  const planKey=`${plan?.scriptId||'script'}:${plan?.generatedAt||'unknown'}`;
  const storedResearch=project.referenceResearch||null;
  const research=storedResearch?.visualPlanGeneratedAt===plan?.generatedAt?storedResearch:null;
  const searches=project.referenceSearches||{};
  const allReferences=project.documentaryReferences||[];
  const validated=allReferences.filter(item=>item.planKey===planKey);
  const validatedByShot=useMemo(()=>Object.fromEntries(validated.map(item=>[String(item.shotOrder),item])),[validated]);
  const shotKey=shotOrder=>`${planKey}:${shotOrder}`;

  async function prepareTargets(){
    if(!plan||plan.status!=='validated'||plan.stale||preparing)return;
    setPreparing(true);setNotice('');
    try{
      const r=await fetch('/api/generate-reference-targets',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visualPlan:plan,sourceTitle:project.inspection?.youtube?.title,sourceUrl:project.youtube})});
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.error||'Préparation documentaire impossible');
      updateProject(project.id,{referenceResearch:data});
      setNotice(`${data.targets.length} cibles documentaires préparées. Ce sont des besoins de recherche, pas encore des références.`);
    }catch(error){setNotice(error.message)}finally{setPreparing(false)}
  }

  async function searchTarget(target){
    const key=shotKey(target.shotOrder);
    if(searching===key)return;
    setSearching(key);setNotice('');
    try{
      const r=await fetch('/api/search-documentary-references',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({target})});
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.error||'Recherche documentaire impossible');
      updateProject(project.id,{referenceSearches:{...searches,[key]:{...data,target,planKey,selectedCandidateId:null}}});
      setNotice(`${data.candidates.length} candidat(s) Commons trouvé(s) pour le plan ${target.shotOrder}. Aucun n’est encore validé.`);
    }catch(error){setNotice(error.message)}finally{setSearching(null)}
  }

  async function inspectCandidate(target,candidate){
    const key=shotKey(target.shotOrder);
    if(checking===candidate.id)return;
    setChecking(candidate.id);setNotice('');
    try{
      const r=await fetch('/api/inspect-reference',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:candidate.originalUrl})});
      const data=await r.json();
      if(!r.ok||!data.ok)throw new Error(data.error||'Vérification de la référence impossible');
      const currentSearch=searches[key]||{};
      const candidates=(currentSearch.candidates||[]).map(item=>item.id===candidate.id?{...item,verificationStatus:'http-verified',inspection:data}:item);
      updateProject(project.id,{referenceSearches:{...searches,[key]:{...currentSearch,candidates,selectedCandidateId:candidate.id}}});
      setNotice('URL réellement vérifiée. La pertinence factuelle reste à valider humainement.');
    }catch(error){setNotice(error.message)}finally{setChecking(null)}
  }

  function validateCandidate(target,candidate){
    if(candidate.verificationStatus!=='http-verified'||!candidate.inspection?.ok)return;
    const reference={planKey,scriptId:plan.scriptId||null,visualPlanGeneratedAt:plan.generatedAt||null,shotOrder:target.shotOrder,target,candidate,inspection:candidate.inspection,status:'validated',validatedAt:new Date().toISOString()};
    const next=[...allReferences.filter(item=>!(item.planKey===planKey&&item.shotOrder===target.shotOrder)),reference].sort((a,b)=>(a.validatedAt||'').localeCompare(b.validatedAt||''));
    updateProject(project.id,{documentaryReferences:next});
    setNotice(`Référence documentaire du plan ${target.shotOrder} validée pour ce plan visuel précis. Elle sera conservée jusqu’à retrait explicite.`);
  }

  function removeValidation(shotOrder){
    updateProject(project.id,{documentaryReferences:allReferences.filter(item=>!(item.planKey===planKey&&item.shotOrder===shotOrder))});
    setNotice(`Validation documentaire du plan ${shotOrder} retirée.`);
  }

  if(!plan||plan.status!=='validated')return null;
  if(plan.stale)return <div className="scriptsArea"><div className="notice">Le plan visuel est obsolète. Les recherches documentaires sont bloquées jusqu’à revalidation du script et du plan.</div></div>;

  return <div className="scriptsArea">
    <div className="sectionTitle"><div><p className="kicker">RÉFÉRENCES DOCUMENTAIRES</p><h2>Du besoin visuel à une source validée</h2></div><span>{validated.length}/{plan.shots?.length||0} validée(s)</span></div>
    <p className="lead compact">Maketik sépare volontairement candidat trouvé, URL accessible et validation documentaire. Une recherche ou un HTTP 200 ne suffisent jamais à valider une image.</p>
    {!research&&<div className="inlineActions"><button className="primary" onClick={prepareTargets} disabled={preparing}>{preparing?'Préparation…':'Préparer les cibles documentaires'}</button></div>}
    {research?.limitations&&<small className="blockHint">{research.limitations}</small>}
    {(research?.targets||[]).map(target=>{
      const key=shotKey(target.shotOrder),search=searches[key],reference=validatedByShot[String(target.shotOrder)];
      return <article className={'scriptCard '+(reference?'validated':'')} key={key}>
        <div className="scriptHead"><div><span className="scriptNo">PLAN {String(target.shotOrder).padStart(2,'0')}</span><h3>{target.researchIntent}</h3><p>{target.searchQuery}</p></div><span className="chip">{reference?'référence validée':'à documenter'}</span></div>
        <blockquote>{target.sourceFact||target.narrationExcerpt}</blockquote>
        {reference?<div>
          {reference.candidate.thumbnailUrl&&<img src={reference.candidate.thumbnailUrl} alt="" style={{maxWidth:'240px',borderRadius:'12px'}}/>}
          <p><b>{reference.candidate.title}</b></p><p>{reference.candidate.author||reference.candidate.credit||'Auteur non fourni'}</p><p>{reference.candidate.license||'Licence non fournie'}{reference.candidate.attributionRequired?` · attribution ${reference.candidate.attributionRequired}`:''}</p>
          <div className="inlineActions"><a href={reference.candidate.pageUrl} target="_blank" rel="noreferrer">Ouvrir la page Commons</a><button onClick={()=>removeValidation(target.shotOrder)}>Retirer la validation</button></div>
          <small className="blockHint">Validée humainement le {new Date(reference.validatedAt).toLocaleString('fr-FR')}. L’URL a été vérifiée séparément, mais la décision de pertinence reste humaine.</small>
        </div>:<>
          <div className="inlineActions"><button onClick={()=>searchTarget(target)} disabled={searching===key}>{searching===key?'Recherche…':'Rechercher sur Wikimedia Commons'}</button></div>
          {search?.limitations&&<small className="blockHint">{search.limitations}</small>}
          {(search?.candidates||[]).map(candidate=><div className="sourceResult" key={candidate.id} style={{alignItems:'flex-start'}}>
            {candidate.thumbnailUrl&&<img src={candidate.thumbnailUrl} alt=""/>}<div><b>{candidate.title}</b><small>{candidate.author||candidate.credit||'Auteur non fourni'} · {candidate.license||'Licence non fournie'}</small><small>{candidate.verificationStatus==='http-verified'?'URL vérifiée · pertinence à valider':'Candidat trouvé · non vérifié'}</small><div className="inlineActions"><a href={candidate.pageUrl} target="_blank" rel="noreferrer">Voir sur Commons</a>{candidate.verificationStatus==='http-verified'?<button className="primary" onClick={()=>validateCandidate(target,candidate)}>✓ Valider cette référence</button>:<button onClick={()=>inspectCandidate(target,candidate)} disabled={checking===candidate.id}>{checking===candidate.id?'Vérification…':'Vérifier réellement l’URL'}</button>}</div></div>
          </div>)}
        </>}
      </article>;
    })}
  </div>;
}
