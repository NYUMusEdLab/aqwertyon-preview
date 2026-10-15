import * as TK from './takes.mjs';
import {preparePrompt,shapeReply} from './ai/music.mjs';
export function initDuet(app){
 const box=app.video.container;
 const mode=document.createElement('label');mode.className='duet-mode';mode.innerHTML='Play with <select aria-label="Play with"><option value="video">Video</option><option value="ai">Melody AI</option></select>';
 const panel=document.createElement('section');panel.className='duet-panel';panel.hidden=true;
 panel.innerHTML='<h3>Melody AI</h3><p>Play a phrase, then pause. A musical partner answers.</p><div class="duet-controls"><button type="button" id="duet-start">Start AI</button><button type="button" id="duet-stop" disabled>Stop AI</button><label>Reply style <select id="duet-style"><option value="related">Related</option><option value="explore">Explore</option></select></label></div><p id="duet-status" role="status">Start downloads a 14 MB model and runtime. Your notes stay in this browser.</p><p class="duet-legend">You · teal</p><canvas id="duet-you" height="110" role="img" aria-label="Your phrase"></canvas><p class="duet-legend">AI reply · amber</p><canvas id="duet-reply" height="110" role="img" aria-label="AI reply"></canvas><button type="button" id="duet-keep" disabled>Keep AI reply</button><p class="duet-credit">Inspired by <a href="https://yotammann.info/aiexperiments" target="_blank" rel="noopener">A.I. Duet by Yotam Mann and Google Creative Lab</a>. Uses Magenta MelodyRNN, with rhythm and scale adaptation. <a href="notebook/ai/NOTICE.txt" target="_blank">Credits</a></p>';
 box.prepend(panel);box.prepend(mode);
 const find=id=>panel.querySelector('#'+id), status=t=>find('duet-status').textContent=t;
 let enabled=false,worker=null,ready=false,serial=0,pending=new Map(),epoch=0,lastReply=null,lastPrompt=null,frame=0,thinking=false,queuedTake=null;
 const range=()=>[...new Set(Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled).map(b=>b.eventData))].sort((a,b)=>a-b);
 function draw(canvas,events,color,duration,playhead){TK.drawRoll(canvas,events,{pitches:range(),duration,playhead,colors:{bar:color,barEdge:color}});}
 function drawLive(){if(!enabled)return;const c=window.aqNotebook.recorder.current();if(c){const events=c.events.concat([...c.held].map(([code,midi])=>({type:'off',code,midi,t:performance.now()-c.t0})));draw(find('duet-you'),events,'#008f98');frame=requestAnimationFrame(drawLive);}}
 function request(data){return new Promise((resolve,reject)=>{const id=++serial;const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('The AI took too long. Stop and start it to try again.'));},90000);pending.set(id,{resolve,reject,timeout});worker.postMessage({...data,id});});}
 function dispose(){if(worker)worker.terminate();worker=null;ready=false;thinking=false;for(const p of pending.values()){clearTimeout(p.timeout);p.reject(new Error('Stopped'));}pending.clear();}
 function stop(){enabled=false;epoch++;queuedTake=null;cancelAnimationFrame(frame);dispose();window.aqNotebook.stop();find('duet-start').disabled=false;find('duet-stop').disabled=true;status('AI stopped. Start it when you want another musical conversation.');}
 find('duet-start').onclick=async()=>{
  if(enabled)return;enabled=true;const run=++epoch;find('duet-start').disabled=true;find('duet-stop').disabled=false;
  if(app.video.ready)app.video.player.pauseVideo();status('Loading the melody model…');
  worker=new Worker(new URL('./ai/worker.js',import.meta.url));const startingWorker=worker;
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timeout);pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data);};
  worker.onerror=()=>{for(const p of pending.values()){clearTimeout(p.timeout);p.reject(new Error('The AI could not load. Check your connection and try again.'));}pending.clear();};
  try{await request({type:'init'});if(!enabled||worker!==startingWorker)return;ready=true;status('Your turn. Play two or more notes, then pause.');}
  catch(e){if(!enabled||worker!==startingWorker)return;stop();status(e.message);}
 };
 find('duet-stop').onclick=stop;
 mode.querySelector('select').onchange=e=>{const ai=e.target.value==='ai';box.classList.toggle('duet-active',ai);panel.hidden=!ai;if(ai){if(app.video.ready)app.video.player.pauseVideo();}else stop();app.resize();};
 find('duet-keep').onclick=()=>{if(lastReply){TK.save(lastReply);find('duet-keep').disabled=true;status('AI reply saved separately in your Melody Notebook.');}};
 document.addEventListener('aq:phrase',async({detail:take})=>{
  if(!enabled||!ready||document.hidden)return;if(thinking){queuedTake=take;return;}
  lastPrompt=take;lastReply=null;find('duet-keep').disabled=true;
  const run=++epoch;thinking=true;cancelAnimationFrame(frame);draw(find('duet-you'),take.events,'#008f98',take.duration);draw(find('duet-reply'),[],'#ad6b00');status('Listening to your phrase and making a reply…');
  try{
   const prompt=preparePrompt(take),style=find('duet-style').value, allowed=range();
   const out=await request({type:'reply',sequence:prompt.sequence,steps:prompt.steps,temperature:style==='related'?0.75:1.05});
   if(run!==epoch||!enabled)return;
   lastReply=shapeReply(take,prompt,out.sequence,allowed,style);find('duet-keep').disabled=false;
   draw(find('duet-reply'),lastReply.events,'#ad6b00',lastReply.duration);status('AI’s turn. Play a note whenever you want to take over.');
   await window.aqNotebook.play(lastReply,false);
  }catch(e){if(run===epoch&&enabled)status(e.message);}
  finally{thinking=false;if(enabled&&queuedTake){const next=queuedTake;queuedTake=null;document.dispatchEvent(new CustomEvent('aq:phrase',{detail:next}));}}
 });
 document.addEventListener('aq:note',e=>{if(!enabled)return;if(e.detail.type==='on'){
  epoch++;cancelAnimationFrame(frame);drawLive();status(ready?'Your turn. Pause when your phrase is finished.':'Model loading. Your notes still work.');
 }});
 document.addEventListener('aq:replay-tick',({detail:d})=>{if(enabled&&lastReply?.id===d.id)draw(find('duet-reply'),lastReply.events,'#ad6b00',lastReply.duration,d.ms);});
 document.addEventListener('aq:replay-stop',()=>{if(enabled&&ready&&!thinking)status('Your turn. Play another phrase.');});
 document.addEventListener('aq:replay-start',()=>{epoch++;queuedTake=null;});
 document.addEventListener('aq:configuration',()=>{epoch++;lastReply=null;find('duet-keep').disabled=true;});
 document.addEventListener('change',e=>{if(!panel.contains(e.target)&&!mode.contains(e.target)){epoch++;if(enabled){window.aqNotebook.stop();status('Settings changed. Play a new phrase.');}}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&enabled)stop();});
 window.addEventListener('pagehide',()=>{if(enabled)stop();});
 window.addEventListener('resize',()=>{if(lastPrompt)draw(find('duet-you'),lastPrompt.events,'#008f98',lastPrompt.duration);if(lastReply)draw(find('duet-reply'),lastReply.events,'#ad6b00',lastReply.duration);});
 // Read-only status for acceptance tests; generation always runs through the real model.
 window.aqDuet={state:()=>({enabled,ready,thinking,reply:lastReply,prompt:lastPrompt}),stop};
}
