import './language.mjs';
import {openPerformanceMirror} from './mirror-handoff.mjs';
import {conversationChunks} from './conversation-chunks.mjs';
import {createConversation} from './conversation.mjs';
import * as TK from './takes.mjs';
import {initNoteViews} from './note-views.mjs';
import {initDuet} from './duet.mjs';
let app,recorder,replay,removed=null,replayId=null,previous=null,liveFrame=0,replayCounts=new Map(),generation=0;
let renderedFirst=null,undoSession=null,pageStart=0,pageSize=1;
let conversation,conversationSaveTimer=null,liveDuet=false,playingTake=null,conversationVoices=new Map();
let replayKeys=new Map(),pitchKeys=new Map(),lastKey=null;
const $=id=>document.getElementById(id);
const tool='aqwertyon-preview';
const status=text=>{$('melody-status').textContent=text;};
const label=m=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][m%12]+(Math.floor(m/12)-1);
const pitches=events=>[...new Set(events.map(e=>e.midi))].sort((a,b)=>a-b);
const cfg=()=>({replyStyle:document.getElementById('duet-style')?.value||'',rootSpelling:app.rootPicker.spelling,captureMode:conversation?.active()?'ai':(app.video.container.dataset.playMode==='video'?'video':'play'),soundSlug:app.audioControls.sounds._requestedInstrument||app.options.soundSlug,scaleSlug:app.options.scaleSlug,midiRoot:app.keyboard.mapping.root,layout:app.options.features.layout,transposition:app.keyboard.mapping.transposition,volume:app.options.volume});
function currentEvents(){const c=recorder.current();return c?c.events.concat([...c.held].map(([code,midi])=>({type:'off',code,midi,t:performance.now()-c.t0}))):[];}
function drawLive(){const events=currentEvents();TK.drawRoll($('melody-live'),events,{pitches:pitches(events),labels:label});if(recorder.active())liveFrame=requestAnimationFrame(drawLive);}
function storage(){ $('melody-storage').textContent=TK.storageAvailable()?'Saved in this browser · newest 60 melodies · Export for a backup':'Browser storage unavailable · kept for this visit only · Export for a backup';}
function render(){
 const host=$('melody-list'),active=document.activeElement;
 const editing=host.contains(active)&&active.matches('input')?{id:active.closest('article').dataset.id,value:active.value,start:active.selectionStart,end:active.selectionEnd}:null;
 host.replaceChildren();const list=TK.list(tool).flatMap(t=>conversationChunks(t));if(list[0]?.id!==renderedFirst)pageStart=0;renderedFirst=list[0]?.id;$('melody-count').textContent=list.length;
 $('melody-export').disabled=!list.length;$('melody-clear').disabled=!list.length;
 if(!list.length){const p=document.createElement('p');p.textContent='Play two or more notes over at least 0.8 seconds. After you release the keys and pause for 2.5 seconds, your melody appears here.';host.append(p);}
 pageSize=Math.max(1,Math.floor((host.clientWidth||innerWidth)/290));pageStart=Math.min(pageStart,Math.max(0,Math.floor((list.length-1)/pageSize)*pageSize));
 $('melody-newer').disabled=pageStart===0;$('melody-older').disabled=pageStart+pageSize>=list.length;
 host.style.setProperty('--take-columns',pageSize);
 for(const take of list.slice(pageStart,pageStart+pageSize)){
  const card=document.createElement('article');card.className='melody-card';card.dataset.id=take.id;
  const mode=take.kind==='conversation'||take.origin==='ai'||take.cfg?.captureMode==='ai'?'ai':take.media?.id?'video':'play';
  card.classList.add(mode+'-take');card.dataset.mode=mode;
  const badge=document.createElement('span');badge.className='take-badge';badge.textContent=mode==='ai'?(take.kind==='conversation'?'✦ AI conversation':'✦ AI reply'):mode==='video'?'▶ Video':'♪ Play';card.append(badge);

  const title=document.createElement('input');title.type='text';title.maxLength=200;title.value=take.title||'';title.placeholder='Untitled melody';title.setAttribute('aria-label','Melody name');title.addEventListener('change',()=>{if(take._sessions>1){const original=TK.get(take._parentId);original.sessionTitles={...original.sessionTitles,[take._offset]:title.value.trim()};TK.save(original);}else TK.rename(take._parentId||take.id,title.value.trim());});
  const info=document.createElement('p');info.textContent=(take._sessions>1?'Session '+take._session+' · ':'')+(take.origin==='ai'?'AI reply · ':'')+`${(take.duration/1000).toFixed(1)} s · ${take.cfg?.scaleSlug||'scale'} · ${take.cfg?.soundSlug?.replaceAll('_',' ')||'sound'}`;
  const canvas=document.createElement('canvas');canvas.height=100;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Piano roll of '+(take.title||'untitled melody'));
  const controls=document.createElement('div');controls.className='melody-actions';
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;controls.append(b);return b;};
  if(replayId===take.id)button('Stop',()=>stop());
  else {button(take.kind==='conversation'?'Replay conversation':'Replay melody',()=>play(take,false));if(take.media?.id)button('With video',()=>play(take,true));}
  {const mirror=button('Mirror ↗',()=>openPerformanceMirror(take,status));mirror.title='Open in Performance Mirror';mirror.setAttribute('aria-label','Open in Performance Mirror');}
  button('Delete',()=>{if(replayId===take.id)stop();undoSession=null;const original=TK.get(take._parentId||take.id);removed=[original||take];if(conversation.snapshot()?.id===(take._parentId||take.id))detachConversation();$('melody-undo').textContent='Undo delete';if(take._sessions>1&&original){undoSession=original;const remaining={...original,events:original.events.filter(e=>e.t<take._offset||e.t>take._end)};TK.save(remaining);}else TK.remove(take._parentId||take.id);$('melody-undo').hidden=false;});
  card.append(title,info,canvas,controls);host.append(card);requestAnimationFrame(()=>TK.drawRoll(canvas,take.events,{pitches:pitches(take.events),labels:label,duration:take.duration,barFor:(m,b)=>b.voice==='ai'?'#c48527':b.voice==='human'?'#008f98':'#b4442c'}));
 }
 if(editing){const card=[...host.children].find(c=>c.dataset.id===editing.id),input=card?.querySelector('input');if(input){input.value=editing.value;input.focus({preventScroll:true});input.setSelectionRange(editing.start,editing.end);}}
 storage();
}
function saveConversation(){
 clearTimeout(conversationSaveTimer);const take=conversation?.snapshot();if(!take)return;
 const prior=TK.get(take.id);if(prior){take.title=prior.title;take.sessionTitles=prior.sessionTitles;}
 TK.save(take);
}
function detachConversation(){clearTimeout(conversationSaveTimer);const active=conversation.active();conversation.fresh();if(!active)conversation.pause();clearTimeout(conversationSaveTimer);}
function chooseReplayKey(midi,code){
 const buttons=app.keyboard.buttons._buttonsByName;
 const matches=b=>b&&b.eventType==='midi'&&!b.disabled&&b.eventData===midi;
 if(matches(buttons[code]))return buttons[code];
 if(matches(pitchKeys.get(midi)))return pitchKeys.get(midi);
 const candidates=Object.entries(buttons).filter(([,b])=>matches(b));
 const position=name=>String(name).split('-').map(Number);
 const previous=lastKey?position(lastKey.name):[0,0];
 const score=([name])=>{const [x,y]=position(name);return Math.abs(y-previous[1])*4+Math.abs(x-previous[0]);};
 candidates.sort((a,b)=>score(a)-score(b));
 const chosen=candidates[0]?.[1];if(chosen){pitchKeys.set(midi,chosen);lastKey=chosen;}return chosen;
}
function replayLights(){
 const active=new Set(replayKeys.values());
 for(const b of Object.values(app.keyboard.buttons._buttonsByName))b.classList.toggle('notebook-playing',active.has(b));
}
function stop(){
 const keepFocus=$('keyboardContainer').contains(document.activeElement);
 generation++;replay.stop(true);liveDuet=false;playingTake=null;for(const n of conversationVoices.values())n.stop();conversationVoices.clear();replayCounts.clear();replayKeys.clear();pitchKeys.clear();lastKey=null;replayLights();replayId=null;
 if(previous){
  app.audioControls.switchSound(previous.sound,'soundfont');
  app.rootPicker.spelling=previous.rootSpelling;app.rootPicker.root=previous.root;app.scalePicker.scale=previous.scale;
  app.keyboard.mapping.layout=previous.layout;app.keyboard.mapping.transposition=previous.transposition;
  if(app.video.ready){app.video.player.pauseVideo();if(!previous.withVideo)app.video.player.seekTo(previous.time||0,true);}
  previous=null;
 }
 status('Ready for your next melody');render();document.dispatchEvent(new CustomEvent('aq:replay-stop'));
 if(keepFocus)$('keyboardContainer').focus({preventScroll:true});
}
async function play(take,withVideo,fromDuet=false){
 const focusOnReplay=$('keyboardContainer').contains(document.activeElement)||!!document.activeElement.closest('.melody-actions');
 app.audioControls.resume();
 if(withVideo)document.dispatchEvent(new CustomEvent('aq:video-replay'));
 document.dispatchEvent(new CustomEvent('aq:replay-start',{detail:{id:take.id,kind:take.kind}}));
 app.releaseNotes();recorder.finish('replay');stop();const run=++generation;
 replayId=take.id;status('Loading melody sound…');render();
 previous={rootSpelling:app.rootPicker.spelling,root:app.keyboard.mapping.root,scale:app.scalePicker.scale,layout:app.options.features.layout,transposition:app.keyboard.mapping.transposition,sound:app.options.soundSlug,time:app.video.ready?app.video.player.getCurrentTime():0,playing:app.video.ready&&app.video.player.getPlayerState()===1,withVideo};
 if(app.video.ready)app.video.player.pauseVideo();
 app.rootPicker.spelling=take.cfg?.rootSpelling||'';
 app.rootPicker.root=Number.isInteger(take.cfg?.midiRoot)&&take.cfg.midiRoot>=0&&take.cfg.midiRoot<=127?take.cfg.midiRoot:previous.root;
 app.scalePicker.scale=app.scalePicker.isValidScale(take.cfg?.scaleSlug)?take.cfg.scaleSlug:previous.scale;
 app.keyboard.mapping.layout=/^(1|3|5|7|8|10|12|14|x)(-(1|3|5|7|8|10|12|14|x)){3}$/.test(take.cfg?.layout)?take.cfg.layout:previous.layout;
 app.keyboard.mapping.transposition=0;
 const sound=take.cfg?.soundSlug||'flute';app.audioControls.switchSound(sound,'soundfont');
 for(let i=0;i<100;i++){if(run!==generation)return;if(app.audioControls.sounds._currInstrument&&app.audioControls.sounds._requestedInstrument===sound&&app.audioControls.sounds._loadedInstruments[sound]===app.audioControls.sounds._currInstrument)break;await new Promise(r=>setTimeout(r,100));}
 if(run!==generation)return;
 if(app.audioControls.sounds._loadedInstruments[sound]!==app.audioControls.sounds._currInstrument||!app.audioControls.sounds._currInstrument){stop();status('The melody sound could not load. Check your connection and try again.');return;}
 if(take.kind==='conversation'){
  const sounds=[...new Set(take.events.filter(e=>e.type==='on').map(e=>e.cfg?.soundSlug||sound))];
  for(const name of sounds){
   if(!(name in app.audioControls.sounds._loadedInstruments)){stop();status('A conversation sound is unavailable.');return;}
   app.audioControls.switchSound(name,'soundfont');
   for(let i=0;i<100&&!app.audioControls.sounds._loadedInstruments[name];i++){if(run!==generation)return;await new Promise(r=>setTimeout(r,100));}
   if(run!==generation)return;if(!app.audioControls.sounds._loadedInstruments[name]){stop();status('A conversation sound is unavailable.');return;}
  }
 }
 if(withVideo){
  app.video.enabled=true;
  const sameVideo=app.video.ready&&app.video.player.getVideoData&&app.video.player.getVideoData().video_id===take.media.id;
  if(sameVideo){app.video.player.seekTo(take.media.offset||0,true);app.video.player.playVideo();}
  else {app.video.videoSlug=take.media.id;app.video.start=take.media.offset||0;await app.video.load();}
  if(run!==generation)return;if(!app.video.ready){stop();status('The video could not load. Replay the melody alone or try again.');return;}
  status('Waiting for the video. Finish any YouTube ad or press Play to begin.');
  let playing=false;
  for(let i=0;i<900;i++){if(run!==generation)return;if(app.video.lastError)break;if(app.video.player.getPlayerState()===1){playing=true;break;}await new Promise(r=>setTimeout(r,100));}
  if(!playing){stop();status('The video did not start. Press Play in the video or replay the melody alone.');return;}
 }
 else if(app.video.ready)app.video.player.pauseVideo();
 status(withVideo?'Replaying with the video':'Replaying melody');
 liveDuet=fromDuet;playingTake=take;
 document.dispatchEvent(new CustomEvent('aq:replay-playing',{detail:take}));
 replay.play(take,{onTick(ms){document.dispatchEvent(new CustomEvent('aq:replay-tick',{detail:{id:take.id,ms}}));const c=[...$('melody-list').children].find(c=>c.dataset.id===take.id);if(c)TK.drawRoll(c.querySelector('canvas'),take.events,{pitches:pitches(take.events),labels:label,duration:take.duration,playhead:ms,barFor:(m,b)=>b.voice==='ai'?'#c48527':b.voice==='human'?'#008f98':'#b4442c'});},onEnd:()=>stop()});
 if(focusOnReplay)$('keyboardContainer').focus({preventScroll:true});
}
function init(){
 document.addEventListener('aq:sound-selection',()=>{if(previous||replayId)stop();});
 if(recorder)return;app=window.appInfo.app;if(!app?.keyboard.keyboardContainer)return;
 const section=document.createElement('details');section.id='melody-notebook';section.open=true;
 section.innerHTML='<summary>Melody Notebook <span id="melody-count">0</span></summary><div class="notebook-body"><nav class="melody-tray-nav" aria-label="Melody history"><button id="melody-newer" type="button">← Newer</button><button id="melody-older" type="button">Older →</button><button id="melody-history" type="button" aria-expanded="false">History and tools</button></nav><p id="melody-status" role="status">Ready for your next melody</p><canvas id="melody-live" height="65" aria-label="Current melody piano roll" role="img"></canvas><p id="melody-storage"></p><p class="melody-note">Captures your played notes and timing, not microphone or video audio. Settings links do not include your melodies.</p><div class="melody-actions"><button id="melody-finish" type="button">Save phrase now</button><button id="melody-export" type="button">Export melodies</button><label class="import-label">Import melodies<input id="melody-import" type="file" accept=".json,application/json"></label><button id="melody-clear" type="button">Clear all</button><button id="melody-undo" type="button" hidden>Undo delete</button></div><div id="melody-list" tabindex="0" aria-label="Saved melodies, newest first"></div></div>';
 document.getElementById('main').after(section);$('keyboardContainer').tabIndex=0;
 conversation=createConversation(cfg,message=>{clearTimeout(conversationSaveTimer);if(conversation?.active())conversationSaveTimer=setTimeout(saveConversation,600);else saveConversation();document.dispatchEvent(new CustomEvent('aq:conversation'));if(message)status(message);});
 recorder=TK.createRecorder({tool,cfg,shouldSave:t=>t.cfg.captureMode!=='ai',media:()=>app.video.ready&&app.video.player.getPlayerState()===1?{id:app.video.videoSlug,offset:app.video.player.getCurrentTime()}:null,onStart(){status('Capturing your melody…');cancelAnimationFrame(liveFrame);drawLive();},onEnd(t,reason){cancelAnimationFrame(liveFrame);status(t?'Melody saved':'Play a little longer to keep a melody');render();if(t&&(reason==='gap'||reason==='manual'))document.dispatchEvent(new CustomEvent('aq:phrase',{detail:t}));}});
 replay=TK.createPlayer({noteOn(midi,code,event){
  if(playingTake?.kind==='conversation'){
   const context=event.cfg||playingTake.cfg;
   if(Number.isInteger(context.midiRoot)&&context.midiRoot>=0&&context.midiRoot<=127)app.keyboard.mapping.root=context.midiRoot;
   if(app.scalePicker.isValidScale(context.scaleSlug))app.scalePicker.scale=context.scaleSlug;
   if(/^(1|3|5|7|8|10|12|14|x)(-(1|3|5|7|8|10|12|14|x)){3}$/.test(context.layout))app.keyboard.mapping.layout=context.layout;
   app.keyboard.mapping.transposition=Number.isInteger(context.transposition)&&Math.abs(context.transposition)<=120?context.transposition:0;
   const instrument=app.audioControls.sounds._loadedInstruments[context.soundSlug];
   if(instrument){instrument.out.gain.value=1;conversationVoices.set(code,instrument.play(midi,undefined,{gain:(event.cfg?.volume??.5)*app.audioControls.sounds._gainBoost}));}
  }else{const n=replayCounts.get(midi)||0;if(!n)app.audioControls.noteOn(midi);replayCounts.set(midi,n+1);}
  const key=chooseReplayKey(midi,event.voice==='human'?(event.key||code):code);if(key)replayKeys.set(code||String(midi),key);
  if(liveDuet)conversation.note('on',midi,code,'ai',{...cfg(),...playingTake.cfg});replayLights();
 },noteOff(midi,code){
  replayKeys.delete(code||String(midi));
  if(conversationVoices.has(code)){conversationVoices.get(code).stop();conversationVoices.delete(code);}
  else{const n=Math.max(0,(replayCounts.get(midi)||0)-1);replayCounts.set(midi,n);if(!n)app.audioControls.noteOff(midi);}
  if(liveDuet)conversation.note('off',midi,code,'ai');replayLights();
 }});
 document.addEventListener('aq:note',e=>{if(replayId){if(e.detail.type==='on')stop();else return;}const d=e.detail;conversation.note(d.type,d.midi,d.code,'human',cfg());d.type==='on'?recorder.noteOn(d.midi,d.code):recorder.noteOff(d.midi,d.code);});
 document.addEventListener('aq:configuration',()=>{app.releaseNotes();recorder.finish();if(replayId)stop();});
 document.addEventListener('aq:takes',render);
 document.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')||e.target.isContentEditable)app.releaseNotes();});
 window.addEventListener('blur',()=>{app.releaseNotes();recorder.finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){app.releaseNotes();recorder.finish();if(replayId)stop();}});
 window.addEventListener('pagehide',()=>{app.releaseNotes();recorder.finish();saveConversation();});
 $('melody-finish').onclick=()=>{app.releaseNotes();recorder.finish();};
 $('melody-export').onclick=()=>{const url=URL.createObjectURL(new Blob([TK.exportJSON(tool)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aqwertyon-melodies.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('melody-import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024)throw new Error('Choose a JSON file smaller than 5 MB.');const n=TK.importJSON(await f.text());status(n+' melodies imported');}catch(error){status(error.message);}e.target.value='';};
 $('melody-clear').onclick=()=>{undoSession=null;stop();detachConversation();const prior=TK.clearAll();if(prior.length){removed=prior;$('melody-undo').textContent='Undo clear all';$('melody-undo').hidden=false;status('Saved melodies cleared. Undo restores them during this visit.');}};
 $('melody-undo').onclick=()=>{if(undoSession){TK.save(undoSession);undoSession=null;removed=null;status('Saved session restored');}else if(removed){TK.restoreCleared(removed);removed=null;status('Saved melodies restored');}$('melody-undo').hidden=true;};
 section.addEventListener('toggle',()=>{if(section.open)render();else if(replayId)stop();});
 window.addEventListener('resize',render);render();
 let notebookWidth=0;new ResizeObserver(entries=>{const width=Math.floor(entries[0].contentRect.width);if(width>0&&width!==notebookWidth){notebookWidth=width;render();}}).observe($('melody-list'));
 $('melody-newer').onclick=()=>{pageStart=Math.max(0,pageStart-pageSize);render();};
 $('melody-older').onclick=()=>{pageStart+=pageSize;render();};
 $('melody-history').onclick=()=>{const on=section.classList.toggle('show-history');$('melody-history').setAttribute('aria-expanded',String(on));};
 window.aqNotebook={recorder,replay,play,stop,TK,conversation};initDuet(app);initNoteViews(app);
}
document.addEventListener('aq:ready',()=>setTimeout(init,0));if(window.appInfo?.app)setTimeout(init,0);
