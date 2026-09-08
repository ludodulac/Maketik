const urls=[
  'https://youtu.be/b1m_6km44JQ?is=p4LLagtOGx3C7kMl',
  'https://youtu.be/horkXy4kMro?is=lbNvJhFt07ZzQJIt',
  'https://youtu.be/xnCHNrVrTTs?is=xvwnCm4VstM5Ns85',
  'https://youtu.be/e9M0bLmRQC0?is=Ksbr7odmymsRyMaC'
];

const response=await fetch('http://127.0.0.1:3000/api/transcribe-youtube',{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({urls})
});
const body=await response.json();
const corpus=body.corpus||{};
console.log(`GAIN_FRIC_HTTP status=${response.status}`);
console.log(`GAIN_FRIC_CORPUS sources=${corpus.sourceCount||0} ready=${corpus.readyCount||0} unavailable=${corpus.unavailableCount||0} words=${corpus.wordCount||0}`);
for(const source of corpus.sources||[]){
  const id=(source.url.match(/youtu\.be\/([^?]+)/)||[])[1]||source.url;
  console.log(`GAIN_FRIC_SOURCE id=${id} status=${source.status} words=${source.wordCount||0} provider=${source.provider||'none'} error=${source.error||'none'} detail=${source.detail||'none'}`);
}
if((corpus.sourceCount||0)!==4) throw new Error(`Expected four sources in corpus response, got ${corpus.sourceCount||0}`);
if((corpus.readyCount||0)===0){
  console.log('GAIN_FRIC_MANUAL_FALLBACK_REQUIRED all_sources_unavailable=true');
}else{
  console.log('GAIN_FRIC_FACTUAL_CORPUS_AVAILABLE');
}
