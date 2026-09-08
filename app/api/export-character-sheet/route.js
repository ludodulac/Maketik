import {NextResponse} from 'next/server';
import {renderCharacterSheet} from '../../../lib/vector-character-sheet.mjs';

export const runtime='nodejs';

function slug(value){return String(value||'character').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'character'}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const bible=body.characterBible||null;
  if(bible?.status!=='validated'){
    return NextResponse.json({ok:false,error:'Une bible personnage validée est nécessaire avant tout export de character sheet.'},{status:409});
  }
  if(!bible.version||!bible.validatedAt||!bible.identityAnchor){
    return NextResponse.json({ok:false,error:'La bible validée ne contient pas assez de provenance canonique pour être exportée.'},{status:422});
  }
  const svg=renderCharacterSheet({projectName:body.projectName,characterBible:bible});
  const filename=`maketik-${slug(body.projectName)}-${slug(bible.characterName)}-character-sheet.svg`;
  return new NextResponse(svg,{status:200,headers:{
    'content-type':'image/svg+xml; charset=utf-8',
    'content-disposition':`attachment; filename="${filename}"`,
    'cache-control':'no-store',
    'x-maketik-visual-provider':'local-vector-sheet',
    'x-maketik-visual-mode':'deterministic-canonical-preview',
    'x-maketik-character-bible-version':String(bible.version),
    'x-maketik-character-bible-validated-at':String(bible.validatedAt)
  }});
}
