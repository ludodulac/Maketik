import {NextResponse} from 'next/server';
import {buildLocalVisualPlan} from '../../../lib/visual-plan.mjs';

export const runtime='nodejs';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const script=body.script||{};
  if(script.status!=='validated'){
    return NextResponse.json({ok:false,error:'Seul un script validé peut produire un plan visuel.'},{status:409});
  }
  if(!String(script.script||'').trim()){
    return NextResponse.json({ok:false,error:'Le script validé est vide.'},{status:400});
  }

  const local=buildLocalVisualPlan({script,universe:body.universe,character:body.character});
  if(!local){
    return NextResponse.json({ok:false,code:'VISUAL_PLAN_INSUFFICIENT_SCRIPT',error:'Le script est trop court pour produire honnêtement un plan visuel exploitable.'},{status:422});
  }

  return NextResponse.json({
    ok:true,
    scriptId:script.id||null,
    generatedAt:new Date().toISOString(),
    ...local
  });
}
