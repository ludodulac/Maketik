import {NextResponse} from 'next/server';
import {prepareTikTokEvidence} from '../../../lib/tiktok-reference.mjs';

export const runtime='nodejs';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const evidence=prepareTikTokEvidence({source:body.source,manualTranscript:body.manualTranscript});
  if(!evidence){
    return NextResponse.json({ok:false,error:'Une source TikTok vérifiée est nécessaire avant de préparer une référence éditoriale.'},{status:409});
  }
  return NextResponse.json({ok:true,evidence,preparedAt:new Date().toISOString()});
}
