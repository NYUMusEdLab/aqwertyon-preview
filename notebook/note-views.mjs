// Uses the same MusEDLab ScaleWheel and VexFlow engines as aQWERTYon/theory.
export function initNoteViews(app){
 const box=app.video.container,panel=document.createElement('section');panel.className='note-explorer';panel.setAttribute('aria-label','Explore notes');
 panel.innerHTML='<div class="note-view-controls" role="group" aria-label="Explore notes"><button type="button" data-view="staff" aria-pressed="true">Staff</button><button type="button" data-view="wheel" aria-pressed="false">Scale wheel</button></div><div class="wheel-order" role="group" aria-label="Pitch order" hidden><button type="button" data-order="chromatic" aria-pressed="true">Chromatic</button><button type="button" data-order="fifths" aria-pressed="false">Circle of Fifths</button></div><div class="theory-display" role="img" aria-label="Live pitches in the selected scale"></div><p class="note-view-help">Play notes to see their pitches.</p>';
 box.append(panel);let view='staff',order='chromatic',signature='';const host=panel.querySelector('.theory-display'),orderUI=panel.querySelector('.wheel-order');
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.view){if(view==='wheel')window.aqTheory.unmount(host);view=b.dataset.view;panel.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}else{order=b.dataset.order;panel.querySelectorAll('[data-order]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}orderUI.hidden=view!=='wheel';signature='';draw();if(e.detail>0){app.keyboard.keyboardContainer.focus({preventScroll:true});app.keyboard.buttons.activate();}});
 function draw(){
  if(box.dataset.playMode!=='play'||document.hidden)return;
  const buttons=Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled&&Number.isInteger(b.eventData));
  const held=[...new Set(buttons.filter(b=>b.classList.contains('triggered')||b.classList.contains('notebook-playing')).map(b=>b.eventData))].sort((a,b)=>a-b);
  const root=app.keyboard.mapping.root,slug=app.scalePicker.scale,key=JSON.stringify([view,order,held,root,slug]);if(key===signature)return;signature=key;
  const names=held.map(m=>window.aqTheory.spell(m,root,slug));host.dataset.notes=names.join(' ');host.dataset.view=view;
  if(view==='wheel')window.aqTheory.renderWheel(host,root,slug,names,order,[...new Set(buttons.map(b=>b._domNode.dataset.pitchName?.replace(/-?\d+$/,'')))]);
  else window.aqTheory.renderStaff(host,names);
 }
 draw();const timer=setInterval(draw,80);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
