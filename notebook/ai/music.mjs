// Musical adaptation around a real MelodyRNN continuation; no fabricated fallback.
export function phraseNotes(take){
 const held=new Map(),notes=[];
 for(const e of take.events){const key=e.code||String(e.midi);if(e.type==='on')held.set(key,e);else if(held.has(key)){const on=held.get(key);held.delete(key);notes.push({pitch:on.midi,start:on.t,end:Math.max(on.t+70,e.t)});}}
 // Chords become a single melodic upper voice for this monophonic model.
 notes.sort((a,b)=>a.start-b.start||b.pitch-a.pitch);
 const mono=[];for(const n of notes){if(!mono.length||n.start-mono[mono.length-1].start>40)mono.push(n);}
 return mono.slice(-32);
}
export function preparePrompt(take){
 const notes=phraseNotes(take);if(!notes.length)throw new Error('Play a phrase, then pause.');if(notes.length===1){const n=notes[0];notes.push({...n,start:n.end+150,end:n.end+450});}
 const first=notes[0].start, gaps=notes.slice(1).map((n,i)=>n.start-notes[i].start).sort((a,b)=>a-b);
 // Treat typical onset spacing as an eighth note, retaining expressive timing in the reply.
 const beat=Math.max(300,Math.min(1000,gaps[Math.floor(gaps.length/2)]*2));const step=beat/4;
 const median=[...notes].sort((a,b)=>a.pitch-b.pitch)[Math.floor(notes.length/2)].pitch;
 const shift=Math.round((65-median)/12)*12;
 const quantized=notes.map((n,i)=>{const start=Math.max(i,Math.round((n.start-first)/step));return {pitch:Math.max(48,Math.min(83,n.pitch+shift)),quantizedStartStep:start,quantizedEndStep:Math.max(start+1,Math.round((Math.min(n.end,notes[i+1]?.start??n.end)-first)/step))};});
 for(let i=1;i<quantized.length;i++){quantized[i-1].quantizedEndStep=Math.min(quantized[i-1].quantizedEndStep,quantized[i].quantizedStartStep);}
 const total=quantized[quantized.length-1].quantizedEndStep;
 return {notes,shift,beat,sequence:{notes:quantized,quantizationInfo:{stepsPerQuarter:4},tempos:[{qpm:60000/beat}],totalQuantizedSteps:total},steps:Math.max(16,Math.min(48,total))};
}
const nearest=(pitch,allowed)=>allowed.reduce((best,p)=>Math.abs(p-pitch)<Math.abs(best-pitch)?p:best,allowed[0]);
export function shapeReply(take,prompt,generated,allowed,style='related'){
 const pitches=(generated.notes||[]).map(n=>n.pitch-prompt.shift).filter(Number.isFinite);
 if(!pitches.length)throw new Error('The model returned silence. Play another phrase to try again.');
 const source=prompt.notes;const center=source.reduce((s,n)=>s+n.pitch,0)/source.length;
 let range=allowed.filter(p=>p>=Math.min(...source.map(n=>n.pitch))-7&&p<=Math.max(...source.map(n=>n.pitch))+7);
 if(!range.length)range=allowed.slice();if(!range.length)throw new Error('Choose a keyboard layout with playable notes.');
 range.sort((a,b)=>a-b);
 const genCenter=pitches.reduce((s,p)=>s+p,0)/pitches.length;const octave=Math.round((center-genCenter)/12)*12;
 const count=Math.max(2,Math.min(16,source.length));const events=[];let last=style==='related'?source[0].pitch:source[source.length-1].pitch;
 const first=source[0].start, span=source[Math.min(source.length-1,count-1)].end-first;
 const timeScale=Math.min(1,8000/Math.max(1,span));
 for(let i=0;i<count;i++){
  let target=pitches[i%pitches.length]+octave;
  if(style==='related'&&i<Math.min(2,count-1))target=source[i].pitch; // recognizable opening motif
  const close=range.filter(p=>Math.abs(p-last)<=7);const choices=close.length?close:range;
  let midi=nearest(target,choices);
  if(i===count-1&&style==='related'){
   const root=take.cfg?.midiRoot??source[0].pitch;
   const resting=choices.filter(p=>[0,7].includes(((p-root)%12+12)%12));
   if(resting.length)midi=nearest(midi,resting);
  }
  const n=source[i],start=Math.round((n.start-first)*timeScale),next=source[i+1];
  const end=Math.max(start+65,Math.round((Math.min(n.end,next?.start??n.end)-first)*timeScale));
  events.push({type:'on',midi,code:'ai-'+i,t:start},{type:'off',midi,code:'ai-'+i,t:end});last=midi;
 }
 events.sort((a,b)=>a.t-b.t||(a.type===b.type?0:a.type==='off'?-1:1));
 return {id:'ai_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),tool:'aqwertyon-preview',ts:Date.now(),title:'AI reply · '+(take.title||'your phrase').slice(0,150),origin:'ai',parentTakeId:take.id,model:'Magenta basic_rnn',cfg:{...take.cfg},duration:Math.max(...events.map(e=>e.t)),events};
}

export const replyStyles={
 echo:'Repeat your notes, chords and timing exactly.',
 extend:'Recall the end of your phrase, then continue with new model-generated notes.',
 contrast:'Answer with an inverted melodic shape and a different rhythmic pace.',
 complement:'Answer more sparsely, placing notes between the beats of your phrase.',
 harmonize:'Replay your phrase with an added consonant voice from the selected scale.'
};
export function styledReply(take,prompt,generated,allowed,style){
 const make=events=>({id:'ai_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),tool:'aqwertyon-preview',ts:Date.now(),title:style[0].toUpperCase()+style.slice(1)+' · '+(take.title||'your phrase').slice(0,140),origin:'ai',parentTakeId:take.id,replyStyle:style,model:['echo','harmonize'].includes(style)?'Local musical transformation':'Magenta basic_rnn + musical transformation',cfg:{...take.cfg},duration:Math.max(...events.map(e=>e.t)),events:events.sort((a,b)=>a.t-b.t||(a.type===b.type?0:a.type==='off'?-1:1))});
 if(style==='echo')return make(take.events.map(e=>({...e})));
 if(style==='harmonize'){
  const events=take.events.map(e=>({...e})), held=new Map();let voice=0;
  for(const e of take.events){const key=e.code||String(e.midi);
   if(e.type==='on'){
    const chord=take.events.filter(n=>n.type==='on'&&Math.abs(n.t-e.t)<45).map(n=>n.midi);
    const choices=allowed.filter(p=>!chord.includes(p)&&[3,4,7,8,9,12].includes(Math.abs(e.midi-p))&&chord.every(n=>![1,2,10,11].includes(((p-n)%12+12)%12)));
    if(!choices.length)continue;const midi=choices.reduce((a,b)=>Math.abs(b-e.midi)<Math.abs(a-e.midi)?b:a,choices[0]),code='harmony-'+voice++;held.set(key,{midi,code});events.push({type:'on',midi,code,t:e.t});
   }else if(held.has(key)){events.push({type:'off',...held.get(key),t:e.t});held.delete(key);}
  }
  return make(events);
 }
 const base=shapeReply(take,prompt,generated,allowed,'explore'), notes=phraseNotes(base), source=prompt.notes,events=[];
 const add=(midi,t,end,i)=>events.push({type:'on',midi,code:'style-'+i,t:Math.round(t)},{type:'off',midi,code:'style-'+i,t:Math.round(Math.max(t+70,end))});
 if(style==='extend'){
  const tail=source.slice(-2),zero=tail[0].start;tail.forEach((n,i)=>add(nearest(n.pitch,allowed),n.start-zero,n.end-zero,i));
  const offset=Math.max(...events.map(e=>e.t))+prompt.beat/4;
  notes.forEach((n,i)=>add(n.pitch,offset+n.start,offset+n.end,i+2));
 }else if(style==='contrast'){
  const center=source.reduce((s,n)=>s+n.pitch,0)/source.length;
  source.slice(0,16).forEach((n,i)=>{const t=i*prompt.beat*.75;add(nearest(2*center-n.pitch,allowed),t,t+prompt.beat*.48,i);});
 }else if(style==='complement'){
  notes.filter((n,i)=>i%2===0).forEach((n,i)=>{const t=i*prompt.beat+prompt.beat/2;add(n.pitch,t,t+prompt.beat*.35,i);});
 }else return base;
 return make(events);
}

// An explicit local echo keeps the interaction going after three silent model samples.
export function audibleReply(take,prompt,generated,allowed,style,opening=false){
 if(!(generated.notes||[]).some(n=>Number.isFinite(n.pitch))){
  const reply=styledReply(take,null,null,allowed,'echo');
  reply.title='Echo · model returned silence';reply.generationFallback='model-silence';
  reply.requestedStyle=style;return reply;
 }
 return opening?shapeReply(take,prompt,generated,allowed,'explore'):styledReply(take,prompt,generated,allowed,style);
}
