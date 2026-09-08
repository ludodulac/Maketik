import {NextResponse} from 'next/server';
import {buildCharacterBible} from '../../../lib/character-bible.mjs';

export const runtime='nodejs';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  if(body.existingBible?.status==='validated'){
    return NextResponse.json({ok:false,error:'La bible personnage actuelle est validée. Retire explicitement sa validation avant toute régénération.'},{status:409});
  }
  if(!body.characterId||!body.universeId){
    return NextResponse.json({ok:false,error:'Univers et personnage du projet sont nécessaires.'},{status:400});
  }
  const bible=buildCharacterBible(body);
  return NextResponse.json({ok:true,bible,generatedAt:new Date().toISOString()});
}
