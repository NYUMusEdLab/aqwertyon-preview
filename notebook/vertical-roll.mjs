// Shared real-time pitch lanes: pitch runs left/right and past time rises upward.
export function createVerticalRoll(canvas,getPitches){
 const ctx=canvas.getContext('2d'),history=[],held=new Map();let frame=0,visible=false;
 const colors={human:'#008f98',ai:'#d38b19'},windowMs=10000;
 function draw(now=performance.now()){
  const w=canvas.clientWidth||400,h=canvas.clientHeight||300,dpr=window.devicePixelRatio||1;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const current=getPitches().filter(p=>p>=0&&p<=127),pitches=current.concat(history.map(n=>n.midi));
  const lo=Math.min(...(pitches.length?pitches:[48])),hi=Math.max(lo+11,...(pitches.length?pitches:[72]));
  const width=w/(hi-lo+1),base=h-30,speed=(base-12)/windowMs;
  ctx.fillStyle='#f8faf8';ctx.fillRect(0,0,w,h);
  for(let p=lo;p<=hi;p++){
   const x=(p-lo)*width,black=[1,3,6,8,10].includes(p%12);
   ctx.fillStyle=black?'#e8eeed':'#f8faf8';ctx.fillRect(x,0,width,base);
   ctx.strokeStyle='#dae3e1';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();
   ctx.fillStyle=black?'#263f46':'#fff';ctx.fillRect(x,base,width,black?18:30);
   if([...held.values()].some(n=>n.midi===p)){ctx.fillStyle=[...held.values()].some(n=>n.midi===p&&n.voice==='human')?colors.human:colors.ai;ctx.fillRect(x+1,base,width-2,black?18:30);}
   if(p%12===0&&width>=7){ctx.fillStyle='#41565b';ctx.font='10px sans-serif';ctx.fillText('C'+(Math.floor(p/12)-1),x+1,h-3);}
  }
  for(const n of history){
   const top=base-(now-n.start)*speed,bottom=base-(now-(n.end??now))*speed;
   if(bottom<0)continue;
   ctx.fillStyle=colors[n.voice];ctx.fillRect((n.midi-lo)*width+1,Math.max(0,top),Math.max(2,width-2),Math.max(3,Math.min(base,bottom)-Math.max(0,top)));
  }
  ctx.strokeStyle='#68827f';ctx.beginPath();ctx.moveTo(0,base);ctx.lineTo(w,base);ctx.stroke();
 }
 function loop(){frame=0;const now=performance.now();for(let i=history.length-1;i>=0;i--)if(history[i].end!=null&&now-history[i].end>windowMs)history.splice(i,1);draw(now);if(visible&&history.length)frame=requestAnimationFrame(loop);}
 function animate(){if(visible&&!frame)frame=requestAnimationFrame(loop);}
 return {
  note(type,midi,code,voice='human',at=performance.now()){
   const key=voice+':'+code;
   if(type==='on'){if(held.has(key))return;const n={midi,voice,start:at,end:null};history.push(n);held.set(key,n);}
   else if(held.has(key)){held.get(key).end=at;held.delete(key);}
   animate();
  },
  release(voice){const now=performance.now();for(const [key,n]of held){if(!voice||n.voice===voice){n.end=now;held.delete(key);}}animate();},
  visible(value){visible=value;if(!value){cancelAnimationFrame(frame);frame=0;}else{draw();animate();}},
  resize(){if(visible)draw();},
  snapshot(){return history.map(n=>({...n}));}
 };
}
