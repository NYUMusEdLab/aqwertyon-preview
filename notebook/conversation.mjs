// Browser-local, actual performed events; no model regeneration or network IO.
export function createConversation(getConfig,notify=()=>{}){
 let draft=null,enabled=false,held=new Map(),serial=0,zero=0;
 const now=()=>performance.now();
 function start(){if(!draft){draft={id:'conversation_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),tool:'aqwertyon-preview',kind:'conversation',origin:'conversation',title:'',ts:Date.now(),cfg:getConfig(),events:[],duration:0};zero=now();}enabled=true;}
 function time(){return Math.min(1200000,Math.round(now()-zero));}
 function note(type,midi,key,voice,cfg){
  if(!enabled||!draft)return;
  if(time()>=1200000||draft.events.length>=20000){pause();notify('Conversation limit reached. Keep it, then start a new conversation.');return;}
  const token=voice+':'+key,t=time();
  if(type==='on'){
   if(held.has(token))return;const code='dialogue-'+serial++,e={type,midi,code,key,voice,t,cfg:JSON.parse(JSON.stringify(cfg||getConfig()))};held.set(token,e);draft.events.push(e);
  }else if(held.has(token)){const e=held.get(token);draft.events.push({type,midi:e.midi,code:e.code,voice:e.voice,t});held.delete(token);}
  draft.duration=t;notify();
 }
 function pause(){if(!draft)return;for(const e of held.values())draft.events.push({type:'off',midi:e.midi,code:e.code,voice:e.voice,t:time()});held.clear();draft.duration=time();enabled=false;notify();}
 function snapshot(){if(!draft||!draft.events.length)return null;const out=JSON.parse(JSON.stringify(draft));out.duration=enabled?time():draft.duration;for(const e of held.values())out.events.push({type:'off',midi:e.midi,code:e.code,voice:e.voice,t:out.duration});return out;}
 function fresh(){pause();draft=null;held.clear();serial=0;start();}
 return {start,pause,note,snapshot,fresh,hasContent:()=>!!draft?.events.length,active:()=>enabled};
}
