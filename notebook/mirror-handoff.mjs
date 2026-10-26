import {digitalPerformance} from './digital-performance.mjs';
const target='https://ruthmann.github.io/rengongfu-sandbox/workbench/tools/singing-capture/digital.html';
export function openPerformanceMirror(take,status){
 let payload;try{payload=digitalPerformance(take);}catch(e){status(e.message);return;}
 const nonce=crypto.randomUUID(),url=new URL(target);url.searchParams.set('import','aqwertyon');url.searchParams.set('lang',document.documentElement.lang.startsWith('zh')?'zh':'en');url.hash=nonce;
 let sent=false,child,timer;
 const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);};
 function receive(e){if(e.source!==child||e.origin!==url.origin||e.data?.nonce!==nonce||e.data?.version!==1)return;
  if(e.data.type==='musedlab-mirror-ready'&&!sent){sent=true;child.postMessage({type:'musedlab-mirror-import',version:1,nonce,performance:payload},url.origin);}
  if(e.data.type==='musedlab-mirror-saved'){cleanup();status('Opened in Performance Mirror. Your original remains here.');}
  if(e.data.type==='musedlab-mirror-error'){cleanup();status('Performance Mirror could not save this take. Your original remains here.');}
 }
 window.addEventListener('message',receive);child=window.open(url.href,'_blank');
 if(!child){cleanup();status('Allow a new tab to open Performance Mirror, then try again.');return;}
 status('Opening Performance Mirror…');timer=setTimeout(()=>{cleanup();status('Performance Mirror did not confirm import. Your original remains here; try again.');},45000);
}
