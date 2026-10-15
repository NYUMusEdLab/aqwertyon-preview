// Optional live pitch views inspired by the original aQWERTYon Theory interface.
const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const letters=[0,0,1,2,2,3,3,4,5,5,6,6];
const accidentals=['','♯','','♭','','','♯','','♭','','♭',''];
export function staffPosition(midi){const pc=((midi%12)+12)%12,step=(Math.floor(midi/12)-1)*7+letters[pc];return {y:midi>=60?76-(step-30)*5:166-(step-18)*5,clef:midi>=60?'treble':'bass',accidental:accidentals[pc]};}
export function initNoteViews(app){
 const box=app.video.container,panel=document.createElement('section');panel.className='note-explorer';panel.setAttribute('aria-label','Explore notes');
 panel.innerHTML='<div class="note-view-controls" role="group" aria-label="Explore notes"><span>Explore notes</span><button type="button" data-view="none" aria-pressed="true">Off</button><button type="button" data-view="wheel" aria-pressed="false">Scale wheel</button><button type="button" data-view="staff" aria-pressed="false">Staff</button></div><div class="wheel-order" role="group" aria-label="Pitch order" hidden><button type="button" data-order="chromatic" aria-pressed="true">Chromatic</button><button type="button" data-order="fifths" aria-pressed="false">Circle of Fifths</button></div><svg class="note-view-image" role="img" aria-label="Live pitches in the selected scale" hidden></svg><p class="note-view-help" hidden>Play notes to see their pitches.</p>';
 box.append(panel);let view='none',order='chromatic',signature='';const svg=panel.querySelector('svg'),orderUI=panel.querySelector('.wheel-order'),help=panel.querySelector('p');
 function choose(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.view){view=b.dataset.view;panel.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}else{order=b.dataset.order;panel.querySelectorAll('[data-order]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}svg.toggleAttribute('hidden',view==='none');orderUI.hidden=view!=='wheel';help.hidden=view==='none';signature='';draw();if(e.detail>0){app.keyboard.keyboardContainer.focus({preventScroll:true});app.keyboard.buttons.activate();}}
 panel.addEventListener('click',choose);
 function draw(){
  if(view==='none'||box.dataset.playMode!=='play'||document.hidden)return;
  const buttons=Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled&&Number.isInteger(b.eventData));
  const pitches=[...new Set(buttons.map(b=>((b.eventData%12)+12)%12))];
  const held=[...new Set(buttons.filter(b=>b.classList.contains('triggered')||b.classList.contains('notebook-playing')).map(b=>b.eventData))].sort((a,b)=>a-b);
  const root=((app.keyboard.mapping.root%12)+12)%12,key=JSON.stringify([view,order,pitches,held,root]);if(key===signature)return;signature=key;
  if(view==='wheel'){
   svg.setAttribute('viewBox','0 0 300 270');let content='<circle cx="150" cy="135" r="94" fill="none" stroke="#a5b6a3"/>';
   const sequence=Array.from({length:12},(_,i)=>order==='fifths'?(i*7)%12:i),degrees=pitches.slice().sort((a,b)=>(a-root+12)%12-(b-root+12)%12);
   for(let i=0;i<12;i++){const pc=sequence[i],angle=i*Math.PI/6-Math.PI/2,x=150+94*Math.cos(angle),y=135+94*Math.sin(angle),active=held.some(n=>n%12===pc),selected=pitches.includes(pc);content+=`<g data-pitch="${pc}" data-active="${active}"><circle cx="${x}" cy="${y}" r="19" fill="${active?'#008f98':selected?'#d7ebae':'#fffef9'}" stroke="${pc===root?'#365e48':'#a5b6a3'}" stroke-width="${pc===root?3:1}"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="${active?'white':'#253930'}" font-size="14">${names[pc]}</text>${selected?`<text x="${150+63*Math.cos(angle)}" y="${139+63*Math.sin(angle)}" text-anchor="middle" font-size="11" fill="#365e48">${['1','♭2','2','♭3','3','4','♯4','5','♭6','6','♭7','7'][(pc-root+12)%12]}</text>`:''}</g>`;}
   svg.innerHTML=content;
  }else{
   const topY=Math.min(0,...held.map(m=>staffPosition(m).y-18)),bottomY=Math.max(210,...held.map(m=>staffPosition(m).y+18));svg.setAttribute('viewBox',`0 ${topY} 360 ${bottomY-topY}`);let content='';
   for(const bottom of [76,166])for(let i=0;i<5;i++)content+=`<line x1="20" x2="340" y1="${bottom-i*10}" y2="${bottom-i*10}" stroke="#8da480"/>`;
   content+='<text x="24" y="75" font-size="53">𝄞</text><text x="24" y="158" font-size="43">𝄢</text>';
   held.forEach((m,i)=>{const {y,clef,accidental}=staffPosition(m),x=80+i*Math.min(32,240/Math.max(held.length,1)),bottom=clef==='treble'?76:166,top=bottom-40;
    for(let line=bottom+10;line<=y;line+=10)content+=`<line x1="${x-11}" x2="${x+11}" y1="${line}" y2="${line}" stroke="#365e48"/>`;
    for(let line=top-10;line>=y;line-=10)content+=`<line x1="${x-11}" x2="${x+11}" y1="${line}" y2="${line}" stroke="#365e48"/>`;
    content+=`<g data-midi="${m}"><ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#008f98" transform="rotate(-15 ${x} ${y})"/><text x="${x-19}" y="${y+5}" font-size="17">${accidental}</text><text x="${x}" y="200" text-anchor="middle" font-size="10">${names[m%12]}${Math.floor(m/12)-1}</text></g>`;
   });svg.innerHTML=content;
  }
 }
 const timer=setInterval(draw,80);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
