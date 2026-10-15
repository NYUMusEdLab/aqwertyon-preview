// UI translation only. Never rewrites input values, saved titles, musical data or URLs.
const pairs={
'Replaying melody':'正在重听旋律','Replaying with the video':'正在跟随视频重听',
'The melody sound could not load. Check your connection and try again.':'无法加载旋律音色。请检查网络后重试。',
'The video could not load. Replay the melody alone or try again.':'无法加载视频。可以单独重听旋律，或再试一次。',
'Waiting for the video. Finish any YouTube ad or press Play to begin.':'正在等待视频。请等待 YouTube 广告结束，或点击播放按钮。',
'The video did not start. Press Play in the video or replay the melody alone.':'视频未开始。请点击视频中的播放按钮，或单独重听旋律。',
'Sound could not load. Check your connection or choose another sound.':'无法加载音色。请检查网络，或选择其他音色。','Untitled melody':'未命名旋律','Show or hide video':'显示或隐藏视频',
'Play':'自由演奏','Play with Video':'跟随视频演奏','Play with AI':'与 AI 合奏','Play mode':'演奏模式',
'Melody AI':'旋律 AI','Play a phrase, then pause. A musical partner answers.':'演奏一个乐句，稍作停顿，音乐伙伴就会回应。',
'Who starts?':'谁先开始？','You first':'我先开始','AI first':'AI 先开始','Start AI':'启动 AI','Stop AI':'停止 AI','Reply style':'回应方式',
'Echo':'模仿','Extend':'续奏','Contrast':'对比','Complement':'互补','Harmonize':'和声',
'Repeat your notes, chords and timing exactly.':'按原样重复你的音符、和弦和节奏。',
'Recall the end of your phrase, then continue with new model-generated notes.':'呼应乐句的结尾，再用模型生成的新旋律接着演奏。',
'Answer with an inverted melodic shape and a different rhythmic pace.':'用相反的旋律走向和不同的节奏形成对比。',
'Answer more sparsely, placing notes between the beats of your phrase.':'用更疏朗的音符，在乐句的节拍间作出回应。',
'Replay your phrase with an added consonant voice from the selected scale.':'重奏你的乐句，并从所选音阶中加入协调的和声声部。',
'Selecting AI downloads a 14 MB model and runtime. Your notes stay in this browser.':'选择 AI 模式会下载约 14 MB 的模型和运行程序。你的音符保留在此浏览器中。',
'Loading the melody model…':'正在加载旋律模型……','Your turn. Play two or more notes, then pause.':'轮到你了。演奏两个或更多音符，然后稍作停顿。',
'Your turn. Play a note, or listen for another short phrase.':'轮到你了。可以开始演奏，也可以等待下一个短乐句。',
'Listening to your phrase and making a reply…':'正在根据你的乐句生成回应……','AI’s turn. Play a note whenever you want to take over.':'AI 正在演奏。随时弹一个音符即可接过演奏。',
'Your turn. Pause when your phrase is finished.':'轮到你了。乐句结束后，请稍作停顿。','Model loading. Your notes still work.':'模型正在加载，你仍然可以演奏。',
'Your turn. Play another phrase.':'轮到你了。再演奏一个乐句吧。','AI stopped. Start it when you want another musical conversation.':'AI 已停止。想继续音乐对话时，可以重新启动。',
'AI reply saved separately in your Melody Notebook.':'AI 的回应已单独保存到旋律笔记本。','Settings changed. Play a new phrase.':'设置已更改。请演奏一个新乐句。',
'Keep AI reply':'保存 AI 回应','You · teal':'你 · 青色','AI · amber':'AI · 琥珀色','Inspired by':'灵感来自',
'A.I. Duet by Yotam Mann and Google Creative Lab':'Yotam Mann 与 Google Creative Lab 创作的 A.I. Duet',
'. Uses Magenta MelodyRNN, with rhythm and scale adaptation.': '。采用 Magenta MelodyRNN，并进行节奏与音阶适配。','Credits':'致谢',
'Melody Notebook':'旋律笔记本','Ready for your next melody':'准备好演奏下一段旋律了','Save phrase now':'立即保存乐句','Export melodies':'导出旋律','Import melodies':'导入旋律','Clear all':'全部清空','Undo delete':'撤销删除','Undo clear all':'撤销清空',
'Delete':'删除','Replay melody':'重听旋律','With video':'跟随视频重听','Stop':'停止','Melody name':'旋律名称',
'Capturing your melody…':'正在记录你的旋律……','Melody saved':'旋律已保存','Play a little longer to keep a melody':'再演奏长一些，就可以保存旋律了',
'Loading melody sound…':'正在加载旋律音色……','Saved melodies restored':'已恢复保存的旋律',
'Saved melodies cleared. Undo restores them during this visit.':'已清空保存的旋律。在本次访问期间，可点击“撤销清空”恢复。',
'Saved in this browser · newest 60 melodies · Export for a backup':'保存在此浏览器中 · 保留最新的 60 段旋律 · 可导出备份',
'Browser storage unavailable · kept for this visit only · Export for a backup':'浏览器存储不可用 · 仅在本次访问期间保留 · 请导出备份',
'Captures your played notes and timing, not microphone or video audio. Settings links do not include your melodies.':'记录你演奏的音符与时间，不录制麦克风或视频声音。设置链接不包含你的旋律。',
'Play two or more notes over at least 0.8 seconds. After you release the keys and pause for 2.5 seconds, your melody appears here.':'在至少 0.8 秒内演奏两个或更多音符。松开琴键并停顿 2.5 秒后，旋律就会出现在这里。',
'Current melody piano roll':'当前旋律的钢琴卷帘图','Musical keyboard':'演奏键盘',
'Click or tap a key to play. When this keyboard has focus, use the letter keys to play. Tab moves to the next control.':'点击或触摸琴键即可演奏。此键盘获得焦点后，可使用字母键演奏。按 Tab 移至下一个控件。',
'Live duet: pitch from left to right; notes rise with time. Human notes are teal and AI notes amber.':'实时合奏：音高从左向右排列，音符随时间向上移动。你的音符为青色，AI 的音符为琥珀色。',
'Key labels':'键盘标记','Key Names':'键位名称','Note Names':'音名','Jianpu':'简谱','Sound':'音色','Vol':'音量','Root':'主音','Scale':'音阶','Scale Type':'音阶类型','Scale type':'音阶类型',
'Jianpu: 1 is the selected root; dots above or below mark higher or lower octaves.':'简谱中，1 为所选主音；数字上方或下方的点表示升高或降低八度。',
'Major':'大调','Minor':'小调','Minor Pentatonic':'小调五声音阶','Major Pentatonic':'大调五声音阶','Pentatonic':'五声音阶','Chromatic':'半音阶','Whole Tone':'全音阶','Blues':'布鲁斯','Dorian':'多利亚调式','Mixolydian':'混合利底亚调式',
'Share:':'分享：','Share instrument settings':'分享乐器设置','Select a preset':'选择预设','aQWERTYon · Preview with Melody Notebook':'aQWERTYon · 旋律笔记本预览版',
'YouTube link or video ID':'YouTube 链接或视频 ID','Load video':'加载视频','Return to keyboard':'返回演奏键盘','Open on YouTube ↗':'在 YouTube 中打开 ↗',
'Video selected. Choose Load video to connect to YouTube.':'已选择视频。点击“加载视频”连接 YouTube。','Loading YouTube…':'正在加载 YouTube……','Press Play if the video does not start.':'如果视频未开始，请点击视频中的播放按钮。','Press Play in the video to begin.':'点击视频中的播放按钮开始。','Playing · use the keyboard to play along':'视频播放中 · 可以用键盘一起演奏',
'Enter a valid YouTube link or 11-character video ID.':'请输入有效的 YouTube 链接或 11 位视频 ID。','Invalid video link.':'视频链接无效。','This browser cannot play this video.':'此浏览器无法播放该视频。','This video was removed or is private.':'该视频已被删除或设为私密。','YouTube is refusing embedded playback for this video.':'YouTube 不允许嵌入播放该视频。','YouTube could not identify this page. Open this preview directly in your browser.':'YouTube 无法识别此页面。请在浏览器中直接打开此预览。','YouTube could not play this video.':'YouTube 无法播放该视频。','Try another video or open it on YouTube.':'请尝试其他视频，或在 YouTube 中打开。',
'YouTube did not respond. Check your connection and try Load video again.':'YouTube 未响应。请检查网络，再次点击“加载视频”。','YouTube could not load. You can still play the instrument.':'无法加载 YouTube，你仍然可以演奏。','YouTube player did not become ready. Check your connection or open the video on YouTube.':'YouTube 播放器未就绪。请检查网络，或在 YouTube 中打开视频。',
'The AI took too long. Stop and start it to try again.':'AI 响应超时。请停止后重新启动。','The AI could not load. Check your connection and try again.':'无法加载 AI。请检查网络后重试。','The melody model could not run.':'旋律模型无法运行。','The model returned silence. Play another phrase to try again.':'模型未生成音符。请演奏另一个乐句重试。','Choose a keyboard layout with playable notes.':'请选择包含可演奏音符的键盘布局。','Play a phrase, then pause.':'请演奏一个乐句，然后稍作停顿。',
'Choose a JSON file smaller than 5 MB.':'请选择小于 5 MB 的 JSON 文件。','Use a melody JSON file smaller than 5 MB.':'请使用小于 5 MB 的旋律 JSON 文件。','Choose an aQWERTYon melody export.':'请选择 aQWERTYon 导出的旋律文件。','Too many melodies in this file.':'此文件中的旋律数量过多。','Invalid piano take':'旋律数据无效','not a takes file':'这不是旋律文件'
};
let language='en';try{language=localStorage.getItem('aqwertyon.language')==='zh-CN'?'zh-CN':'en';}catch(_){}
const originals=new WeakMap(),attrs=new WeakMap();
function translate(text){
 const trimmed=text.trim();if(pairs[trimmed])return text.replace(trimmed,pairs[trimmed]);
 if(trimmed.startsWith('AI reply · '))return text.replace('AI reply · ','AI 回应 · ');
 if(/^\d+ melodies imported$/.test(trimmed))return trimmed.replace(/(\d+) melodies imported/,'已导入 $1 段旋律');
 if(/ ready$/.test(trimmed))return trimmed.replace(/ ready$/,' 已就绪');
 if(/^Loading .*…$/.test(trimmed))return trimmed.replace(/^Loading (.*)…$/,'正在加载 $1……');
 if(trimmed.includes(' Try another video or open it on YouTube.'))return trimmed.split(' Try another video or open it on YouTube.').map(t=>translate(t)).join(' 请尝试其他视频，或在 YouTube 中打开。');
 return text;
}
function apply(){
 observer.disconnect();document.documentElement.lang=language;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement?.closest('script,style,textarea,input,[contenteditable],#language-switch,#keyboardContainer,.app-preset-link'))continue;
  const old=originals.get(node),source=old&&node.nodeValue===old.shown?old.source:node.nodeValue,shown=language==='zh-CN'?translate(source):source;
  originals.set(node,{source,shown});if(node.nodeValue!==shown)node.nodeValue=shown;
 }
 document.querySelectorAll('[aria-label],[aria-description],[placeholder],[title]').forEach(el=>{
  if(el.closest('#language-switch'))return;const old=attrs.get(el)||{};
  for(const a of ['aria-label','aria-description','placeholder','title']){if(!el.hasAttribute(a))continue;const value=el.getAttribute(a),source=old[a]&&value===old[a].shown?old[a].source:value,shown=language==='zh-CN'?translate(source):source;old[a]={source,shown};if(value!==shown)el.setAttribute(a,shown);}attrs.set(el,old);
 });
 document.querySelectorAll('#language-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-description','placeholder','title']});
}
let queued=false;const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;apply();});}});
const control=document.createElement('div');control.id='language-switch';control.setAttribute('role','group');control.setAttribute('aria-label','Language / 语言');control.innerHTML='<button type="button" data-language="en">English</button><button type="button" data-language="zh-CN">简体中文</button>';
document.querySelector('header').append(control);
control.addEventListener('click',e=>{const value=e.target.dataset.language;if(!value)return;language=value;try{localStorage.setItem('aqwertyon.language',value);}catch(_){}apply();document.dispatchEvent(new CustomEvent('aq:language',{detail:{language}}));});
apply();
