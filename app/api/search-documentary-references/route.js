import {NextResponse} from 'next/server';

export const runtime='nodejs';

const PROVIDER='wikimedia-commons';
const ENDPOINT='https://commons.wikimedia.org/w/api.php';

function cleanHtml(value){
  return String(value||'')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}

function metaValue(metadata,key){
  return cleanHtml(metadata?.[key]?.value||'')||null;
}

function commonsPageUrl(title){
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(title||'').replace(/ /g,'_')).replace(/%3A/g,':')}`;
}

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  const target=body.target||{};
  if(target.status!=='needs-research'){
    return NextResponse.json({ok:false,error:'Une cible documentaire en attente de recherche est nécessaire.'},{status:409});
  }
  const query=String(target.searchQuery||'').trim();
  if(query.length<3){
    return NextResponse.json({ok:false,error:'La requête documentaire est trop courte.'},{status:400});
  }

  const params=new URLSearchParams({
    action:'query',
    format:'json',
    formatversion:'2',
    generator:'search',
    gsrsearch:query,
    gsrnamespace:'6',
    gsrlimit:'5',
    prop:'imageinfo',
    iiprop:'url|mime|mediatype|extmetadata',
    iiurlwidth:'640',
    iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription|AttributionRequired|UsageTerms'
  });

  try{
    const response=await fetch(`${ENDPOINT}?${params.toString()}`,{
      headers:{'user-agent':'Maketik/0.2 documentary-reference-search (personal studio)'},
      signal:AbortSignal.timeout(10000),
      cache:'no-store'
    });
    if(!response.ok)throw new Error(`Wikimedia HTTP ${response.status}`);
    const data=await response.json();
    if(data?.error)throw new Error(data.error.info||data.error.code||'Erreur Wikimedia');

    const candidates=(data?.query?.pages||[]).map(page=>{
      const info=page.imageinfo?.[0]||{};
      const metadata=info.extmetadata||{};
      return {
        id:`commons:${page.pageid}`,
        provider:PROVIDER,
        verificationStatus:'candidate-unverified',
        title:page.title||null,
        description:metaValue(metadata,'ImageDescription'),
        author:metaValue(metadata,'Artist'),
        credit:metaValue(metadata,'Credit'),
        license:metaValue(metadata,'LicenseShortName')||metaValue(metadata,'UsageTerms'),
        licenseUrl:metadata?.LicenseUrl?.value||null,
        attributionRequired:metaValue(metadata,'AttributionRequired'),
        mime:info.mime||null,
        mediaType:info.mediatype||null,
        thumbnailUrl:info.thumburl||null,
        originalUrl:info.url||null,
        pageUrl:commonsPageUrl(page.title),
        sourceTarget:{shotOrder:target.shotOrder||null,searchQuery:query,sourceFact:target.sourceFact||null},
        limitation:'Résultat de recherche Wikimedia Commons. La présence dans Commons et les métadonnées de licence ne prouvent pas que cette image documente correctement le fait ciblé ; une validation humaine/documentaire reste nécessaire.'
      };
    }).filter(item=>item.originalUrl&&item.mediaType==='BITMAP');

    return NextResponse.json({
      ok:true,
      provider:PROVIDER,
      query,
      searchedAt:new Date().toISOString(),
      candidates,
      limitations:'Recherche réelle effectuée sur Wikimedia Commons. Les résultats sont des candidats non validés ; leur pertinence factuelle, leur attribution et leurs conditions de réutilisation doivent être vérifiées avant usage.'
    });
  }catch(error){
    return NextResponse.json({ok:false,code:'REFERENCE_SEARCH_UNAVAILABLE',error:'La recherche documentaire Wikimedia est indisponible pour le moment.',detail:error?.message||'Erreur inconnue',provider:PROVIDER},{status:502});
  }
}
