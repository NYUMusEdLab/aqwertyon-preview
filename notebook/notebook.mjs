import * as TK from './takes.mjs';
let app,recorder,replay,removed=null,replayId=null,previous=null,liveFrame=0,replayCounts=new Map(),generation=0;
const $=id=>document.getElementById(id);
const tool='aqwertyon-preview';
const status=text=>{$('melody-status').textContent=text;};
const label=m=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][m%12]+(Math.floor(m/12)-1);
const pitches=events=>[...new Set(events.map(e=>e.midi))].sort((a,b)=>a-b);
const cfg=()=>({soundSlug:app.options.soundSlug,scaleSlug:app.options.scaleSlug,midiRoot:app.options.midiRoot,layout:app.options.features.layout,volume:app.options.volume});
function currentEvents(){const c=recorder.current();return c?c.events.concat([...c.held].map(([code,midi])=>({type:'off',code,midi,t:performance.now()-c.t0}))):[];}
function drawLive(){const events=currentEvents();TK.drawRoll($('melody-live'),events,{pitches:pitches(events),labels:label});if(recorder.active())liveFrame=requestAnimationFrame(drawLive);}
function storage(){ $('melody-storage').textContent=TK.storageAvailable()?'Saved in this browser · newest 60 melodies · Export for a backup':'Browser storage unavailable · kept for this visit only · Export for a backup';}
function render(){
 const host=$('melody-list');host.replaceChildren();const list=TK.list(tool);$('melody-count').textContent=list.length;
 $('melody-export').disabled=!list.length;
 if(!list.length){const p=document.createElement('p');p.textContent='Play two or more notes over at least 0.8 seconds. After you release the keys and pause for 2.5 seconds, your melody appears here.';host.append(p);}
 for(const take of list){
  const card=document.createElement('article');card.className='melody-card';card.dataset.id=take.id;
  const title=document.createElement('input');title.type='text';title.maxLength=200;title.value=take.title||'Untitled melody';title.setAttribute('aria-label','Melody name');title.addEventListener('change',()=>TK.rename(take.id,title.value.trim()));
  const info=document.createElement('p');info.textContent=`${(take.duration/1000).toFixed(1)} s · ${take.cfg?.scaleSlug||'scale'} · ${take.cfg?.soundSlug?.replaceAll('_',' ')||'sound'}`;
  const canvas=document.createElement('canvas');canvas.height=100;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Piano roll of '+(take.title||'untitled melody'));
  const controls=document.createElement('div');controls.className='melody-actions';
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;controls.append(b);return b;};
  if(replayId===take.id)button('Stop',()=>stop());
  else {button('Replay melody',()=>play(take,false));if(take.media?.id)button('With video',()=>play(take,true));}
  button('Delete',()=>{if(replayId===take.id)stop();removed=take;TK.remove(take.id);$('melody-undo').hidden=false;});
  card.append(title,info,canvas,controls);host.append(card);requestAnimationFrame(()=>TK.drawRoll(canvas,take.events,{pitches:pitches(take.events),labels:label,duration:take.duration}));
 }
 storage();
}
function stop(){
 generation++;replay.stop(true);replayCounts.clear();replayId=null;
 if(previous){app.audioControls.switchSound(previous.sound,'soundfont');if(app.video.ready){if(!previous.withVideo)app.video.player.seekTo(previous.time||0,true);if(previous.playing)app.video.player.playVideo();else app.video.player.pauseVideo();}previous=null;}
 status('Ready for your next melody');render();
 $('keyboardContainer').focus({preventScroll:true});
}
async function play(take,withVideo){
 app.releaseNotes();recorder.finish();stop();const run=++generation;
 replayId=take.id;status('Loading melody sound…');render();
 previous={sound:app.options.soundSlug,time:app.video.ready?app.video.player.getCurrentTime():0,playing:app.video.ready&&app.video.player.getPlayerState()===1,withVideo};
 const sound=take.cfg?.soundSlug||'rock_organ';app.audioControls.switchSound(sound,'soundfont');
 for(let i=0;i<100;i++){if(run!==generation)return;if(app.audioControls.sounds._currInstrument&&app.audioControls.sounds._requestedInstrument===sound&&app.audioControls.sounds._loadedInstruments[sound]===app.audioControls.sounds._currInstrument)break;await new Promise(r=>setTimeout(r,100));}
 if(run!==generation)return;
 if(app.audioControls.sounds._loadedInstruments[sound]!==app.audioControls.sounds._currInstrument||!app.audioControls.sounds._currInstrument){stop();status('The melody sound could not load. Check your connection and try again.');return;}
 if(withVideo){app.video.enabled=true;app.video.videoSlug=take.media.id;app.video.start=take.media.offset||0;await app.video.load();if(run!==generation)return;if(!app.video.ready){stop();status('The video could not load. Replay the melody alone or try again.');return;}app.video.player.loadVideoById({videoId:take.media.id,startSeconds:take.media.offset||0});
  let playing=false;
  for(let i=0;i<80;i++){if(run!==generation)return;if(app.video.player.getPlayerState()===1){playing=true;break;}await new Promise(r=>setTimeout(r,100));}
  if(!playing){stop();status('The video did not start. Press Play in the video or replay the melody alone.');return;}
 }
 else if(app.video.ready)app.video.player.pauseVideo();
 status(withVideo?'Replaying with the video':'Replaying melody');
 replay.play(take,{onTick(ms){const c=[...$('melody-list').children].find(c=>c.dataset.id===take.id);if(c)TK.drawRoll(c.querySelector('canvas'),take.events,{pitches:pitches(take.events),labels:label,duration:take.duration,playhead:ms});},onEnd:()=>stop()});
 $('keyboardContainer').focus({preventScroll:true});
}
function init(){
 if(recorder)return;app=window.appInfo.app;if(!app?.keyboard.keyboardContainer)return;
 const section=document.createElement('details');section.id='melody-notebook';section.open=true;
 section.innerHTML='<summary>Melody Notebook <span id="melody-count">0</span></summary><div class="notebook-body"><p id="melody-status" role="status">Ready for your next melody</p><canvas id="melody-live" height="65" aria-label="Current melody piano roll" role="img"></canvas><p id="melody-storage"></p><p class="melody-note">Captures your played notes and timing, not microphone or video audio. Settings links do not include your melodies.</p><div class="melody-actions"><button id="melody-finish" type="button">Save phrase now</button><button id="melody-export" type="button">Export melodies</button><label class="import-label">Import melodies<input id="melody-import" type="file" accept=".json,application/json"></label><button id="melody-undo" type="button" hidden>Undo delete</button></div><div id="melody-list"></div></div>';
 document.getElementById('main').after(section);$('keyboardContainer').tabIndex=0;
 recorder=TK.createRecorder({tool,cfg,media:()=>app.video.ready&&app.video.player.getPlayerState()===1?{id:app.video.videoSlug,offset:app.video.player.getCurrentTime()}:null,onStart(){status('Capturing your melody…');cancelAnimationFrame(liveFrame);drawLive();},onEnd(t){cancelAnimationFrame(liveFrame);status(t?'Melody saved':'Play a little longer to keep a melody');render();}});
 replay=TK.createPlayer({noteOn(midi){const n=replayCounts.get(midi)||0;if(!n)app.audioControls.noteOn(midi);replayCounts.set(midi,n+1);},noteOff(midi){const n=Math.max(0,(replayCounts.get(midi)||0)-1);replayCounts.set(midi,n);if(!n)app.audioControls.noteOff(midi);}});
 document.addEventListener('aq:note',e=>{if(replayId){if(e.detail.type==='on')stop();return;}const d=e.detail;d.type==='on'?recorder.noteOn(d.midi,d.code):recorder.noteOff(d.midi,d.code);});
 document.addEventListener('aq:configuration',()=>{app.releaseNotes();recorder.finish();if(replayId)stop();});
 document.addEventListener('aq:takes',render);
 document.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')){app.releaseNotes();app.keyboard.buttons.deactivate('');}});
 document.addEventListener('focusout',e=>{if(e.target.matches('input,textarea,select'))app.keyboard.buttons.activate();});
 window.addEventListener('blur',()=>{app.releaseNotes();recorder.finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){app.releaseNotes();recorder.finish();if(replayId)stop();}});
 window.addEventListener('pagehide',()=>{app.releaseNotes();recorder.finish();});
 $('melody-finish').onclick=()=>{app.releaseNotes();recorder.finish();};
 $('melody-export').onclick=()=>{const url=URL.createObjectURL(new Blob([TK.exportJSON(tool)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aqwertyon-melodies.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('melody-import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024)throw new Error('Choose a JSON file smaller than 5 MB.');const n=TK.importJSON(await f.text());status(n+' melodies imported');}catch(error){status(error.message);}e.target.value='';};
 $('melody-undo').onclick=()=>{if(removed){TK.save(removed);removed=null;}$('melody-undo').hidden=true;};
 section.addEventListener('toggle',()=>{if(section.open)render();else if(replayId)stop();});
 window.addEventListener('resize',render);render();
 window.aqNotebook={recorder,replay,play,stop,TK};
}
document.addEventListener('aq:ready',()=>setTimeout(init,0));if(window.appInfo?.app)setTimeout(init,0);
