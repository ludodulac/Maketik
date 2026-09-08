import {NextResponse} from 'next/server';
import {buildLocalVisualPlan} from '../../../lib/visual-plan.mjs';
import {scriptFactProvenanceStatus} from '../../../lib/script-state.mjs';

export const runtime='nodejs';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const script=body.script||{};
  const characterBible=body.characterBible||null;
  if(script.status!=='validated'){
    return NextResponse.json({ok:false,error:'Seul un script validé peut produire un plan visuel.'},{status:409});
  }
  const provenance=scriptFactProvenanceStatus(script);
  if(!provenance.canValidate){
    return NextResponse.json({
      ok:false,
      code:'SCRIPT_FACT_PROVENANCE_UNVERIFIED',
      error:'Le script contient des faits dont la provenance YouTube n’est pas vérifiée.',
      provenance
    },{status:409});
  }
  if(characterBible?.status!=='validated'){
    return NextResponse.json({ok:false,error:'Une bible personnage validée est nécessaire avant de produire un nouveau plan visuel.'},{status:409});
  }
  if(!String(script.script||'').trim()){
    return NextResponse.json({ok:false,error:'Le script validé est vide.'},{status:400});
  }

  const local=buildLocalVisualPlan({script,universe:body.universe,character:body.character,characterBible});
  if(!local){
    return NextResponse.json({ok:false,code:'VISUAL_PLAN_INSUFFICIENT_SCRIPT',error:'Le script est trop court pour produire honnêtement un plan visuel exploitable.'},{status:422});
  }

  const verifiedFacts=(Array.isArray(script.sourceFactsDetailed)?script.sourceFactsDetailed:[])
    .filter(fact=>fact?.provenanceVerified===true)
    .map(fact=>({
      text:String(fact.text||'').trim(),
      sourceLabel:String(fact.sourceLabel||'').trim(),
      sourceUrl:String(fact.sourceUrl||'').trim(),
      sourceExcerpt:String(fact.sourceExcerpt||'').trim(),
      provenanceVerified:true
    }));

  return NextResponse.json({
    ok:true,
    scriptId:script.id||null,
    factualProvenance:{
      hasStructuredProvenance:provenance.hasStructuredProvenance,
      factCount:provenance.factCount,
      verifiedCount:provenance.verifiedCount,
      facts:verifiedFacts
    },
    characterBible:{
      version:characterBible.version||null,
      characterId:characterBible.characterId||null,
      validatedAt:characterBible.validatedAt||null,
      identityAnchor:characterBible.identityAnchor||null
    },
    generatedAt:new Date().toISOString(),
    ...local
  });
}
