function esc(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]))}
function wrap(value,max=42){const words=String(value||'').split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines.slice(0,5)}
function textLines(value,x,y,{size=22,weight=400,gap=30,max=42}={}){return wrap(value,max).map((line,i)=>`<text x="${x}" y="${y+i*gap}" font-size="${size}" font-weight="${weight}" font-family="Arial, Helvetica, sans-serif" fill="#191713">${esc(line)}</text>`).join('')}
function birdFigure(cx,cy,pose='front'){
 const flip=pose==='left'?-1:1, side=pose==='side';
 const headX=cx+(side?12*flip:0), eyeX=headX+(side?18*flip:12*flip);
 const beak=side?`${headX+36*flip},${cy-50} ${headX+86*flip},${cy-36} ${headX+38*flip},${cy-17}`:`${headX+26*flip},${cy-47} ${headX+72*flip},${cy-34} ${headX+28*flip},${cy-18}`;
 return `<g stroke="#191713" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">
 <ellipse cx="${headX}" cy="${cy-45}" rx="52" ry="49" fill="#f4efe3"/>
 <polygon points="${beak}" fill="#dfb04a"/>
 <circle cx="${eyeX}" cy="${cy-58}" r="6" fill="#191713" stroke="none"/>
 <path d="M ${cx-38} ${cy+5} Q ${cx} ${cy-10} ${cx+38} ${cy+5} L ${cx+29} ${cy+92} Q ${cx} ${cy+112} ${cx-29} ${cy+92} Z" fill="#e8dfcc"/>
 <path d="M ${cx-22} ${cy+93} L ${cx-28} ${cy+145} M ${cx+22} ${cy+93} L ${cx+28} ${cy+145}"/>
 <path d="M ${cx-29} ${cy+26} L ${cx-70} ${cy+63} M ${cx+29} ${cy+26} L ${cx+70} ${cy+63}"/>
 <path d="M ${cx-38} ${cy+17} Q ${cx} ${cy+5} ${cx+38} ${cy+17}"/>
 </g>`
}
function roundFigure(cx,cy,pose='front'){
 const side=pose==='side', eyeShift=side?16:12;
 return `<g stroke="#191713" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">
 <circle cx="${cx}" cy="${cy-43}" r="54" fill="#f4efe3"/>
 <circle cx="${cx-eyeShift}" cy="${cy-54}" r="6" fill="#191713" stroke="none"/>${side?'':`<circle cx="${cx+eyeShift}" cy="${cy-54}" r="6" fill="#191713" stroke="none"/>`}
 <path d="M ${cx-10} ${cy-27} Q ${cx} ${cy-20} ${cx+10} ${cy-27}"/>
 <rect x="${cx-37}" y="${cy+8}" width="74" height="92" rx="28" fill="#e8dfcc"/>
 <path d="M ${cx-20} ${cy+99} L ${cx-25} ${cy+147} M ${cx+20} ${cy+99} L ${cx+25} ${cy+147} M ${cx-37} ${cy+34} L ${cx-72} ${cy+64} M ${cx+37} ${cy+34} L ${cx+72} ${cy+64}"/>
 </g>`
}
function angularFigure(cx,cy){return `<g stroke="#191713" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><polygon points="${cx-52},${cy-60} ${cx+4},${cy-91} ${cx+55},${cy-50} ${cx+43},${cy+7} ${cx-35},${cy+5}" fill="#f4efe3"/><circle cx="${cx+9}" cy="${cy-49}" r="7" fill="#191713" stroke="none"/><path d="M ${cx-30} ${cy+18} Q ${cx} ${cy+3} ${cx+30} ${cy+18} L ${cx+23} ${cy+98} L ${cx-23} ${cy+98} Z" fill="#e8dfcc"/><path d="M ${cx-17} ${cy+98} L ${cx-27} ${cy+146} M ${cx+17} ${cy+98} L ${cx+27} ${cy+146} M ${cx-27} ${cy+39} L ${cx-65} ${cy+69} M ${cx+27} ${cy+39} L ${cx+65} ${cy+69}"/></g>`}
function blockFigure(cx,cy){return `<g stroke="#191713" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="${cx-51}" y="${cy-91}" width="102" height="96" rx="25" fill="#f4efe3"/><circle cx="${cx-16}" cy="${cy-51}" r="6" fill="#191713" stroke="none"/><circle cx="${cx+16}" cy="${cy-51}" r="6" fill="#191713" stroke="none"/><path d="M ${cx-12} ${cy-27} L ${cx+12} ${cy-27}"/><rect x="${cx-36}" y="${cy+18}" width="72" height="83" rx="14" fill="#e8dfcc"/><path d="M ${cx-18} ${cy+101} L ${cx-22} ${cy+147} M ${cx+18} ${cy+101} L ${cx+22} ${cy+147} M ${cx-36} ${cy+43} L ${cx-70} ${cy+69} M ${cx+36} ${cy+43} L ${cx+70} ${cy+69}"/></g>`}
function figure(id,cx,cy,pose){if(id==='bec')return birdFigure(cx,cy,pose);if(id==='milo')return roundFigure(cx,cy,pose);if(id==='pico')return angularFigure(cx,cy);return blockFigure(cx,cy)}
export function renderCharacterSheet({projectName,characterBible}){
 const b=characterBible||{}; const char=esc(b.characterName||'Personnage'), project=esc(projectName||'Maketik');
 const poses=[['FACE',250,'front'],['PROFIL',540,'side'],['3/4',830,'left']];
 const poseSvg=poses.map(([label,x,pose])=>`<g><rect x="${x-120}" y="215" width="240" height="350" rx="22" fill="#fbf8f0" stroke="#cfc6b4" stroke-width="2"/>${figure(b.characterId,x,365,pose)}<text x="${x}" y="535" text-anchor="middle" font-size="18" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#6b6254">${label}</text></g>`).join('');
 const rules=(b.continuityRules||[]).slice(0,4).map((r,i)=>`<text x="74" y="${1010+i*36}" font-size="19" font-family="Arial, Helvetica, sans-serif" fill="#191713">• ${esc(String(r).slice(0,105))}</text>`).join('');
 const metadata=esc(JSON.stringify({provider:'local-vector-sheet',mode:'deterministic-canonical-preview',bibleVersion:b.version||null,bibleValidatedAt:b.validatedAt||null,characterId:b.characterId||null}));
 return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="Character sheet canonique ${char}">
<metadata>${metadata}</metadata><rect width="1080" height="1350" fill="#eee7d8"/><rect x="38" y="38" width="1004" height="1274" rx="34" fill="#f8f4ea" stroke="#191713" stroke-width="4"/>
<text x="72" y="105" font-size="24" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">MAKETIK · CHARACTER SHEET CANONIQUE</text>
<text x="72" y="160" font-size="46" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">${char}</text><text x="72" y="193" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="#6b6254">${project} · ${esc(b.universeName||'Univers du projet')} · local-vector-sheet</text>
${poseSvg}<text x="72" y="630" font-size="22" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">ANCRE D’IDENTITÉ</text>${textLines(b.identityAnchor,72,670,{size:23,weight:500,gap:31,max:72})}
<text x="72" y="775" font-size="20" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">SILHOUETTE</text>${textLines(b.silhouette,72,812,{size:19,gap:27,max:76})}<text x="560" y="775" font-size="20" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">PROPORTIONS</text>${textLines(b.proportions,560,812,{size:19,gap:27,max:48})}
<text x="72" y="965" font-size="20" font-weight="800" font-family="Arial, Helvetica, sans-serif" fill="#191713">INVARIANTS DE CONTINUITÉ</text>${rules}
<line x1="72" y1="1190" x2="1008" y2="1190" stroke="#cfc6b4" stroke-width="2"/><text x="72" y="1233" font-size="17" font-family="Arial, Helvetica, sans-serif" fill="#6b6254">Bible ${esc(b.version||'inconnue')} · validée ${esc(b.validatedAt||'date inconnue')}</text><text x="72" y="1265" font-size="16" font-family="Arial, Helvetica, sans-serif" fill="#6b6254">Aperçu vectoriel déterministe. Ce fichier n’est ni une image IA ni un design final approuvé.</text></svg>`
}
