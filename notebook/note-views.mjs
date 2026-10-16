// Uses the same VexFlow notation engine as aQWERTYon/theory.
export function initNoteViews(app){
 const box=app.video.container,panel=document.createElement('section');panel.className='note-explorer';panel.setAttribute('aria-label','Explore notes');
 panel.innerHTML='<div class="theory-display" role="img" aria-label="Live staff notation"></div><p class="note-view-help">Mapped octave · play to highlight.</p>';
 box.append(panel);let signature='';const host=panel.querySelector('.theory-display');
 function draw(){
  if(box.dataset.playMode!=='play'||document.hidden)return;
  const buttons=Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled&&Number.isInteger(b.eventData));
  const held=[...new Set(buttons.filter(b=>b.classList.contains('triggered')||b.classList.contains('notebook-playing')).map(b=>b.eventData))].sort((a,b)=>a-b);
  const root=app.keyboard.mapping.root,slug=app.scalePicker.scale,base=root+app.keyboard.mapping.transposition;
  const mapped=[...new Set(buttons.map(b=>b.eventData))].sort((a,b)=>a-b).filter(m=>m>=base&&m<=base+12);
  const shown=[...new Set([...mapped,...held])].sort((a,b)=>a-b);
  const key=JSON.stringify([held,root,slug,shown]);if(key===signature)return;signature=key;
  const names=held.map(m=>window.aqTheory.spell(m,root,slug));host.dataset.notes=names.join(' ');host.dataset.view='staff';
  host.dataset.mapped=mapped.join(',');window.aqTheory.renderPreview(host,shown,held,root,slug);
 }
 draw();const timer=setInterval(draw,80);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
