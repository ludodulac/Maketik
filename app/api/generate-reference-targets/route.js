import {NextResponse} from 'next/server';
import {buildReferenceTargets} from '../../../lib/reference-targets.mjs';

export const runtime='nodejs';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const visualPlan=body.visualPlan||null;
  if(!visualPlan||visualPlan.status!=='validated'){
    return NextResponse.json({ok:false,error:'Un plan visuel validé est nécessaire avant de préparer les cibles documentaires.'},{status:409});
  }
  if(visualPlan.stale){
    return NextResponse.json({ok:false,error:'Le plan visuel est obsolète par rapport au script source et doit être revalidé.'},{status:409});
  }
  const result=buildReferenceTargets({visualPlan,sourceTitle:body.sourceTitle,sourceUrl:body.sourceUrl});
  if(!result){
    return NextResponse.json({ok:false,error:'Aucune cible documentaire exploitable n’a pu être préparée.'},{status:422});
  }
  return NextResponse.json({ok:true,visualPlanGeneratedAt:visualPlan.generatedAt||null,generatedAt:new Date().toISOString(),...result});
}
