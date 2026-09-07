import { NextResponse } from 'next/server';

function youtubeId(raw){
  try{
    const u=new URL(raw);
    if(u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if(u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
  }catch{}
  return null;
}

export async function POST(request){
  const {url}=await request.json().catch(()=>({}));
  if(!url) return NextResponse.json({ok:false,error:'URL manquante'},{status:400});
  let parsed;
  try{ parsed=new URL(url); }catch{ return NextResponse.json({ok:false,error:'URL invalide'},{status:400}); }
  const host=parsed.hostname.replace(/^www\./,'');
  try{
    if(host==='youtu.be'||host.endsWith('youtube.com')){
      const id=youtubeId(url);
      if(!id) throw new Error('Identifiant YouTube introuvable');
      const canonical=`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
      const res=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`,{cache:'no-store'});
      if(!res.ok) throw new Error('Vidéo YouTube inaccessible');
      const data=await res.json();
      return NextResponse.json({ok:true,kind:'youtube',url:canonical,title:data.title,author:data.author_name,thumbnail:data.thumbnail_url,sourceId:id,transcript:{status:'unavailable',reason:'La métadonnée est vérifiée. La transcription nécessite un moteur dédié et n’est pas simulée.'}});
    }
    if(host.endsWith('tiktok.com')){
      const res=await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,{cache:'no-store'});
      if(!res.ok) throw new Error('TikTok inaccessible ou non public');
      const data=await res.json();
      return NextResponse.json({ok:true,kind:'tiktok',url,title:data.title||'TikTok',author:data.author_name,thumbnail:data.thumbnail_url,transcript:{status:'unavailable',reason:'Le lien est vérifié. La transcription audio nécessite un moteur dédié et n’est pas simulée.'}});
    }
    return NextResponse.json({ok:false,error:'Maketik accepte actuellement les liens TikTok et YouTube.'},{status:400});
  }catch(error){
    return NextResponse.json({ok:false,error:error.message||'Source inaccessible'},{status:422});
  }
}
