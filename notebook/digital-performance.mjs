// Lossless note timing in milliseconds. No audio, identity, URLs or executable fields.
const text=(v,n=160)=>typeof v==='string'?v.slice(0,n):'';
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
function config(c={}){return {soundSlug:typeof c.soundSlug==='string'&&/^[a-z0-9_]{1,64}$/.test(c.soundSlug)?c.soundSlug:'flute',scaleSlug:text(c.scaleSlug,80),rootSpelling:text(c.rootSpelling,8),midiRoot:finite(c.midiRoot,0,127)?c.midiRoot:60,volume:finite(c.volume,0,1)?c.volume:.5,replyStyle:text(c.replyStyle,40),arrangement:text(c.arrangement,80)};}
export function validateDigitalPerformance(raw){
 if(raw?.format!=='musedlab-digital-performance'||raw.version!==1||!finite(raw.durationMs,1,1200000)||!Array.isArray(raw.notes)||!raw.notes.length||raw.notes.length>20000)throw new Error('Invalid digital performance or limits exceeded.');
 const notes=raw.notes.map((n,i)=>{if(!Number.isInteger(n.midi)||!finite(n.midi,0,127)||!finite(n.startMs,0,raw.durationMs)||!finite(n.durationMs,0,raw.durationMs-n.startMs)||!['human','ai'].includes(n.voice))throw new Error('Invalid note timing or voice.');return {id:String(i),midi:n.midi,startMs:n.startMs,durationMs:n.durationMs,voice:n.voice,config:config(n.config)};});
 return {format:raw.format,version:1,title:text(raw.title),source:'aqwertyon',sourceId:text(raw.sourceId),durationMs:raw.durationMs,notes,config:config(raw.config)};
}
export function digitalPerformance(take){
 const notes=[],held=new Map(),durationMs=Math.max(1,Math.min(1200000,take.duration||0));
 const end=(e,t)=>notes.push({midi:e.midi,startMs:e.t,durationMs:Math.max(0,t-e.t),voice:e.voice==='ai'||(!e.voice&&take.origin==='ai')?'ai':'human',config:config(e.cfg||take.cfg)});
 for(const e of [...take.events].sort((a,b)=>a.t-b.t)){
  const key=(e.voice||'')+':'+(e.code??e.midi);
  if(e.type==='on'){if(held.has(key))end(held.get(key),e.t);held.set(key,e);}
  else if(e.type==='off'&&held.has(key)){end(held.get(key),e.t);held.delete(key);}
 }
 for(const e of held.values())end(e,durationMs);
 return validateDigitalPerformance({format:'musedlab-digital-performance',version:1,title:take.title||'Untitled performance',sourceId:take.id,durationMs,notes,config:take.cfg});
}
