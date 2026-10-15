// Uses the same VexFlow notation engine as aQWERTYon/theory.
export function initNoteViews(app){
 const box=app.video.container,panel=document.createElement('section');panel.className='note-explorer';panel.setAttribute('aria-label','Explore notes');
 panel.innerHTML='<div class="theory-display" role="img" aria-label="Live staff notation"></div><p class="note-view-help">Play notes to see their pitches.</p>';
 box.append(panel);let signature='';const host=panel.querySelector('.theory-display');
 function draw(){
  if(box.dataset.playMode!=='play'||document.hidden)return;
  const buttons=Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled&&Number.isInteger(b.eventData));
  const held=[...new Set(buttons.filter(b=>b.classList.contains('triggered')||b.classList.contains('notebook-playing')).map(b=>b.eventData))].sort((a,b)=>a-b);
  const root=app.keyboard.mapping.root,slug=app.scalePicker.scale,key=JSON.stringify([held,root,slug]);if(key===signature)return;signature=key;
  const names=held.map(m=>window.aqTheory.spell(m,root,slug));host.dataset.notes=names.join(' ');host.dataset.view='staff';
  window.aqTheory.renderStaff(host,names);
 }
 draw();const timer=setInterval(draw,80);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
