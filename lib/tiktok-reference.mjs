function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}

function sentences(text){return clean(text).split(/(?<=[.!?])\s+/).map(clean).filter(Boolean)}

export function prepareTikTokEvidence({source,manualTranscript}){
  if(!source||source.kind!=='tiktok'||source.ok!==true)return null;
  const caption=clean(source.description||source.title);
  const spokenText=clean(manualTranscript);
  const parts=sentences(spokenText);
  const words=spokenText.split(/\s+/).filter(Boolean);
  const metrics=spokenText?{
    wordCount:words.length,
    sentenceCount:parts.length,
    averageWordsPerSentence:parts.length?Number((words.length/parts.length).toFixed(1)):null,
    opensWithQuestion:/\?$/.test(parts[0]||''),
    containsQuestion:/\?/.test(spokenText),
    containsExclamation:/!/.test(spokenText),
    openingExcerpt:parts[0]?.slice(0,220)||spokenText.slice(0,220)||null,
    closingExcerpt:parts.at(-1)?.slice(0,220)||null
  }:null;
  return {
    sourceId:source.sourceId||null,
    url:source.url,
    author:source.author||null,
    authorUrl:source.authorUrl||null,
    caption:caption||null,
    captionProvenance:caption?{provider:'tiktok-oembed',status:'metadata-description',limitations:'La caption/description oEmbed est du texte associé au post, pas une transcription du contenu parlé.'}:null,
    spokenText:spokenText||null,
    spokenTextProvenance:spokenText?{provider:'manual',status:'manual-transcript',capturedAt:new Date().toISOString(),limitations:'Texte saisi manuellement. Maketik ne prétend pas l’avoir extrait automatiquement depuis TikTok.'}:null,
    editorialMetrics:metrics,
    evidenceStatus:spokenText?'manual-spoken-text':'metadata-only',
    allowedUse:'Référence éditoriale de haut niveau uniquement : hook, rythme, structure, transitions, densité, suspense, humour et conclusion. Ne pas copier les formulations ni imiter un créateur identifiable.',
    factualUse:'forbidden',
    limitations:spokenText?'Le texte parlé est manuel ; sa fidélité au TikTok doit être vérifiée par l’utilisateur.':'Aucun texte parlé n’est disponible. Seules les métadonnées/caption du post peuvent être utilisées, sans les requalifier en transcription.'
  };
}
