import {createAccompaniment} from './accompaniment.mjs';
import * as TK from './takes.mjs';
import {preparePrompt,shapeReply,styledReply,replyStyles,audibleReply} from './ai/music.mjs';
import {createVerticalRoll} from './vertical-roll.mjs';
export function initDuet(app){
 const box=app.video.container;
 const mode=document.createElement('div');mode.className='duet-mode';mode.setAttribute('role','group');mode.setAttribute('aria-label','Play mode');mode.innerHTML=`<button type="button" data-mode="play" aria-label="Play" aria-pressed="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 8l10-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="16" cy="16" rx="3" ry="2"/></svg><span>Play</span></button><button type="button" data-mode="video" aria-label="Play with Video" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></svg><span>Video</span></button><button type="button" data-mode="ai" aria-label="Play with AI" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/></svg><span>AI duet</span></button>`;
 const panel=document.createElement('section');panel.className='duet-panel';panel.hidden=true;
 panel.innerHTML='<h3>Melody AI</h3><p>Play a phrase, then pause. A musical partner answers.</p><div class="duet-controls"><div class="duet-choice"><span id="duet-first-label">Who starts?</span><div id="duet-first" class="duet-toggles" role="group" aria-labelledby="duet-first-label"><button type="button" data-value="human" aria-pressed="false">You</button><button type="button" data-value="ai" aria-pressed="true">AI</button></div></div><button type="button" id="duet-start">Start AI</button><button type="button" id="duet-stop" disabled>Stop AI</button><div class="duet-choice duet-style-choice"><span id="duet-style-label">Reply style</span><div id="duet-style" class="duet-toggles" role="group" aria-labelledby="duet-style-label"><button type="button" data-value="echo" aria-pressed="false">Echo</button><button type="button" data-value="extend" aria-pressed="true">Extend</button><button type="button" data-value="contrast" aria-pressed="false">Contrast</button><button type="button" data-value="complement" aria-pressed="false">Complement</button><button type="button" data-value="harmonize" aria-pressed="false">Harmonize</button><button type="button" data-value="accompaniment" aria-pressed="false">Accompaniment</button></div></div></div><p id="duet-style-help"></p><div id="backing-controls" hidden><p>AI supplies a motif. Rhythm and scale-step chords are arranged by these controls.</p><div class="duet-choice"><span>Texture</span><div id="backing-texture" class="duet-toggles" role="group" aria-label="Backing texture"><button type="button" data-value="rhythm" aria-pressed="false">Rhythm</button><button type="button" data-value="chords" aria-pressed="false">Chords</button><button type="button" data-value="arpeggio" aria-pressed="true">Arpeggio</button></div></div><div class="duet-choice"><span>Progression</span><div id="backing-progression" class="duet-toggles" role="group" aria-label="Chord progression"><button type="button" data-value="home" aria-pressed="true">Stay home</button><button type="button" data-value="rise" aria-pressed="false">Step upward</button><button type="button" data-value="return" aria-pressed="false">Away and home</button></div></div><label>Tempo <input id="backing-tempo" type="range" min="50" max="160" value="90" step="5"><output id="backing-tempo-value">90 BPM</output></label><div class="duet-choice"><span>Density</span><div id="backing-density" class="duet-toggles" role="group" aria-label="Backing density"><button type="button" data-value="sparse" aria-pressed="false">Sparse</button><button type="button" data-value="steady" aria-pressed="true">Steady</button><button type="button" data-value="busy" aria-pressed="false">Busy</button></div></div><label>Backing volume <input id="backing-volume" type="range" min="0" max="0.6" step="0.05" value="0.25"></label><button type="button" id="backing-vary">Vary backing</button><span id="backing-beat" aria-label="Backing beat"></span></div><p id="duet-status" role="status">Selecting AI downloads a 14 MB model and runtime. Your notes stay in this browser.</p><p class="duet-legend"><span>You · teal</span> <span>AI · amber</span></p><canvas id="duet-roll" height="300" role="img" aria-label="Live duet: pitch from left to right; notes rise with time. Human notes are teal and AI notes amber."></canvas><div class="conversation-actions"><button type="button" id="duet-conversation" disabled>Keep conversation</button><button type="button" id="duet-new-conversation">New conversation</button></div><button type="button" id="duet-keep" disabled>Keep AI reply</button>';
 box.prepend(panel);box.prepend(mode);
 const find=id=>panel.querySelector('#'+id), status=t=>find('duet-status').textContent=t;
 panel.querySelector('h3+p').classList.add('duet-intro');
 // Keep the live controls compact; secondary choices remain available on demand.
 const transport=document.createElement('div');transport.className='duet-transport';
 transport.append(find('duet-start'),find('duet-stop'));panel.querySelector('h3').append(transport);
 const options=document.createElement('details');options.className='duet-options';
 const summary=document.createElement('summary');summary.textContent='Options';options.append(summary);
 options.append(find('duet-first').parentElement,find('duet-style-help'),find('backing-controls'),find('duet-new-conversation'),find('duet-keep'));
 panel.append(options);
 options.append(find('duet-conversation'));find('duet-conversation').hidden=true;find('duet-keep').hidden=true;
 const savedHint=document.createElement('p');savedHint.className='duet-save-hint';savedHint.textContent='Replies and conversations save automatically.';find('duet-roll').after(savedHint);

 // Keep the visual conversation in view; choices use an explicit button panel.
 const choices=document.createElement('dialog');choices.className='duet-choice-dialog';
 const closeChoices=document.createElement('button');closeChoices.type='button';closeChoices.textContent='Done';closeChoices.className='duet-choice-close';
 const choiceHeading=document.createElement('h3');choiceHeading.textContent='Reply style';
 choices.append(closeChoices,choiceHeading,find('duet-style').parentElement,options);panel.append(choices);
 const choiceBar=document.createElement('div');choiceBar.className='duet-choice-bar';
 const styleButton=document.createElement('button');styleButton.type='button';styleButton.innerHTML='<span>Reply style</span><span class="current-style">Extend</span>';
 const optionsButton=document.createElement('button');optionsButton.type='button';optionsButton.textContent='Options';
 choiceBar.append(styleButton,optionsButton);panel.append(choiceBar);
 const openChoices=()=>{options.open=true;choices.showModal();};styleButton.onclick=openChoices;optionsButton.onclick=openChoices;closeChoices.onclick=()=>choices.close();
 choices.addEventListener('click',e=>{if(e.target===choices)choices.close();});
 find('duet-style').addEventListener('change',()=>{styleButton.querySelector('.current-style').textContent=find('duet-style').querySelector('[aria-pressed="true"]').textContent;choices.close();});
 panel.querySelector('h3').after(panel.querySelector('.duet-legend'),find('duet-roll'),find('duet-status'));
 const contrastingSound=()=>((app.audioControls.sounds._requestedInstrument||app.options.soundSlug)==='acoustic_grand_piano'?'vibraphone':'acoustic_grand_piano');

 function toggleGroup(id,initial){
  const group=find(id);group.value=initial;let pointer=false;
  group.addEventListener('pointerdown',e=>{pointer=e.button===0;});
  group.addEventListener('pointercancel',()=>{pointer=false;});
  group.addEventListener('keydown',()=>{pointer=false;});
  group.addEventListener('click',e=>{const button=e.target.closest('button[data-value]');if(!button)return;const focus=pointer||e.detail>0;pointer=false;
   if(group.value!==button.dataset.value){group.value=button.dataset.value;group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));group.dispatchEvent(new Event('change',{bubbles:true}));}
   if(focus)app.keyboard.keyboardContainer.focus({preventScroll:true});
  });
 }
 toggleGroup('duet-first','ai');toggleGroup('duet-style','extend');
 find('duet-style-help').textContent=replyStyles[find('duet-style').value];
 find('duet-style').onchange=()=>{epoch++;backingEpoch++;queuedTake=null;backing.stop();window.aqNotebook.stop();opening=false;clearTimeout(openingTimer);const on=isBacking();lastReply=null;find('duet-keep').disabled=true;find('duet-keep').hidden=true;panel.querySelector('.duet-intro').textContent=on?'Play your melody while the backing continues.':'Play a phrase, then pause. A musical partner answers.';find('backing-controls').hidden=!on;find('duet-first').parentElement.hidden=on;find('duet-style-help').textContent=on?'Play freely over continuous backing. Changes land on the next beat.':replyStyles[find('duet-style').value];if(on)options.open=true;if(on&&enabled&&ready)refreshBacking();};
 let workerStarts=0;
 let enabled=false,worker=null,ready=false,serial=0,pending=new Map(),epoch=0,lastReply=null,lastPrompt=null,thinking=false,queuedTake=null;
 let opening=false,openingTimer=null;const humanHeld=new Set();
 const range=()=>[...new Set(Object.values(app.keyboard.buttons._buttonsByName).filter(b=>b.eventType==='midi'&&!b.disabled).map(b=>b.eventData))].sort((a,b)=>a-b);
 const roll=createVerticalRoll(find('duet-roll'),range);let replayCursor=0,replayTake=null;
 const isBacking=()=>find('duet-style').value==='accompaniment';let backingEpoch=0,backingBusy=false,backingSound='acoustic_grand_piano';
 const backing=createAccompaniment({getPitches:range,getRoot:()=>app.options.midiRoot,emit(type,midi,code,volume){roll.note(type,midi,code,'ai');window.aqNotebook.conversation.note(type,midi,code,'ai',{soundSlug:backingSound,midiRoot:app.options.midiRoot,scaleSlug:app.options.scaleSlug,layout:app.options.features.layout,volume,arrangement:'model-motif-explicit-backing'});},onBeat({beat}){find('backing-beat').textContent=String(beat%4+1);}});
 toggleGroup('backing-texture','arpeggio');toggleGroup('backing-progression','home');toggleGroup('backing-density','steady');
 function updateBacking(){const tempo=Number(find('backing-tempo').value);find('backing-tempo-value').textContent=tempo+' BPM';backing.update({tempo,density:find('backing-density').value,texture:find('backing-texture').value,progression:find('backing-progression').value,volume:Number(find('backing-volume').value)});}
 ['backing-texture','backing-progression','backing-density'].forEach(id=>find(id).onchange=updateBacking);
 ['backing-tempo','backing-volume'].forEach(id=>find(id).oninput=updateBacking);
 async function refreshBacking(take){
  if(!enabled||!ready||!isBacking()||backingBusy)return;backingBusy=true;const token=backingEpoch;
  try{
   status('Making a model motif for the backing…');
   while(pending.size){await new Promise(r=>setTimeout(r,100));if(token!==backingEpoch||!enabled||!isBacking())return;}
   const root=range()[0]||60;
   take=take||{id:'backing-seed',duration:1600,cfg:{midiRoot:app.options.midiRoot},events:[0,400,800,1200].flatMap((t,i)=>[{type:'on',midi:root,code:'seed'+i,t},{type:'off',midi:root,code:'seed'+i,t:t+300}])};
   const prompt=preparePrompt(take),out=await request({type:'reply',sequence:prompt.sequence,steps:prompt.steps,temperature:.85});
   if(token!==backingEpoch||!enabled||!isBacking())return;
   const shaped=audibleReply(take,prompt,out.sequence,range(),'extend',true),notes=shaped.events.filter(e=>e.type==='on').map(e=>e.midi);
   const sound=contrastingSound(),instrument=await app.audioControls.sounds.createBackingInstrument(sound);if(token!==backingEpoch||!enabled||!isBacking())return;
   shaped.cfg={...shaped.cfg,soundSlug:sound,midiRoot:app.options.midiRoot,scaleSlug:app.options.scaleSlug,layout:app.options.features.layout,volume:Number(find('backing-volume').value)};shaped.title=shaped.generationFallback?'Backing echo · model returned silence':'AI backing motif';TK.save(shaped);
   updateBacking();if(backing.state().active&&backingSound===sound)backing.motif(notes);else{backing.stop();backingSound=sound;backing.start(instrument,notes);}
   status('Backing is playing. Your melody stays independent; changes apply on the beat.');
  }catch(error){if(token===backingEpoch&&enabled)status('Backing could not load. Stop and start AI to retry.');}
  finally{backingBusy=false;if(token!==backingEpoch&&enabled&&ready&&isBacking()&&!backing.state().active)refreshBacking();}
 }
 find('backing-vary').onclick=()=>refreshBacking();

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
 function stop(){backingEpoch++;backing.stop();opening=false;clearTimeout(openingTimer);find('duet-first').disabled=false;enabled=false;epoch++;queuedTake=null;roll.release();dispose();window.aqNotebook.stop();window.aqNotebook.conversation.pause();find('duet-start').disabled=false;find('duet-stop').disabled=true;status('AI stopped. Start it when you want another musical conversation.');}
 find('duet-start').onclick=async()=>{
  if(enabled)return;window.aqNotebook.conversation.start();app.audioControls.resume();opening=find('duet-first').value==='ai';find('duet-first').disabled=false;enabled=true;const run=++epoch;find('duet-start').disabled=true;find('duet-stop').disabled=false;
  if(app.video.ready)app.video.player.pauseVideo();status('Loading the melody model…');
  workerStarts++;worker=new Worker(new URL('./ai/worker.js',import.meta.url));const startingWorker=worker;
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timeout);pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data);};
  worker.onerror=()=>{for(const p of pending.values()){clearTimeout(p.timeout);p.reject(new Error('The AI could not load. Check your connection and try again.'));}pending.clear();};
  try{await request({type:'init'});if(!enabled||worker!==startingWorker)return;ready=true;status('Your turn. Play two or more notes, then pause.');if(isBacking()){opening=false;refreshBacking();}else if(opening)offerOpening();}
  catch(e){if(!enabled||worker!==startingWorker)return;stop();status(e.message);}
 };
 find('duet-first').onchange=()=>{
  clearTimeout(openingTimer);
  if(enabled){
   opening=find('duet-first').value==='ai';
   if(!opening){if(thinking&&lastPrompt?.origin==='ai-seed')epoch++;status('Your turn. The current reply will finish, then AI will wait.');}
   else if(!thinking&&!humanHeld.size&&!window.aqNotebook.replay.playing())offerOpening();
   else status('AI will offer a phrase when the current turn finishes.');
  }
 };
 find('duet-stop').onclick=stop;
 let instrumentSettings=null,settingsHome=null;
 const initialKey={root:app.keyboard.mapping.root,scale:app.scalePicker.scale};
 let videoKey={...initialKey};
 function applyKey(key){app.releaseNotes();app.rootPicker.root=key.root;app.scalePicker.scale=key.scale;app.logUpdatedOption('midiRoot',key.root);app.logUpdatedOption('scaleSlug',key.scale);}
 function selectMode(value,loadVideo=true){
  const previousMode=box.dataset.playMode;
  if(loadVideo&&value!==previousMode){
   if(previousMode==='video')videoKey={root:app.keyboard.mapping.root,scale:app.scalePicker.scale};
   if(value==='play'){
    const query=new URLSearchParams(location.search);
    const legacyCMSD=initialKey.root===66&&initialKey.scale==='major-pentatonic';
    if(previousMode||legacyCMSD||(!query.has('root')&&!query.has('scale'))){if(window.aqNotebook)window.aqNotebook.stop();applyKey({root:67,scale:'major'});}
   }else if(value==='video'&&previousMode){if(window.aqNotebook)window.aqNotebook.stop();applyKey(videoKey);}
  }
  const ai=value==='ai';
  if(ai){const node=document.querySelector('.aq-shell-options');if(node&&node.parentElement!==choices){instrumentSettings=node;settingsHome=node.parentElement;choices.append(node);}}else if(instrumentSettings&&settingsHome){settingsHome.append(instrumentSettings);}
  box.dataset.playMode=value;box.classList.toggle('duet-active',ai);panel.hidden=!ai;roll.visible(ai);mode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===value)));if(value!=='video'&&app.video.ready)app.video.player.pauseVideo();if(!ai&&enabled)stop();app.resize();if(ai&&!enabled)find('duet-start').click();if(loadVideo&&value==='video'&&app.video.videoSlug==='cmsd')app.video.load();}
 document.addEventListener('aq:video-replay',()=>selectMode('video',false));
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
  if(!enabled||!ready||document.hidden)return;if(isBacking()){refreshBacking(take);return;}if(take.origin!=='ai-seed'){opening=false;clearTimeout(openingTimer);}if(thinking){queuedTake=take;return;}
  lastPrompt=take;lastReply=null;find('duet-keep').disabled=true;
  const run=++epoch;thinking=true;status('Listening to your phrase and making a reply…');
  try{
   const style=find('duet-style').value,allowed=range(),isOpening=take.origin==='ai-seed';
   if(!isOpening&&['echo','harmonize'].includes(style))lastReply=styledReply(take,null,null,allowed,style);
   else {
    const prompt=preparePrompt(take);
    const out=await request({type:'reply',sequence:prompt.sequence,steps:prompt.steps,temperature:style==='contrast'?1.05:0.8});
    if(run!==epoch||!enabled)return;
    lastReply=audibleReply(take,prompt,out.sequence,allowed,style,isOpening);lastReply.modelAttempts=out.attempts;
   }
   if(isOpening){if(!lastReply.generationFallback)lastReply.title='AI opening';delete lastReply.parentTakeId;}
   lastReply.cfg={...lastReply.cfg,soundSlug:contrastingSound()};
   TK.save(lastReply); // Keep the full generated phrase even when the user interrupts playback.
   find('duet-keep').disabled=false;
   status(lastReply.generationFallback?'The model was silent; playing a local echo instead.':'AI’s turn. Play a note whenever you want to take over.');
   await window.aqNotebook.play(lastReply,false,true);
  }catch(e){if(run===epoch&&enabled)status(e.message);}
  finally{thinking=false;if(enabled&&opening&&!queuedTake&&!window.aqNotebook.replay.playing())waitForHuman();if(enabled&&queuedTake){const next=queuedTake;queuedTake=null;document.dispatchEvent(new CustomEvent('aq:phrase',{detail:next}));}}
 });
 document.addEventListener('aq:note',e=>{if(panel.hidden)return;const n=e.detail;if(n.type==='on')humanHeld.add(n.code);else humanHeld.delete(n.code);roll.note(n.type,n.midi,n.code,'human');if(!enabled||isBacking())return;if(e.detail.type==='off'&&opening&&!humanHeld.size&&!thinking&&!window.aqNotebook.replay.playing())waitForHuman();if(e.detail.type==='on'){
  opening=false;clearTimeout(openingTimer);epoch++;status(ready?'Your turn. Pause when your phrase is finished.':'Model loading. Your notes still work.');
 }});
 document.addEventListener('aq:replay-tick',({detail:d})=>{
  if(panel.hidden||!replayTake||replayTake.id!==d.id)return;
  const voice=replayTake.origin==='ai'?'ai':'human';
  while(replayCursor<replayTake.events.length&&replayTake.events[replayCursor].t<=d.ms){const e=replayTake.events[replayCursor++];roll.note(e.type,e.midi,'replay-'+(e.code||String(e.midi)),e.voice||voice,performance.now()-(d.ms-e.t));}
 });
 document.addEventListener('aq:replay-stop',()=>{roll.release();replayTake=null;if(opening){waitForHuman();return;}if(enabled&&ready&&!thinking)status('Your turn. Play another phrase.');});
 document.addEventListener('aq:replay-start',({detail})=>{if(detail.kind==='conversation'||isBacking()){backingEpoch++;backing.stop();enabled=false;opening=false;clearTimeout(openingTimer);dispose();window.aqNotebook.conversation.pause();find('duet-start').disabled=false;find('duet-stop').disabled=true;find('duet-first').disabled=false;}epoch++;queuedTake=null;roll.release();});
 document.addEventListener('aq:replay-playing',({detail:take})=>{replayTake=take;replayCursor=0;});
 document.addEventListener('aq:configuration',()=>{epoch++;clearTimeout(openingTimer);lastReply=null;find('duet-keep').disabled=true;});
 document.addEventListener('change',e=>{if(!panel.contains(e.target)&&!mode.contains(e.target)){epoch++;if(enabled&&isBacking()&&e.target.id==='synthMenu')refreshBacking();if(enabled&&!isBacking()){window.aqNotebook.stop();status('Settings changed. Play a new phrase.');}}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&enabled)stop();});
 window.addEventListener('pagehide',()=>{if(enabled)stop();});
 window.addEventListener('resize',()=>roll.resize());
 // Read-only status for acceptance tests; generation always runs through the real model.
 window.aqDuet={state:()=>({enabled,ready,thinking,opening,workerStarts,pendingRequests:pending.size,reply:lastReply,prompt:lastPrompt,visualNotes:roll.snapshot(),backing:backing.state(),backingBusy}),stop};
}
