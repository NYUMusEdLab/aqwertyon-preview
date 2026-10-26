const normalize=v=>v==='en'?'en':v==='zh'?'zh-CN':null;
export function trustedShell(event,{parentWindow=parent,selfWindow=window,referrer=document.referrer,href=location.href}={}){
 const data=event.data;
 if(parentWindow===selfWindow||event.source!==parentWindow||!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).sort().join(',')!=='language,type,version'||data.type!=='rgf-workshop-shell'||data.version!==1||!normalize(data.language))return false;
 try{
  const ref=new URL(referrer),here=new URL(href);
  if(ref.origin!==event.origin)return false;
  if(event.origin==='https://ruthmann.github.io')return true;
  // Local fixtures only; no production trust for arbitrary localhost parents.
  if(['127.0.0.1','localhost'].includes(here.hostname)&&['127.0.0.1','localhost'].includes(ref.hostname)&&ref.protocol==='http:'&&ref.pathname.endsWith('/workbench/weekend/play.html'))return true;
 }catch{}
 return false;
}
export function installWorkshopViewport(setLanguage){
 let active=false,observer=null,arranged=false;
 function arrange(){
  if(arranged)return true;
  const main=document.getElementById('main'),rows=main&&[...main.children].filter(e=>e.classList.contains('row'));
  if(!main||rows.length<5)return false;
  const side=document.createElement('section');side.className='aq-shell-side';side.setAttribute('aria-label','Instrument and accompaniment / 乐器与伴奏');
  const play=document.createElement('section');play.className='aq-shell-play';play.setAttribute('aria-label','Playable keyboard / 演奏键盘');
  rows[0].classList.add('aq-shell-presets');rows[1].classList.add('aq-shell-mode');rows[2].classList.add('aq-shell-scale');rows[3].classList.add('aq-shell-keys');rows[4].classList.add('aq-shell-options');
  side.append(rows[1],rows[4]);play.append(rows[2],rows[3]);
  const soundStatus=side.querySelector('.sound-status');if(soundStatus)play.prepend(soundStatus);
  main.append(side,play);
  for(const button of Object.values(window.appInfo?.app?.keyboard?.buttons?._buttonsByName||{})){if(button.eventType==='transpose')button.classList.add('transpose-key');}
  document.documentElement.classList.add('aq-viewport-fit');
  arranged=true;
  const fit=()=>{const v=window.visualViewport;const height=v&&v.scale===1?Math.min(innerHeight,v.height):innerHeight;document.documentElement.style.setProperty('--aq-viewport-height',Math.floor(height)+'px');};
  fit();addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
  const header=document.querySelector('body>header');if(header){const resize=new ResizeObserver(()=>document.documentElement.style.setProperty('--aq-shell-header-height',header.getBoundingClientRect().height+'px'));resize.observe(header);}
  if(active){const control=document.getElementById('language-switch');if(control)control.hidden=true;}
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./workshop-viewport.css',import.meta.url).href;document.head.append(css);
  return true;
 }
 // Layout is independent of authentication or the optional workshop language handshake.
 function ensureLayout(){if(arrange())return;if(!observer){observer=new MutationObserver(()=>{if(arrange()){observer.disconnect();observer=null;}});observer.observe(document.getElementById('main')||document.body,{childList:true,subtree:true});}}
 ensureLayout();
 addEventListener('message',event=>{
  if(!trustedShell(event))return;
  setLanguage(normalize(event.data.language));
  if(!active){active=true;document.documentElement.classList.add('aq-workshop-shell');const control=document.getElementById('language-switch');if(control)control.hidden=true;ensureLayout();}
  parent.postMessage({type:'rgf-workshop-shell-ready',version:1},event.origin);
 });
 addEventListener('message',event=>{
  if(!active||event.source!==parent||event.origin!==new URL(document.referrer).origin)return;
  const d=event.data;if(d&&Object.keys(d).sort().join(',')==='language,type'&&d.type==='rgf-language'&&normalize(d.language))setLanguage(normalize(d.language));
 });
}
