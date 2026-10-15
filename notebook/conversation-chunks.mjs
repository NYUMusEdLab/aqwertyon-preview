// Presentation/replay slices: original saved event times remain unchanged.
export function conversationChunks(take,gap=15000){
 if(take.kind!=='conversation'||!take.events?.length)return [take];
 const events=take.events.slice().sort((a,b)=>a.t-b.t),groups=[];let group=[],held=new Set(),last=0;
 for(const e of events){
  if(e.type==='on'&&group.length&&!held.size&&e.t-last>=gap){groups.push(group);group=[];}
  group.push(e);if(e.type==='on')held.add(e.code||String(e.midi));else held.delete(e.code||String(e.midi));last=e.t;
 }
 if(group.length)groups.push(group);
 return groups.map((items,index)=>{const offset=items[0].t,end=items.at(-1).t;return {...take,id:groups.length>1?take.id+'-session-'+offset:take.id,title:take.sessionTitles?.[offset]??take.title,cfg:items.find(e=>e.type==='on')?.cfg||take.cfg,duration:end-offset,events:items.map(e=>({...e,t:e.t-offset})),_parentId:take.id,_offset:offset,_end:end,_session:index+1,_sessions:groups.length};}).reverse();
}
