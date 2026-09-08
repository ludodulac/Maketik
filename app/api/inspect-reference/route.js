import {NextResponse} from 'next/server';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

export const runtime='nodejs';

function ipv4Private(ip){
  const p=ip.split('.').map(Number);
  if(p.length!==4||p.some(n=>!Number.isInteger(n)))return false;
  return p[0]===10||p[0]===127||p[0]===0||p[0]>=224||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===198&&(p[1]===18||p[1]===19));
}

function ipv6Private(ip){
  const value=ip.toLowerCase();
  return value==='::1'||value==='::'||value.startsWith('fc')||value.startsWith('fd')||value.startsWith('fe8')||value.startsWith('fe9')||value.startsWith('fea')||value.startsWith('feb')||value.startsWith('::ffff:127.')||value.startsWith('::ffff:10.')||value.startsWith('::ffff:192.168.');
}

function privateAddress(address){
  const family=isIP(address);
  if(family===4)return ipv4Private(address);
  if(family===6)return ipv6Private(address);
  return true;
}

async function assertPublicUrl(raw){
  let url;
  try{url=new URL(raw)}catch{throw new Error('URL invalide')}
  if(url.protocol!=='https:'&&url.protocol!=='http:')throw new Error('Seules les URLs HTTP/HTTPS sont acceptées');
  if(url.username||url.password)throw new Error('Les URLs contenant des identifiants ne sont pas acceptées');
  if(url.hostname==='localhost'||url.hostname.endsWith('.local'))throw new Error('Adresse locale refusée');
  const direct=isIP(url.hostname);
  if(direct&&privateAddress(url.hostname))throw new Error('Adresse privée ou locale refusée');
  if(!direct){
    const addresses=await lookup(url.hostname,{all:true,verbatim:true});
    if(!addresses.length||addresses.some(item=>privateAddress(item.address)))throw new Error('La destination résout vers une adresse privée ou locale');
  }
  return url;
}

async function fetchPublic(raw){
  let current=(await assertPublicUrl(raw)).toString();
  for(let hop=0;hop<5;hop++){
    const response=await fetch(current,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'user-agent':'Maketik/0.2 documentary-reference-verifier','accept':'text/html,image/*,application/pdf;q=0.9,*/*;q=0.5','range':'bytes=0-262143'}});
    if(response.status>=300&&response.status<400){
      const location=response.headers.get('location');
      if(!location)throw new Error('Redirection sans destination');
      current=(await assertPublicUrl(new URL(location,current).toString())).toString();
      continue;
    }
    return {response,finalUrl:current};
  }
  throw new Error('Trop de redirections');
}

function htmlTitle(text){
  return text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240)||null;
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const raw=String(body.url||'').trim();
  if(!raw)return NextResponse.json({ok:false,error:'URL documentaire manquante'},{status:400});
  try{
    const {response,finalUrl}=await fetchPublic(raw);
    const contentType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    const contentLength=Number(response.headers.get('content-length')||0)||null;
    const ok=response.ok||response.status===206;
    if(!ok){
      return NextResponse.json({ok:false,error:`La référence répond HTTP ${response.status}.`,statusCode:response.status,finalUrl,checkedAt:new Date().toISOString()},{status:422});
    }
    let title=null;
    if(contentType.includes('text/html')){
      const reader=response.body?.getReader();
      const decoder=new TextDecoder();
      let text='',bytes=0;
      if(reader){
        while(bytes<262144){
          const {done,value}=await reader.read();
          if(done)break;
          bytes+=value.byteLength;
          text+=decoder.decode(value,{stream:true});
          if(text.includes('</title>'))break;
        }
        reader.cancel().catch(()=>{});
      }
      title=htmlTitle(text);
    }else{
      response.body?.cancel?.().catch(()=>{});
    }
    return NextResponse.json({
      ok:true,
      requestedUrl:raw,
      finalUrl,
      statusCode:response.status,
      contentType:contentType||null,
      contentLength,
      title,
      checkedAt:new Date().toISOString(),
      provenance:{method:'Vérification HTTP directe côté serveur',limitations:'Cette vérification confirme l’accessibilité et le type de ressource. Elle ne prouve pas à elle seule que le contenu soutient le fait documentaire ciblé.'}
    });
  }catch(error){
    return NextResponse.json({ok:false,error:'Référence documentaire inaccessible ou refusée.',detail:error?.message||'Erreur inconnue'},{status:422});
  }
}
