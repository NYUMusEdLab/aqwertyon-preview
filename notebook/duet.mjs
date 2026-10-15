import * as TK from './takes.mjs';
import {preparePrompt,shapeReply,styledReply,replyStyles} from './ai/music.mjs';
import {createVerticalRoll} from './vertical-roll.mjs';
export function initDuet(app){
 const box=app.video.container;
 const mode=document.createElement('div');mode.className='duet-mode';mode.setAttribute('role','group');mode.setAttribute('aria-label','Play mode');mode.innerHTML='<button type="button" data-mode="play" aria-pressed="true">Play</button><button type="button" data-mode="video" aria-pressed="false">Play with Video</button><button type="button" data-mode="ai" aria-pressed="false">Play with AI</button>';
 const panel=document.createElement('section');panel.className='duet-panel';panel.hidden=true;
 panel.innerHTML='<h3>Melody AI</h3><p>Play a phrase, then pause. A musical partner answers.</p><div class="duet-controls"><label>Who starts? <select id="duet-first"><option value="ai">AI first</option><option value="human">You first</option></select></label><button type="button" id="duet-start">Start AI</button><button type="button" id="duet-stop" disabled>Stop AI</button><label>Reply style <select id="duet-style"><option value="extend">Extend</option><option value="echo">Echo</option><option value="contrast">Contrast</option><option value="complement">Complement</option><option value="harmonize">Harmonize</option></select></label></div><p id="duet-style-help"></p><p id="duet-status" role="status">Selecting AI downloads a 14 MB model and runtime. Your notes stay in this browser.</p><p class="duet-legend"><span>You · teal</span> <span>AI · amber</span></p><canvas id="duet-roll" height="300" role="img" aria-label="Live duet: pitch from left to right; notes rise with time. Human notes are teal and AI notes amber."></canvas><div class="conversation-actions"><button type="button" id="duet-conversation" disabled>Keep conversation</button><button type="button" id="duet-new-conversation">New conversation</button></div><button type="button" id="duet-keep" disabled>Keep AI reply</button><p class="duet-credit">Inspired by <a href="https://yotammann.info/aiexperiments" target="_blank" rel="noopener">A.I. Duet by Yotam Mann and Google Creative Lab</a>. Uses Magenta MelodyRNN, with rhythm and scale adaptation. <a href="notebook/ai/NOTICE.txt" target="_blank">Credits</a></p>';
 box.prepend(panel);box.prepend(mode);
 const find=id=>panel.querySelector('#'+id), status=t=>find('duet-status').textContent=t;
 find('duet-style-help').textContent=replyStyles[find('duet-style').value];
 find('duet-style').onchange=()=>{epoch++;queuedTake=null;window.aqNotebook.stop();find('duet-style-help').textContent=replyStyles[find('duet-style').value];};
 let workerStarts=0;
 let enabled=false,worker=null,ready=false,serial=0,pending=new Map(),epoch=0,lastReply=null,lastPrompt=null,thinking=false,queuedTake=null;
 let opening=false,openingTimer=null;const humanHeld=new Set();
 const range=()=>[...new Set(Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled).map(b=>b.eventData))].sort((a,b)=>a-b);
 const roll=createVerticalRoll(find('duet-roll'),range);let replayCursor=0,replayTake=null;
 function offerOpening(){
  clearTimeout(openingTimer);if(!enabled||!ready||!opening||thinking||humanHeld.size||window.aqNotebook.replay.playing()||document.hidden)return;
  const allowed=range();if(!allowed.length)return;
  const root=app.options.midiRoot,tonic=allowed.reduce((a,b)=>Math.abs(b-root)<Math.abs(a-root)?b:a,allowed[0]);
  const events=[];for(let i=0;i<4;i++)events.push({type:'on',midi:tonic,code:'seed-'+i,t:i*450},{type:'off',midi:tonic,code:'seed-'+i,t:i*450+320});
  document.dispatchEvent(new CustomEvent('aq:phrase',{detail:{id:'ai-opening-seed',title:'opening',origin:'ai-seed',cfg:{...app.options,layout:app.options.features.layout},duration:1670,events}}));
 }
 function waitForHuman(){if(opening&&enabled){clearTimeout(openingTimer);status('Your turn. Play a note, or listen for another short phrase.');openingTimer=setTimeout(offerOpening,6000);}}
 function request(data){return new Promise((resolve,reject)=>{const id=++serial;const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('The AI took too long. Stop and start it to try again.'));},90000);pending.set(id,{resolve,reject,timeout});worker.postMessage({...data,id});});}
 function dispose(){if(worker)worker.terminate();worker=null;ready=false;thinking=false;for(const p of pending.values()){clearTimeout(p.timeout);p.reject(new Error('Stopped'));}pending.clear();}
 function stop(){opening=false;clearTimeout(openingTimer);find('duet-first').disabled=false;enabled=false;epoch++;queuedTake=null;roll.release();dispose();window.aqNotebook.stop();window.aqNotebook.conversation.pause();find('duet-start').disabled=false;find('duet-stop').disabled=true;status('AI stopped. Start it when you want another musical conversation.');}
 find('duet-start').onclick=async()=>{
  if(enabled)return;window.aqNotebook.conversation.start();app.audioControls.resume();opening=find('duet-first').value==='ai';find('duet-first').disabled=false;enabled=true;const run=++epoch;find('duet-start').disabled=true;find('duet-stop').disabled=false;
  if(app.video.ready)app.video.player.pauseVideo();status('Loading the melody model…');
  workerStarts++;worker=new Worker(new URL('./ai/worker.js',import.meta.url));const startingWorker=worker;
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timeout);pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data);};
  worker.onerror=()=>{for(const p of pending.values()){clearTimeout(p.timeout);p.reject(new Error('The AI could not load. Check your connection and try again.'));}pending.clear();};
  try{await request({type:'init'});if(!enabled||worker!==startingWorker)return;ready=true;status('Your turn. Play two or more notes, then pause.');if(opening)offerOpening();}
  catch(e){if(!enabled||worker!==startingWorker)return;stop();status(e.message);}
 };
 let pointerTurn=false;
 find('duet-first').addEventListener('pointerdown',e=>{pointerTurn=e.button===0;});
 find('duet-first').addEventListener('keydown',()=>{pointerTurn=false;});
 find('duet-first').addEventListener('blur',()=>{pointerTurn=false;});
 find('duet-first').onchange=()=>{
  const focus=pointerTurn;pointerTurn=false;clearTimeout(openingTimer);
  if(enabled){
   opening=find('duet-first').value==='ai';
   if(!opening){if(thinking&&lastPrompt?.origin==='ai-seed')epoch++;status('Your turn. The current reply will finish, then AI will wait.');}
   else if(!thinking&&!humanHeld.size&&!window.aqNotebook.replay.playing())offerOpening();
   else status('AI will offer a phrase when the current turn finishes.');
  }
  if(focus)requestAnimationFrame(()=>{if(document.activeElement===find('duet-first'))app.keyboard.keyboardContainer.focus({preventScroll:true});});
 };
 find('duet-stop').onclick=stop;
 function selectMode(value){const ai=value==='ai';box.dataset.playMode=value;box.classList.toggle('duet-active',ai);panel.hidden=!ai;roll.visible(ai);mode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===value)));if(value!=='video'&&app.video.ready)app.video.player.pauseVideo();if(!ai&&enabled)stop();app.resize();if(ai&&!enabled)find('duet-start').click();if(value==='video'&&app.video.videoSlug==='cmsd')app.video.load();}
 let pointerMode=false;
 mode.addEventListener('pointerdown',e=>{pointerMode=e.button===0;});
 mode.addEventListener('keydown',()=>{pointerMode=false;});
 mode.addEventListener('pointercancel',()=>{pointerMode=false;});
 mode.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;const returnFocus=pointerMode||e.detail>0;pointerMode=false;selectMode(b.dataset.mode);if(returnFocus)app.keyboard.keyboardContainer.focus({preventScroll:true});});
 selectMode('play');
 document.addEventListener('aq:conversation',()=>{find('duet-conversation').disabled=!window.aqNotebook.conversation.hasContent();});
 find('duet-conversation').onclick=()=>{const take=window.aqNotebook.conversation.snapshot();if(take){const existing=TK.get(take.id);if(existing)take.title=existing.title;TK.save(take);status('Conversation saved with both voices and pauses.');}};
 find('duet-new-conversation').onclick=()=>{const old=window.aqNotebook.conversation.snapshot();if(old){const existing=TK.get(old.id);if(existing)old.title=existing.title;TK.save(old);}window.aqNotebook.conversation.fresh();if(!enabled)window.aqNotebook.conversation.pause();status('New conversation ready. The previous conversation was saved.');};
 find('duet-keep').onclick=()=>{if(lastReply){TK.save(lastReply);find('duet-keep').disabled=true;status('AI reply saved separately in your Melody Notebook.');}};
 document.addEventListener('aq:phrase',async({detail:take})=>{
  if(!enabled||!ready||document.hidden)return;if(take.origin!=='ai-seed'){opening=false;clearTimeout(openingTimer);}if(thinking){queuedTake=take;return;}
  lastPrompt=take;lastReply=null;find('duet-keep').disabled=true;
  const run=++epoch;thinking=true;status('Listening to your phrase and making a reply…');
  try{
   const style=find('duet-style').value,allowed=range(),isOpening=take.origin==='ai-seed';
   if(!isOpening&&['echo','harmonize'].includes(style))lastReply=styledReply(take,null,null,allowed,style);
   else {
    const prompt=preparePrompt(take);
    const out=await request({type:'reply',sequence:prompt.sequence,steps:prompt.steps,temperature:style==='contrast'?1.05:0.8});
    if(run!==epoch||!enabled)return;
    lastReply=isOpening?shapeReply(take,prompt,out.sequence,allowed,'explore'):styledReply(take,prompt,out.sequence,allowed,style);
   }
   if(isOpening){lastReply.title='AI opening';delete lastReply.parentTakeId;}
   find('duet-keep').disabled=false;
   status('AI’s turn. Play a note whenever you want to take over.');
   await window.aqNotebook.play(lastReply,false,true);
  }catch(e){if(run===epoch&&enabled)status(e.message);}
  finally{thinking=false;if(enabled&&opening&&!queuedTake&&!window.aqNotebook.replay.playing())waitForHuman();if(enabled&&queuedTake){const next=queuedTake;queuedTake=null;document.dispatchEvent(new CustomEvent('aq:phrase',{detail:next}));}}
 });
 document.addEventListener('aq:note',e=>{if(panel.hidden)return;const n=e.detail;if(n.type==='on')humanHeld.add(n.code);else humanHeld.delete(n.code);roll.note(n.type,n.midi,n.code,'human');if(!enabled)return;if(e.detail.type==='off'&&opening&&!humanHeld.size&&!thinking&&!window.aqNotebook.replay.playing())waitForHuman();if(e.detail.type==='on'){
  opening=false;clearTimeout(openingTimer);epoch++;status(ready?'Your turn. Pause when your phrase is finished.':'Model loading. Your notes still work.');
 }});
 document.addEventListener('aq:replay-tick',({detail:d})=>{
  if(panel.hidden||!replayTake||replayTake.id!==d.id)return;
  const voice=replayTake.origin==='ai'?'ai':'human';
  while(replayCursor<replayTake.events.length&&replayTake.events[replayCursor].t<=d.ms){const e=replayTake.events[replayCursor++];roll.note(e.type,e.midi,'replay-'+(e.code||String(e.midi)),e.voice||voice,performance.now()-(d.ms-e.t));}
 });
 document.addEventListener('aq:replay-stop',()=>{roll.release();replayTake=null;if(opening){waitForHuman();return;}if(enabled&&ready&&!thinking)status('Your turn. Play another phrase.');});
 document.addEventListener('aq:replay-start',({detail})=>{if(detail.kind==='conversation'){enabled=false;opening=false;clearTimeout(openingTimer);dispose();window.aqNotebook.conversation.pause();find('duet-start').disabled=false;find('duet-stop').disabled=true;find('duet-first').disabled=false;}epoch++;queuedTake=null;roll.release();});
 document.addEventListener('aq:replay-playing',({detail:take})=>{replayTake=take;replayCursor=0;});
 document.addEventListener('aq:configuration',()=>{epoch++;clearTimeout(openingTimer);lastReply=null;find('duet-keep').disabled=true;});
 document.addEventListener('change',e=>{if(!panel.contains(e.target)&&!mode.contains(e.target)){epoch++;if(enabled){window.aqNotebook.stop();status('Settings changed. Play a new phrase.');}}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&enabled)stop();});
 window.addEventListener('pagehide',()=>{if(enabled)stop();});
 window.addEventListener('resize',()=>roll.resize());
 // Read-only status for acceptance tests; generation always runs through the real model.
 window.aqDuet={state:()=>({enabled,ready,thinking,opening,workerStarts,pendingRequests:pending.size,reply:lastReply,prompt:lastPrompt,visualNotes:roll.snapshot()}),stop};
}
