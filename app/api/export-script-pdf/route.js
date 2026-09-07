import {NextResponse} from 'next/server';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';

export const runtime='nodejs';

const PAGE_WIDTH=595.28;
const PAGE_HEIGHT=841.89;
const MARGIN=52;

function safeText(value){
  return String(value||'')
    .replace(/[\u2018\u2019]/g,"'")
    .replace(/[\u201C\u201D]/g,'"')
    .replace(/[\u2013\u2014]/g,'-')
    .replace(/\u2026/g,'...')
    .replace(/\u2022/g,'-')
    .replace(/\s+/g,' ')
    .trim();
}

function safeFilename(value){
  return safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,70)||'script';
}

function wrapText(text,font,size,maxWidth){
  const words=safeText(text).split(/\s+/).filter(Boolean);
  const lines=[];
  let line='';
  for(const word of words){
    const candidate=line?`${line} ${word}`:word;
    if(font.widthOfTextAtSize(candidate,size)<=maxWidth){
      line=candidate;
    }else{
      if(line) lines.push(line);
      line=word;
    }
  }
  if(line) lines.push(line);
  return lines;
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const script=body.script||{};
  if(script.status!=='validated'){
    return NextResponse.json({ok:false,error:'Seul un script validé peut être exporté en PDF.'},{status:409});
  }
  if(!safeText(script.script)){
    return NextResponse.json({ok:false,error:'Le script validé est vide.'},{status:400});
  }
  if(safeText(script.script).length>50000){
    return NextResponse.json({ok:false,error:'Le script est trop long pour cet export PDF.'},{status:413});
  }

  try{
    const pdf=await PDFDocument.create();
    const regular=await pdf.embedFont(StandardFonts.Helvetica);
    const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
    let page=pdf.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
    let y=PAGE_HEIGHT-MARGIN;
    const width=PAGE_WIDTH-(MARGIN*2);

    const ensureSpace=needed=>{
      if(y-needed<MARGIN){
        page=pdf.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
        y=PAGE_HEIGHT-MARGIN;
      }
    };
    const drawLines=(text,{font=regular,size=11,lineHeight=15,gap=8}={})=>{
      const lines=wrapText(text,font,size,width);
      for(const line of lines){
        ensureSpace(lineHeight);
        page.drawText(line,{x:MARGIN,y,font,size,color:rgb(0.08,0.08,0.08)});
        y-=lineHeight;
      }
      y-=gap;
    };
    const heading=(text,size=12)=>{
      ensureSpace(size+16);
      page.drawText(safeText(text).toUpperCase(),{x:MARGIN,y,font:bold,size,color:rgb(0.08,0.08,0.08)});
      y-=size+10;
    };

    page.drawText('MAKETIK',{x:MARGIN,y,font:bold,size:22,color:rgb(0.05,0.05,0.05)});
    y-=32;
    drawLines(body.projectName||'Projet sans nom',{font:bold,size:16,lineHeight:20,gap:4});
    drawLines(script.title||'Script validé',{font:bold,size:14,lineHeight:18,gap:4});
    drawLines(`Statut : validé${script.validatedAt?` · ${new Date(script.validatedAt).toLocaleDateString('fr-FR')}`:''}`,{size:9,lineHeight:12,gap:16});

    if(script.angle){heading('Angle');drawLines(script.angle,{size:11,lineHeight:15,gap:12});}
    if(script.hook){heading('Hook');drawLines(script.hook,{font:bold,size:12,lineHeight:17,gap:14});}
    heading('Script');
    drawLines(script.script,{size:11,lineHeight:16,gap:14});

    if(Array.isArray(script.sourceFacts)&&script.sourceFacts.length){
      heading('Faits source utilisés');
      for(const fact of script.sourceFacts){
        drawLines(`- ${fact}`,{size:9,lineHeight:13,gap:3});
      }
    }

    ensureSpace(28);
    y-=8;
    drawLines(`Export Maketik · ${new Date().toLocaleString('fr-FR')}`,{size:8,lineHeight:11,gap:0});

    const bytes=await pdf.save();
    const filename=`maketik-${safeFilename(body.projectName)}-${safeFilename(script.title)}.pdf`;
    return new NextResponse(bytes,{status:200,headers:{
      'content-type':'application/pdf',
      'content-disposition':`attachment; filename="${filename}"`,
      'cache-control':'no-store'
    }});
  }catch(error){
    return NextResponse.json({ok:false,error:'Export PDF impossible.',detail:error?.message||'Erreur inconnue'},{status:500});
  }
}
