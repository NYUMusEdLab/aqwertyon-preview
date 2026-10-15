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
 const notes=phraseNotes(take);if(notes.length<2)throw new Error('Play a phrase with at least two separate notes, then pause.');
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
 events.sort((a,b)=>a.t-b.t||(a.type==='off'?-1:1));
 return {id:'ai_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),tool:'aqwertyon-preview',ts:Date.now(),title:'AI reply · '+(take.title||'your phrase').slice(0,150),origin:'ai',parentTakeId:take.id,model:'Magenta basic_rnn',cfg:{...take.cfg},duration:Math.max(...events.map(e=>e.t)),events};
}
