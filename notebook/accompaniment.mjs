// Explicit scale-aware arrangements of a model-generated motif, not neural chords.
export function backingNotes(pitches,root,beat,options,motif){
 const classes=[...new Set(pitches.map(p=>(p-root+1200)%12))].sort((a,b)=>a-b);
 if(!classes.length)return [];
 const base=Math.max(24,Math.min(...pitches)-24),tonic=base+((root-base+1200)%12);
 const degrees=options.progression==='rise'?[0,1,2,3]:options.progression==='return'?[0,3,4,0]:[0];
 const degree=degrees[Math.floor(beat/4)%degrees.length]%classes.length;
 const note=i=>tonic+classes[i%classes.length]+12*Math.floor(i/classes.length);
 const chord=[note(degree),note(degree+2),note(degree+4)];
 const pulse=Math.floor(beat*2),choice=motif.length?motif[pulse%motif.length]:root;
 const nearest=chord.reduce((a,b)=>Math.abs((a%12)-(choice%12))<Math.abs((b%12)-(choice%12))?a:b);
 if(options.texture==='chords')return beat%2===0?chord:[];
 if(options.texture==='rhythm')return [beat%1===0?chord[0]:nearest];
 return [nearest];
}
export function createAccompaniment({getPitches,getRoot,emit,onBeat,clock=()=>performance.now(),later=setTimeout,cancel=clearTimeout}){
 let active=false,timer=null,beat=0,next=0,serial=0,instrument=null,options={tempo:90,density:'steady',texture:'arpeggio',progression:'home',volume:.25},pending={},motif=[],pendingMotif=null;
 const held=new Map(),offs=new Set();
 function off(code){const h=held.get(code);if(!h)return;h.node.stop();held.delete(code);emit('off',h.midi,code,h.volume);}
 function tick(){
  if(!active)return;
  // Changes take effect at the next whole beat; never restart the timeline.
  if(beat%1===0){options={...options,...pending};pending={};if(pendingMotif){motif=pendingMotif;pendingMotif=null;}}
  const step=options.density==='busy'?.5:1,play=options.density!=='sparse'||beat%2===0;
  if(play)for(const midi of backingNotes(getPitches(),getRoot(),beat,options,motif)){
   const code='backing-'+serial++,node=instrument.play(midi,undefined,{gain:options.volume*6});held.set(code,{node,midi,volume:options.volume});emit('on',midi,code,options.volume);
   const timeout=later(()=>{offs.delete(timeout);off(code);},60000/options.tempo*(options.texture==='chords'?1.7:step*.75));offs.add(timeout);
  }
  onBeat?.({beat,options:{...options}});beat+=step;next+=60000/options.tempo*step;
  timer=later(tick,Math.max(0,next-clock()));
 }
 function stop(){active=false;cancel(timer);timer=null;for(const t of offs)cancel(t);offs.clear();for(const code of [...held.keys()])off(code);}
 return {start(value,notes){stop();instrument=value;motif=notes.slice();active=true;beat=0;next=clock();tick();},stop,update(value){pending={...pending,...value};},motif(notes){pendingMotif=notes.slice();},state:()=>({active,beat,voices:held.size,options:{...options},pending:{...pending},motif:motif.slice()})};
}
