// Explicit scale-aware arrangements of a model-generated motif, not neural chords.
// A local chord-fit estimate, not a model-generated harmony or key change.
export function estimateDegree(pitches,root,notes,previous=0){
 const classes=[...new Set(pitches.map(p=>(p-root+1200)%12))].sort((a,b)=>a-b);
 if(!classes.length||!notes.length)return previous;
 const scores=classes.map((_,degree)=>notes.reduce((sum,n)=>{
  const pc=(n.midi-root+1200)%12,tones=[classes[degree],classes[(degree+2)%classes.length],classes[(degree+4)%classes.length]];
  return sum+n.weight*(tones.includes(pc)?1:0)+(pc===tones[0]?n.weight*.15:0);
 },0));
 const best=scores.indexOf(Math.max(...scores)),current=scores[previous%classes.length];
 return scores[best]>current+notes.reduce((s,n)=>s+n.weight,0)*.12?best:previous;
}
export function backingNotes(pitches,root,beat,options,motif){
 const classes=[...new Set(pitches.map(p=>(p-root+1200)%12))].sort((a,b)=>a-b);
 if(!classes.length)return [];
 const base=Math.max(24,Math.min(...pitches)-24),tonic=base+((root-base+1200)%12);
 const degrees=options.progression==='rise'?[0,1,2,3]:options.progression==='return'?[0,3,4,0]:[0];
 const degree=(options.progression==='follow'?(options.followDegree||0):degrees[Math.floor(beat/4)%degrees.length])%classes.length;
 const note=i=>tonic+classes[i%classes.length]+12*Math.floor(i/classes.length);
 const chord=[note(degree),note(degree+2),note(degree+4)];
 const pulse=Math.floor(beat*2),choice=motif.length?motif[pulse%motif.length]:root;
 const nearest=chord.reduce((a,b)=>Math.abs((a%12)-(choice%12))<Math.abs((b%12)-(choice%12))?a:b);
 if(options.texture==='chords')return beat%2===0?chord:[];
 if(options.texture==='rhythm')return [beat%1===0?chord[0]:nearest];
 return [chord[(pulse+Math.max(0,chord.indexOf(nearest)))%chord.length]];
}
export function createAccompaniment({getPitches,getRoot,emit,onBeat,clock=()=>performance.now(),later=setTimeout,cancel=clearTimeout}){
 let active=false,timer=null,beat=0,next=0,serial=0,instrument=null,options={tempo:90,density:'steady',texture:'chords',progression:'follow',volume:.25},pending={},motif=[],pendingMotif=null;
 const held=new Map(),offs=new Set(),human=new Map();let recent=[],followDegree=0;
 function observe(type,midi,code){if(!active)return;const now=clock();if(type==='on')human.set(code,{midi,start:now});else{const n=human.get(code);if(n){recent.push({...n,end:now});human.delete(code);}}recent=recent.filter(n=>now-n.end<8000).slice(-64);}
 function follow(){const now=clock();recent=recent.filter(n=>now-n.end<8000);const notes=[...recent,...[...human.values()].map(n=>({...n,end:now}))].map(n=>({midi:n.midi,weight:Math.min(2000,Math.max(50,n.end-n.start))*Math.max(0,1-(now-n.end)/8000)}));followDegree=estimateDegree(getPitches(),getRoot(),notes,followDegree);options.followDegree=followDegree;}

 function off(code){const h=held.get(code);if(!h)return;h.node.stop();held.delete(code);emit('off',h.midi,code,h.volume);}
 function tick(){
  if(!active)return;
  // Changes take effect at the next whole beat; never restart the timeline.
  if(beat%1===0){options={...options,...pending};pending={};if(pendingMotif){motif=pendingMotif;pendingMotif=null;}}
  if(beat%4===0&&options.progression==='follow')follow();
  const step=options.density==='busy'?.5:1,play=options.density!=='sparse'||beat%2===0;
  if(play)for(const midi of backingNotes(getPitches(),getRoot(),beat,options,motif)){
   const code='backing-'+serial++,node=instrument.play(midi,undefined,{gain:options.volume*6});held.set(code,{node,midi,volume:options.volume});emit('on',midi,code,options.volume);
   const timeout=later(()=>{offs.delete(timeout);off(code);},60000/options.tempo*(options.texture==='chords'?1.7:step*.75));offs.add(timeout);
  }
  onBeat?.({beat,options:{...options}});beat+=step;next+=60000/options.tempo*step;
  timer=later(tick,Math.max(0,next-clock()));
 }
 function stop(){active=false;human.clear();recent=[];followDegree=0;cancel(timer);timer=null;for(const t of offs)cancel(t);offs.clear();for(const code of [...held.keys()])off(code);}
 return {start(value,notes){stop();instrument=value;motif=notes.slice();active=true;beat=0;next=clock();tick();},stop,observe,update(value){pending={...pending,...value};},motif(notes){pendingMotif=notes.slice();},state:()=>({active,beat,voices:held.size,options:{...options},pending:{...pending},motif:motif.slice()})};
}
