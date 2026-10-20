import {EVENTS,SOURCES,initialState,applyChoice,ending,ROUTES,selectRoute,PACK_ITEMS,PACK_LIMIT,packState,availableChoice,resolveEvent,chapterEpilogues,chapterEnding,isMilitaryState,militaryCode,militaryTask,militaryDepartureReady,militaryArrivalReady,militaryEnding,militaryEpilogues,restoreSavedState} from './content.js';
const $=s=>document.querySelector(s),canvas=$('#world'),ctx=canvas.getContext('2d'),dialog=$('#dialog'),storage='together-safe-v2';
let state=initialState(),path=[],keys=new Set(),last=0,active=false,autoTarget=null,nearest=null,toastTimer;
let viewZoom=1,translationLanguage='zh-TW';
try{translationLanguage=localStorage.getItem('together-safe-language')||'zh-TW';}catch{}
const isMilitaryChapter=()=>isMilitaryState(state);
const isInteractiveChapter=()=>isChapter()||isMilitaryChapter();
const isChapter=()=>state.route==='quake'&&state.chapter?.revision===1;
const prep=['bag','pantry','family','phone','neighbor'];
const inventory={bag:'🎒 必要用品避難包',stock:'🥫 居家循環儲備',plan:'📝 家庭聯絡與集合約定',verified:'🔎 訊息查證習慣',neighbor:'🤝 鄰里互助安排',light:'🔦 照明與備援資訊',stairs:'↘ 安全樓梯',comfort:'♡ 陪伴家人的方法',packedLight:'✦ 背包裡的手電筒',houseLight:'✦ 家中備用手電筒',packedMedicine:'✚ 阿嬤的照護用品',packedPapers:'▧ 證件與紙本聯絡卡',packedRadio:'▣ 可攜式收音機',packedToy:'♡ 小晴的小熊',familyLocated:'⌂ 爸爸的下落已確認',mVerified:'🔎 已查證來源',mBroadcastKnown:'▣ 所在地指引已確認',mAirCleared:'⌂ 防空解除與後續安排',mPrivacyGuard:'◇ 不公開軍事動態'};
function save(){try{localStorage.setItem(storage,JSON.stringify(state));}catch{}}
function toast(message){$('#toast').textContent=message;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,2600);}
function open(html){keys.clear();path=[];autoTarget=null;nearest=null;$('#dialog-content').innerHTML=html;updateTranslationLink();if(!dialog.open)dialog.showModal();const b=dialog.querySelector('button');b?.focus();}
function close(){dialog.close();canvas.focus({preventScroll:true});}
function bind(selector,fn){dialog.querySelector(selector)?.addEventListener('click',fn);}
function updateTranslationLink(){
 const select=$('#language-select'),link=$('#translate-scene');
 if(!select||!link)return;
 select.value=translationLanguage;
 link.hidden=translationLanguage==='zh-TW';
 const text=$('#dialog-content').innerHTML.replace(/<[^>]+>/g,' ').replace(/&(?:amp|lt|gt|quot);/g,' ').replace(/\s+/g,' ').trim();
 const target=translationLanguage==='other'?'en':translationLanguage;
 link.href=`https://translate.google.com/?sl=zh-TW&tl=${encodeURIComponent(target)}&text=${encodeURIComponent(text)}&op=translate`;
 link.textContent=translationLanguage==='other'?'Google Translate · choose a language ↗':'Google Translate · read this scene ↗';
}
$('#language-select').onchange=()=>{translationLanguage=$('#language-select').value;try{localStorage.setItem('together-safe-language',translationLanguage);}catch{}updateTranslationLink();};
$('#language-help').onclick=()=>{open(`<span class="pill">Language / 語言</span><h2 id="dialog-title">用熟悉的語言，讀懂這一步。</h2><p>遊戲原文為繁體中文。在每個對話上方選擇 English、日本語或其他語言，再點 Google Translate 連結，可在新分頁翻譯目前情境與選項。讀完後回到原分頁繼續選擇。</p><p>Select a language above, then open Google Translate to read the current scene and choices in a new tab. Return to this tab to play. For more languages, choose “Other languages” and change the target language on Google Translate.</p><p class="source">翻譯需連網並由 Google 提供，並非人工審訂的安全指引。只有主動開啟連結才會傳送本段文字；不傳送存檔。離線版可用繁中原文遊玩。Canvas 地圖標籤不會自動翻譯。</p><button class="primary" id="close">返回遊戲 / Back</button>`);bind('#close',close);};
function camera(){
 const zoom=viewZoom,x=Math.min(0,Math.max(canvas.width-960*zoom,canvas.width/2-state.x*zoom)),y=canvas.height>=600*zoom?(canvas.height-600*zoom)/2:Math.min(0,Math.max(canvas.height-600*zoom,canvas.height/2-state.y*zoom));
 return {zoom,x,y};
}
function resizeWorld(){
 const mobile=window.matchMedia?.('(max-width:720px)').matches;
 canvas.height=mobile?960:600;
 viewZoom=mobile?1.8:1;
 $('#camera-toggle').textContent=mobile?'地圖總覽':'放大地圖';
}
$('#camera-toggle').onclick=()=>{viewZoom=viewZoom===1?1.8:1;$('#camera-toggle').textContent=viewZoom===1?'放大地圖':'地圖總覽';};
window.addEventListener('resize',resizeWorld);resizeWorld();
function welcome(){open(`<span class="pill">一場可以重新開始的練習</span><h2 id="dialog-title">今天，會遇見什麼呢？</h2><p>在家中與街區自由移動，靠近發光標記互動。每局隨機安排一個主要危機，搭配兩個日常支線；也可以指定情境練習。地震與軍事章節加入物件操作、家庭分支與後日談。</p><div class="summary">電腦：方向鍵 / WASD 移動，E 或空白鍵互動。<br>手機：點地面行走、點標記互動，或使用下方方向鍵。<br>沒有操作倒數，隨時停下來想一想。</div><div class="choices"><button class="primary" data-route="quake">✦ 地震示範章節 · 燈熄了，約定還亮著</button><button class="primary" id="military-routes">◇ 軍事章節 · 斷訊之後，仍有彼此</button><button class="choice" data-route="random">✳ 隨機開始今天的故事</button></div><details class="route-picker"><summary>指定情境練習 · 6 種路線</summary><div class="choices">${Object.entries(ROUTES).map(([id,r])=>`<button class="choice" data-route="${id}">${r.icon} ${r.name}<br><small>${r.desc}</small></button>`).join('')}</div></details><p class="source">純屬教育演練，非即時災情。地圖為虛構；實際行動依所在地警報與現場指示。</p>`);dialog.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{state=initialState(b.dataset.route==='random'?selectRoute():b.dataset.route);active=true;close();update();save();});bind('#military-routes',militaryPicker);}
function route(){return ROUTES[state.route];}
function update(){updateFamilyStatus();$('#interact').innerHTML=isMilitaryChapter()&&['bunker','cover'].includes(state.stage)?'確認目前情境 <kbd>E</kbd>':'與附近物件互動 <kbd>E</kbd>';const street=state.stage==='street',final=state.stage==='shelter',r=route();$('#chapter').textContent=state.stage==='bunker'?'02 / 防空警報中':state.stage==='cover'?'02 / 暫時掩蔽':state.ended?'03 / 今天的回顧':final?'03 / 安頓與陪伴':street?'02 / 依指引避難':state.stage==='prepare'?'01 / 平時的小小準備':'02 / 危機來臨時';$('#route-label').textContent=state.stage==='prepare'?'今天的故事尚未揭曉':r.name+(isMilitaryChapter()?` · ${militaryCode(state)}`:'');$('#readiness').textContent=state.ready;$('#ready-bar').value=state.ready;$('#care').textContent=state.care;$('#care-bar').value=state.care;$('#inventory').innerHTML=Object.entries(inventory).filter(([f])=>state.flags.includes(f)).map(([,label])=>`<li>${label}</li>`).join('')||'<li class="muted">先從一件小事開始。</li>';$('#journal').innerHTML=state.history.slice(-5).map(h=>`<li>${EVENTS[h.id].title}</li>`).join('')||'<li class="muted">走近發光的物件，開始互動。</li>';$('#map-tag').textContent=state.stage==='bunker'?'社區防空空間 · 警報尚未解除':state.stage==='cover'?'安全掩蔽處 · 等待可信通行指引':isMilitaryChapter()&&final&&state.chapter.scenario==='stay'?'家中安全處 · 持續確認更新':street?'青禾里 · 虛構練習街區':final?r.place:'我們的家 · 平時準備';$('#mission').textContent=isMilitaryChapter()?militaryTask(state).label:isChapter()?chapterMission():state.ended?'今天的練習完成了。把一件準備帶回生活。':final?'和家人說說話，再用手機報平安。':street?`依此次指示，前往「${r.place}」。`:state.stage==='prepare'?`探索 5 個準備點（${prep.filter(id=>state.done.includes(id)).length}/5），也可查看本局支線，完成後到玄關出發。`:state.route==='air'?'走到樓梯口，確認避難路線。':state.done.includes('power')?'走到玄關，依指示準備撤離。':'先走到收音機旁，了解斷電斷訊後的下一步。';}
function event(id,next){if(state.done.includes(id)){toast('這件事已記錄在行動簿裡。');return;}if(isInteractiveChapter()&&id==='bag'&&!state.done.includes('bag')){openPack();return;}const e=resolveEvent(state,id);if(id==='power'&&state.route==='military'){e.title='網路斷斷續續';e.text='你暫時在遠離門窗的安全處，手機網路不穩。如何取得下一步可靠資訊？';}if(id==='shelter'&&state.route==='military'){e.title='走進社區救濟站';e.text='這次劇情中的住家已不宜停留。現場人員確認路線安全後，引導你到政府開設的救濟站。';}if(id==='child'&&!route().street)e.text=e.text.replace('本次安排的避難地點','家中安全處');if(id==='child')e.text+=state.flags.includes('bag')?' 你拿出事先準備的必要用品，讓家人先安頓下來。':' 你發現必要用品還不齊，先向現場人員或可信管道確認可用協助。';open(`<span class="pill">${state.stage==='prepare'?'平時準備':'情境選擇'}</span><h2 id="dialog-title">${e.title}</h2><p>${e.text}</p><div class="choices">${e.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${availableChoice(state,c)?'':'disabled aria-disabled="true"'}>${String.fromCharCode(65+i)}. ${c.text}${availableChoice(state,c)?'':'<small class="locked-note">需要先準備或取得對應物品</small>'}</button>`).join('')}</div>`);dialog.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const index=Number(b.dataset.choice),choice=e.choices[index];if(!availableChoice(state,choice))return;state=applyChoice(state,id,index);save();update();const source=SOURCES[e.source];open(`<span class="pill">這一步，帶回生活</span><h2 id="dialog-title">${choice.risk?'多練習一次，就多一份把握。':'你為平安，多做了一步。'}</h2><p>${choice.result}</p><p class="source">知識依據：<a href="${source.url}" target="_blank" rel="noopener">${source.title} ↗</a><br>本情節及分數為原創教學設計，並非官方風險評估。</p><button id="continue" class="primary">繼續今天的故事 →</button>`);bind('#continue',()=>{close();next?.();update();save();});});}
function updateFamilyStatus(){
 const node=$('#family-status');if(!node)return;
 if(!isInteractiveChapter()){node.textContent='留意家人需求，依當次情境一起行動。';return;}
 node.innerHTML=`<b>小晴</b> ${state.flags.includes('comfort')?'有人聽她說話':state.flags.includes('childRole')?'一起記住約定與標示':'想知道自己能幫什麼忙'}<br><b>阿嬤</b> ${state.flags.includes('careSettled')?'照護需求已確認':'需要確認個人用品'}<br><b>爸爸</b> ${state.flags.includes('familyLocated')?(isMilitaryChapter()?(state.chapter.scenario==='stay'?'已確認在里辦公處安全停留':'已確認在救濟站'):'已確認在收容處'):state.stage==='prepare'?'出門到里辦公處辦事':'暫時聯絡不上，別分頭冒險尋找'}`;
}
function chapterMission(){
 if(state.ended)return '今天的練習完成了。看看每個人帶走了什麼。';
 if(state.stage==='prepare')return `平時準備 ${prep.filter(id=>state.done.includes(id)).length}/5 · 親手裝背包、和家人約定，再到玄關開始。`;
 if(state.stage==='crisis'){
  if(!state.done.includes('power'))return '搖晃已停止 · 走近照明處。沒帶手電筒，也可查看玄關備用櫃。';
  if(!state.done.includes('qFamily'))return '先確認小晴與阿嬤的狀況，聽聽她們需要什麼。';
  if(!state.done.includes('qBroadcast'))return '操作收音機：開電源、選擇演練防災廣播，記下現場指引。';
  return '照明、家人與指引都已確認 · 到玄關依安全路線撤離。';
 }
 if(state.stage==='street'){
  if(!state.done.includes('debris'))return '查看封鎖巷道旁的安全步道指示，確認可通行路線。';
  if(!state.done.includes('qMeetPlan')&&!state.done.includes('qLostContact'))return '走到家庭聯絡點，試著確認爸爸的下落。';
  if(!state.flags.includes('familyLocated'))return '沒有事先約定也別分頭找人 · 到聯絡協助站詢問。';
  return '爸爸已在收容處 · 依安全步道前往，也可留意林阿姨。';
 }
 if(!state.done.includes('qSupplies'))return '先到照護登記處，確認阿嬤的個人用品與需求。';
 if(!state.done.includes('child'))return '留一點時間給小晴，聽她說說今天的感受。';
 if(!state.done.includes('contact'))return '家人已安頓 · 用手機簡短報平安。';
 return '坐下來完成家庭小結，看看這一天留下了什麼。';
}
function openPack(){
 const draft=state.chapter.packDraft;
 open(`<span class="pill">物件互動 · 整理背包</span><h2 id="dialog-title">這一次，你想帶上什麼？</h2><p>點物品裝入或取出。小晴把小熊放在旁邊，阿嬤提醒你別忘了個人用品。</p><div class="pack-count">背包 ${draft.length}/${PACK_LIMIT} 格 <small>格數僅為遊戲取捨，不是現實重量或完整清單</small></div><div class="pack-grid">${PACK_ITEMS.map(item=>`<button class="pack-item ${draft.includes(item.id)?'selected':''}" data-item="${item.id}" aria-pressed="${draft.includes(item.id)}"><span>${item.icon}</span><b>${item.name}</b><small>${item.note}</small></button>`).join('')}</div><p class="source">知識依據：<a href="${SOURCES.prepare.url}" target="_blank" rel="noopener">緊急避難包準備 ↗</a>。此互動為簡化模型，實際用品依需求與負重能力準備。</p><div class="dialog-actions"><button class="primary" id="pack-confirm">裝好，帶著這份準備 →</button><button class="choice" id="pack-back">先放著，繼續探索</button></div>`);
 dialog.querySelectorAll('[data-item]').forEach(button=>button.onclick=()=>{
  const id=button.dataset.item,index=draft.indexOf(id);
  if(index>=0)draft.splice(index,1);else if(draft.length<PACK_LIMIT)draft.push(id);else{toast('背包滿了。先取出一件，再放入想帶的物品。');return;}
  save();openPack();
 });
 bind('#pack-back',()=>{close();save();});
 bind('#pack-confirm',()=>{state=packState(state,draft);save();update();open(`<span class="pill">準備留下了後續</span><h2 id="dialog-title">背包先整理到這裡。</h2><p>${state.chapter.pack.length?state.chapter.pack.map(id=>PACK_ITEMS.find(item=>item.id===id).name).join('、'):'這次先不裝物品。'}</p><p>帶上的物品會在後續照明、備援資訊、個人用品與安頓家人的情境中派上用場。物品不是愈多愈好，平時仍可依實際需求調整。</p><button class="primary" id="continue">回到家裡 →</button>`);bind('#continue',close);});
}
function openRadio(){
 if(!state.done.includes(isMilitaryChapter()?'mFamily':'qFamily')){toast('先到家人身邊，確認小晴與阿嬤的狀況。');return;}if(isMilitaryChapter()&&!state.done.includes('mSignal')){toast('先判讀群組消息，再選擇可靠的備援資訊。');return;}
 const device=state.chapter,powered=device.radioPower,tuned=device.radioBand==='emergency',broadcast=isMilitaryChapter()?'mBroadcast':'qBroadcast',message=isMilitaryChapter()?(device.scenario==='stay'?'【演練訊息】所在地住家仍可安全停留，沒有撤離指示；仍應留意後續更新。':'【演練訊息】此處住家不宜停留，現場已確認指定撤離路線；若收到防空警報，先就近避難。'):'【演練訊息】現場人員已確認撤離安排，請記下收容處與可通行的指定路線。';
 open(`<span class="pill">物件互動 · ${state.flags.includes('packedRadio')?'背包裡的收音機':'家中的備用收音機'}</span><h2 id="dialog-title">留一條備援資訊的路。</h2><div class="radio-panel"><span class="radio-led ${powered?'on':''}"></span><strong>${!powered?'電源關閉':tuned?'演練防災廣播':'音樂頻道'}</strong><p>${!powered?'先打開電源。':tuned?message:'傳來輕快的音樂，還沒有本次情境的應變指引。'}</p></div><div class="choices"><button class="choice" id="radio-power">${powered?'關閉':'打開'}電源</button><button class="choice" id="radio-emergency" ${powered?'':'disabled'}>選擇：地方防災廣播（演練）</button><button class="choice" id="radio-music" ${powered?'':'disabled'}>選擇：音樂頻道</button></div><div class="dialog-actions">${powered&&tuned&&!state.done.includes(broadcast)?'<button class="primary" id="radio-listen">記下現場指引 →</button>':''}<button class="choice" id="radio-back">回到房間</button></div><p class="source">此為簡化的演練介面，非實際頻率或即時廣播。<a href="${SOURCES.stock.url}" target="_blank" rel="noopener">備援資訊與物資準備 ↗</a></p>`);
 bind('#radio-power',()=>{device.radioPower=!powered;save();openRadio();});
 bind('#radio-emergency',()=>{if(!device.radioPower)return;device.radioBand='emergency';save();openRadio();});
 bind('#radio-music',()=>{if(!device.radioPower)return;device.radioBand='music';save();openRadio();});
 bind('#radio-back',close);bind('#radio-listen',()=>{close();event(broadcast);});
}
function chapterSpots(){
 const point=(id,x,y,label,icon,action=()=>event(id))=>({id,x,y,label,icon,action});
 if(state.stage==='crisis')return [
  point('qCabinet',140,290,'玄關備用櫃','▥'),
  point('power',730,300,'打開照明','✦'),
  point('qFamily',510,390,'小晴與阿嬤','♡'),
  point('qRadio',770,210,'操作收音機','▣',openRadio),
  point('door',450,500,'依指引撤離','→',depart)
 ];
 if(state.stage==='street')return [
  point('debris',440,310,'安全步道指示','⚠'),
  point('qMeet',340,420,'家庭聯絡點','▧',()=>event(state.flags.includes('plan')?'qMeetPlan':'qLostContact')),
  ...(!state.flags.includes('plan')&&state.done.includes('qLostContact')?[point('qMeetHelp',190,420,'聯絡協助站','⌂')]:[]),
  ...(state.flags.includes('neighbor')?[point('qNeighbor',580,420,'林阿姨','♡')]:[]),
  point('shelter',740,420,'社區收容處','⌂',()=>arrive('shelter'))
 ];
 return [
  point('qSupplies',700,300,'照護登記處','✚'),
  point('child',280,300,'和小晴說說話','♡',()=>{if(!state.done.includes('qSupplies')){toast('先確認阿嬤的用品與照護安排。');return;}event('child');}),
  point('contact',700,390,'簡短報平安','▤',()=>{if(!state.done.includes('child')){toast('先留時間聽小晴說說話。');return;}event('contact');}),
  point('qNight',480,180,'家庭小結','☀',()=>{if(!state.done.includes('contact')){toast('先安頓家人、報平安，再一起回顧。');return;}event('qNight',finish);})
 ];
}
function militaryPicker(){
 open(`<span class="pill">軍事章節 · 路線練習</span><h2 id="dialog-title">斷訊之後，仍有彼此。</h2><p>依所在地安排決定留或走。撤離路線可能遇到疑似軍事活動；有通道時遠離，無法離開時先掩蔽。所有地點、警報與通行指示都是演練劇情。</p><div class="choices"><button class="primary" data-scenario="random">隨機開始</button><button class="choice" data-scenario="stay">安全住家 · 持續確認資訊</button><button class="choice" data-scenario="stay-alert">安全住家 · 途中收到防空警報</button><button class="choice" data-scenario="relocate">依指引撤離 · 可安全避開街口</button><button class="choice" data-scenario="relocate-cover">依指引撤離 · 暫時無法通行</button><button class="choice" data-scenario="relocate-alert-clear">依指引撤離 · 防空警報與可通行步道</button><button class="choice" data-scenario="relocate-alert">依指引撤離 · 防空警報與暫時掩蔽</button></div>`);
 dialog.querySelectorAll('[data-scenario]').forEach(button=>button.onclick=()=>{
  state=initialState('military');const variant=button.dataset.scenario;
  if(variant!=='random'){state.chapter.scenario=variant.startsWith('stay')?'stay':'relocate';state.chapter.airAlert=variant.includes('alert');state.chapter.encounter=variant.includes('cover')||variant==='relocate-alert'?'blocked':'clear';}
  active=true;close();update();save();
 });
}
function militaryEvent(id,next){
 const task=militaryTask(state).id;
 const aliases={mBroadcast:'mRadio',mLinkPlan:'mLink',mLinkRequest:'mLink',mDecision:'door'};
 if((aliases[id]||id)!==task){toast(militaryTask(state).label);return;}
 event(id,next);
}
function enterMilitaryBunker(){state.stage='bunker';state.x=460;state.y=420;update();save();}
function leaveMilitaryBunker(){state.stage='crisis';state.x=480;state.y=200;update();save();}
function afterMilitaryDecision(){if(state.chapter.scenario==='stay')settle();else toStreet();}
function afterMilitaryEncounter(){
 if(state.chapter.encounter==='blocked'&&!state.done.includes('mCoverWait')){state.stage='cover';state.x=460;state.y=420;update();save();}
 else {update();save();}
}
function resumeMilitaryStreet(){
 if(!state.done.includes('mEncounter')){event('mEncounter',afterMilitaryEncounter);return;}
 afterMilitaryEncounter();
}
function militaryDecide(){
 if(state.stage!=='crisis'){toast(militaryTask(state).label);return;}
 if(militaryTask(state).id==='mAlert'){event('mAlert',enterMilitaryBunker);return;}
 if(!militaryDepartureReady(state)){toast(militaryTask(state).label);return;}
 militaryEvent('mDecision',afterMilitaryDecision);
}
function militarySpots(){
 const point=(id,x,y,label,icon,action=()=>militaryEvent(id))=>({id,x,y,label,icon,action});
 if(state.stage==='crisis')return [
  point('mFamily',510,390,'確認家人','♡'),
  point('mSignal',730,300,'判讀群組消息','…'),
  point('mRadio',770,210,'操作收音機','▣',openRadio),
  ...(state.chapter.airAlert&&!state.done.includes('mClearance')?[point('mAlert',550,480,'防空警報指引','⌂',()=>militaryEvent('mAlert',enterMilitaryBunker))]:[]),
  point('door',360,480,'確認留或走','→',militaryDecide)
 ];
 if(state.stage==='bunker')return [
  point('mPosition',280,300,'防空避難姿勢','⌂'),
  point('mWait',700,300,'等候可靠解除','…'),
  point('mClearance',480,180,'解除與後續安排','▣',()=>militaryEvent('mClearance',leaveMilitaryBunker))
 ];
 if(state.stage==='cover')return [point('mCoverWait',700,300,'確認通行指引','▣',()=>militaryEvent('mCoverWait',toStreet))];
 if(state.stage==='street')return [
  point('mEncounter',340,270,'留意街口活動','◇',()=>militaryEvent('mEncounter',afterMilitaryEncounter)),
  point('mRoute',440,310,'確認安全步道','⚠'),
  point('mLink',340,420,'家庭聯絡點','▧',()=>militaryEvent(state.flags.includes('plan')?'mLinkPlan':'mLinkRequest')),
  ...(state.done.includes('mLinkRequest')?[point('mLinkHelp',190,420,'聯絡協助站','⌂')]:[]),
  point('mRelief',740,420,'社區救濟站','⌂',()=>arrive('shelter'))
 ];
 return [
  point('mSupplies',700,300,state.chapter.scenario==='stay'?'生活與照護用品':'物資與照護登記','✚'),
  point('child',280,300,'聽小晴說說話','♡'),
  point('mContact',770,390,'簡短報平安','▤'),
  point('mNight',480,180,'家庭小結','☀',()=>militaryEvent('mNight',finish))
 ];
}
function restoreMilitaryTransition(){
 if(state.ended||state.done.includes('mNight')){finish();return;}
 if(state.stage==='prepare')return;
 if(!state.done.includes('military')){startCrisis();return;}
 if(state.done.includes('mContact')){event('mNight',finish);return;}
 if(state.stage==='bunker'){
  if(state.done.includes('mClearance'))leaveMilitaryBunker();
  return;
 }
 if(state.stage==='cover'){
  if(state.done.includes('mCoverWait'))toStreet();
  return;
 }
 if(state.stage==='crisis'){
  if(state.chapter.airAlert&&state.done.includes('mAlert')&&!state.done.includes('mClearance')){enterMilitaryBunker();return;}
  if(state.done.includes('mDecision'))afterMilitaryDecision();
  return;
 }
 if(state.stage==='street'){
  if(state.done.includes('mRelief'))settle();else resumeMilitaryStreet();
 }
}
function toStreet(){state.stage='street';state.x=100;state.y=330;update();save();toast('點地面行走，靠近入口標記互動。');if(isMilitaryChapter())resumeMilitaryStreet();}
function settle(){state.stage='shelter';state.x=460;state.y=420;update();save();if(isMilitaryChapter()){toast(state.chapter.scenario==='stay'?'依這次安排留在安全住家，確認生活與照護需求。':'已到達救濟站，依序確認安置與照護需求。');return;}if(state.flags.includes('plan'))toast('你們按照先前的約定，確認家人都已安頓。');else toast('你們先確認彼此狀況，也把聯絡備案記進待辦。');}
function afterEntry(){if(isMilitaryChapter()){state.x=480;state.y=200;update();save();return;}if(!route().street){settle();return;}if(state.route==='tsunami'){toStreet();return;}state.x=800;state.y=365;update();save();}
function startCrisis(){state.stage='crisis';save();event(route().entry,afterEntry);}
function depart(){if(state.stage==='prepare'){if(prep.some(id=>!state.done.includes(id))){open(`<span class="pill">準備好了嗎？</span><h2 id="dialog-title">還有幾件小事可以做。</h2><p>你可以繼續探索，或帶著目前的準備開始演練。少做的準備會反映在最後回顧。</p><div class="choices"><button class="choice" id="back">繼續在家探索</button><button class="choice" id="go">以目前的準備出發 →</button></div>`);bind('#back',close);bind('#go',()=>{close();startCrisis();});}else startCrisis();return;}if(isMilitaryChapter()){militaryDecide();return;}if(isChapter()){if(!state.done.includes('power')){toast('先到照明處，確認腳下與周圍。');return;}if(!state.done.includes('qFamily')){toast('先和小晴、阿嬤確認狀況，再安排下一步。');return;}if(!state.done.includes('qBroadcast')){toast('先操作收音機，確認這次撤離的指引。');return;}event('exit',toStreet);return;}if(state.route==='air')event('elevator',toStreet);else if(!state.done.includes('power'))toast('先確認停電後的資訊與照明，再來玄關。');else event('exit',toStreet);}
function arrive(kind){if(isMilitaryChapter()){if(kind!=='shelter'||!militaryArrivalReady(state)){toast(militaryTask(state).label);return;}event('mRelief',settle);return;}if(isChapter()&&kind==='shelter'){if(!state.done.includes('debris')){toast('先查看封鎖巷道旁的安全步道指示。');return;}if(!state.flags.includes('familyLocated')){toast('先到聯絡點確認爸爸的下落，讓家人一起安頓。');return;}}const right=route().destination;if(kind!==right){if(state.route==='tsunami')toast('海嘯避難要遠離海岸、往高處。這裡不是本次指定的高處平台。');else if(state.route==='air')toast('本次防空警報尚未解除，請前往有標示的地下防空避難空間。');else toast('這裡不是本次開設的收容／救濟地點。請依任務指示前往。');return;}if(!state.done.includes('rumor')){event('rumor',()=>arrive(kind));return;}event(kind,settle);}
function finish(){state.ended=true;save();update();const e=isMilitaryChapter()?militaryEnding(state):isChapter()?chapterEnding(state):ending(state);open(`<div class="result-icon">${e.icon}</div><span class="pill">${route().name}${isMilitaryChapter()?` · ${militaryCode(state)}`:''} · 今日結局</span><h2 id="dialog-title">${e.title}</h2><p>${e.text}</p><div class="summary">準備程度 ${state.ready}/100 · 安心與互助 ${state.care}/100<br>你完成了 ${state.done.length} 個情境。分數僅供遊戲回饋，不代表真實安全程度。<br><b>下一步：</b>${!state.flags.includes('bag')?'今天和家人一起檢查避難包。':!state.flags.includes('plan')?'今天和家人約定聯絡方式與集合備案。':'今天和家人確認住家附近的實際避難設施與路線。'}</div>${isInteractiveChapter()?`<section class="epilogues" aria-label="每個人的後日談">${(isMilitaryChapter()?militaryEpilogues(state):chapterEpilogues(state)).map(item=>`<article><h3>${item.who}</h3><p>${item.text}</p></article>`).join('')}</section>`:''}<div class="dialog-actions"><button id="review" class="primary">回顧我的選擇</button><button id="share" class="choice">複製結局文字</button><button id="again" class="choice">再走另一條路線 →</button></div>`);bind('#review',review);bind('#again',welcome);bind('#share',async()=>{const text=`《今天，也要一起平安》${e.title}｜${route().name}${isMilitaryChapter()?` (${militaryCode(state)})`:''}：完成 ${state.done.length} 個情境。一起把準備帶回生活！ ${location.href}`;try{await navigator.clipboard.writeText(text);toast('已複製，可以分享給家人。');}catch{open(`<h2 id="dialog-title">分享今天的結局</h2><p>${text.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p><button class="primary" id="close">返回地圖</button>`);bind('#close',close);}});}
function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#39;');}
function review(){open(`<span class="pill">平安行動簿</span><h2 id="dialog-title">每一步，都留下學習。</h2>${state.history.length?state.history.map(h=>{const e=resolveEvent(state,h.id),c=e.choices[h.index];return `<details><summary>${c.risk?'○':'✓'} ${escapeHtml(h.label||e.title)}</summary><p>你選擇：${escapeHtml(h.decision||c.text)}</p><p>${escapeHtml(h.outcome||c.result)}</p><p class="source"><a href="${SOURCES[e.source].url}" target="_blank" rel="noopener">查看知識依據 ↗</a></p></details>`;}).join(''):'<p>走近物件、做出選擇後，這裡會記錄你的學習。</p>'}<div class="dialog-actions"><button class="primary" id="close">返回地圖</button>${state.ended?'<button class="choice" id="end">查看結局</button>':''}</div>`);bind('#close',close);bind('#end',finish);}
function help(){open(`<span class="pill">關於這場練習</span><h2 id="dialog-title">把準備，變成一段故事。</h2><p>方向鍵 / WASD 移動，E 或空白鍵互動。也可以點地面自動行走，或點標記走近互動。觸控方向鍵可長按；沒有操作倒數。</p><p>六種主情境：地震、防空、海嘯、颱風、軍事侵略與資安。每局隨機選一個，搭配兩個日常支線。地震與軍事章節各有五種主要結局與後日談，其餘路線保留四種練習結局。遊戲會在此瀏覽器自動存檔。</p><p>知識依據為國防部全民防衛動員署「臺灣全民安全指引」官網。情節、地圖、美術與計分為獨立原創；非官方產品，亦不提供即時警報或真實導航。實際災害請依官方警報與現場指示。</p><p class="source">資料查核：2026-10-20。官網資料依其政府資料開放授權宣告利用；未使用手冊插圖或官方標誌。<br><a href="https://prepare.mnd.gov.tw/" target="_blank" rel="noopener">官方安全指引</a> · <a href="https://prepare.mnd.gov.tw/policies" target="_blank" rel="noopener">授權說明</a></p><button class="primary" id="close">回到故事</button>`);bind('#close',close);}
function spots(){if(isMilitaryChapter()&&state.stage!=='prepare')return militarySpots();if(isChapter()&&state.stage!=='prepare')return chapterSpots();if(state.stage==='street')return [{id:'high',x:440,y:165,label:'高處避難平台',icon:'↑',action:()=>arrive('high')},{id:'debris',x:440,y:310,label:'封鎖巷道',icon:'⚠',action:()=>event('debris')},{id:'park',x:190,y:420,label:'公園入口',icon:'♧',action:()=>event('park')},{id:'bunker',x:740,y:260,label:'防空避難入口',icon:'↘',action:()=>arrive('bunker')},{id:'shelter',x:740,y:420,label:state.route==='military'?'社區救濟站':'社區收容處',icon:'⌂',action:()=>arrive('shelter')},{id:'rumor',x:340,y:420,label:'查看群組',icon:'…',action:()=>event('rumor')}];if(state.stage==='shelter')return [{id:'child',x:280,y:300,label:'家人',icon:'♡',action:()=>event('child')},{id:'contact',x:700,y:300,label:'報平安',icon:'▤',action:()=>{if(!state.done.includes('child'))toast('先陪家人說說話，再一起報平安。');else event('contact',finish);}},{id:'end',x:480,y:180,label:'今日回顧',icon:'✓',action:()=>{if(state.done.includes('contact'))finish();else toast('先和家人互動，再報平安，完成今天的故事。');}}];const list=[{id:'bag',x:140,y:290,label:'避難包',icon:'▣'},{id:'pantry',x:290,y:210,label:'儲備櫃',icon:'▥'},{id:'family',x:510,y:390,label:'家人',icon:'♡'},{id:'phone',x:770,y:210,label:'家庭群組',icon:'…'},{id:'neighbor',x:800,y:460,label:'林阿姨',icon:'♧'}].map(p=>({...p,action:()=>event(p.id)}));if(state.stage==='prepare')return [...list,...state.sideEvents.filter(id=>id!=='neighbor').map((id,i)=>({id,x:380+i*220,y:200,label:{backup:'備份資料',wifi:'陌生網路',careSupplies:'照護用品'}[id],icon:'✳',action:()=>event(id)})),{id:'door',x:450,y:500,label:'準備出發',icon:'→',action:depart}];return [{id:'power',x:730,y:300,label:'照明與收音機',icon:'▤',action:()=>event('power')},{id:'door',x:450,y:500,label:state.route==='air'?'前往安全樓梯':'撤離玄關',icon:'→',action:depart}].filter(p=>state.route!=='air'||p.id==='door');}
function obstacles(){if(state.stage==='street')return [...(isMilitaryChapter()?[{x:590,y:250,w:300,h:110}]:[]),{x:60,y:75,w:260,h:155},{x:610,y:75,w:280,h:150},{x:600,y:470,w:290,h:80},{x:65,y:475,w:220,h:75},{x:470,y:235,w:100,h:125}];if((['shelter','bunker','cover'].includes(state.stage))&&!(isMilitaryChapter()&&state.stage==='shelter'&&state.chapter.scenario==='stay'))return [{x:100,y:80,w:260,h:120},{x:600,y:80,w:260,h:120},{x:100,y:440,w:200,h:85},{x:650,y:440,w:180,h:85}];return [{x:70,y:100,w:140,h:120},{x:250,y:95,w:110,h:70},{x:430,y:265,w:160,h:85},{x:680,y:95,w:180,h:70},{x:80,y:440,w:180,h:85},{x:650,y:400,w:85,h:110}];}
function walkable(x,y){return x>=30&&x<=930&&y>=65&&y<=565&&!obstacles().some(o=>x>o.x-14&&x<o.x+o.w+14&&y>o.y-14&&y<o.y+o.h+14);}
function navigate(x,y,target){if(isMilitaryChapter()&&['bunker','cover'].includes(state.stage)){if(target)target.action();else toast('保持在安全掩蔽位置，按 E 或點情境標記確認下一步。');return;}const cell=20,start=[Math.round(state.x/cell),Math.round(state.y/cell)],goal=[Math.round(x/cell),Math.round(y/cell)];if(!walkable(goal[0]*cell,goal[1]*cell)){toast('這裡不能直接通過，請點可通行的地面。');return;}const key=(a,b)=>`${a},${b}`,queue=[start],seen=new Map([[key(...start),null]]);let found=null;for(let i=0;i<queue.length;i++){const [a,b]=queue[i];if(a===goal[0]&&b===goal[1]){found=[a,b];break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[a+dx,b+dy],k=key(...n);if(!seen.has(k)&&walkable(n[0]*cell,n[1]*cell)){seen.set(k,[a,b]);queue.push(n);}}}if(found){const steps=[];for(let n=found;seen.get(key(...n));n=seen.get(key(...n)))steps.push({x:n[0]*cell,y:n[1]*cell});path=steps.reverse();autoTarget=target;if(!path.length&&target)target.action();}else toast('找不到可通行路線，請換個位置。');}
canvas.addEventListener('pointerdown',e=>{if(dialog.open||!active||state.ended)return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),cam=camera(),x=((e.clientX-r.left)*canvas.width/r.width-cam.x)/cam.zoom,y=((e.clientY-r.top)*canvas.height/r.height-cam.y)/cam.zoom,target=spots().find(p=>Math.abs(x-p.x)<65&&y>=p.y-24&&y<=p.y+54);navigate(target?target.x:x,target?target.y:y,target);});
function interact(){if(dialog.open||!active)return;if(isMilitaryChapter()&&['bunker','cover'].includes(state.stage)){const current=spots().find(p=>p.id===militaryTask(state).id);current?.action();return;}if(state.ended){finish();return;}if(nearest)nearest.action();else toast('走近發光標記，再按互動。');}
$('#interact').onclick=interact;$('#notebook').onclick=review;$('#help').onclick=help;
$('#restart').onclick=()=>{open('<h2 id="dialog-title">重新開始今天的故事？</h2><p>目前的存檔將被新的一局取代。</p><div class="dialog-actions"><button id="cancel" class="choice">繼續這一局</button><button id="new" class="primary">重新選擇路線</button></div>');bind('#cancel',close);bind('#new',welcome);};
const directions={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
window.addEventListener('keydown',e=>{if(dialog.open)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(directions[k]){e.preventDefault();keys.add(k);path=[];autoTarget=null;}if(['e',' '].includes(k)){e.preventDefault();if(!e.repeat)interact();}});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{keys.clear();save();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();save();}});dialog.addEventListener('cancel',e=>{e.preventDefault();toast('請用對話中的按鈕繼續。');});
document.querySelectorAll('[data-dir]').forEach(b=>{const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[b.dataset.dir];b.onpointerdown=e=>{if(dialog.open)return;e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);path=[];autoTarget=null;};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(key));});
function box(x,y,w,h,color,r=10){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(str,x,y,size=15,color='#47674f',align='center'){ctx.font=`${size}px "PingFang TC",system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);}
function tree(x,y){box(x-5,y+9,10,27,'#9f9872',3);ctx.fillStyle='#a7bd85';for(const [dx,dy,r]of [[-15,0,22],[13,0,25],[0,-18,25]]){ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,7);ctx.fill();}ctx.fillStyle='#bed09b';ctx.beginPath();ctx.arc(x-8,y-22,14,0,7);ctx.fill();}
function building(x,y,w,h,color,label){box(x+6,y+8,w,h,'#a7b69b44');box(x,y,w,h,color);box(x-5,y-9,w+10,28,'#749286',6);for(let i=0;i<Math.floor(w/70);i++)box(x+20+i*70,y+45,32,36,'#ecf2dd',4);text(label,x+w/2,y+h-22,18,'#365d4e');}
function person(x,y,color='#db945b',player=false){ctx.fillStyle='#244e4125';ctx.beginPath();ctx.ellipse(x,y+16,16,6,0,0,7);ctx.fill();box(x-10,y-4,20,24,color,6);const step=player&&!dialog.open&&(path.length||keys.size)?Math.sin(last/100)*3:0;box(x-10,y+12+step,7,11,'#385e51',2);box(x+3,y+12-step,7,11,'#385e51',2);ctx.fillStyle='#eac7a0';ctx.beginPath();ctx.arc(x,y-13,11,0,7);ctx.fill();ctx.fillStyle='#4d5144';ctx.beginPath();ctx.arc(x,y-17,11,Math.PI,Math.PI*2);ctx.fill();if(player){box(x-15,y-1,7,17,'#54755a',3);text('你',x,y-34,11,'#315e49');}}
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);box(0,0,canvas.width,canvas.height,'#dfe6d4',0);const cam=camera();ctx.save();ctx.translate(cam.x,cam.y);ctx.scale(cam.zoom,cam.zoom);const street=state.stage==='street',shelter=['shelter','bunker','cover'].includes(state.stage)&&!(isMilitaryChapter()&&state.stage==='shelter'&&state.chapter.scenario==='stay');box(0,0,960,600,street?'#e4ead7':'#eae6d5',0);if(street){box(20,245,920,170,'#d1d8c4');box(350,55,110,510,'#d1d8c4');ctx.setLineDash([16,18]);ctx.strokeStyle='#eef1e5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(30,330);ctx.lineTo(920,330);ctx.stroke();ctx.setLineDash([]);building(60,75,260,155,'#dfd0b4','我們的家');building(610,75,280,150,'#cbd9c5','社區地下避難空間');building(600,470,290,80,'#e3d6b5',state.route==='military'?'社區救濟站':'社區收容處');box(65,475,220,75,'#c5d6ad');tree(120,490);tree(245,505);tree(535,130);tree(530,465);tree(900,400);box(470,235,100,125,'#c0c2ab');for(let y=250;y<350;y+=25){box(470,y,100,10,'#d6ae69',0);}text('禁止通行',520,302,14,'#755d3d');text('安全步道 ↓',520,395,13,'#738565');box(375,100,130,40,'#b9cc9c');text('內陸高處 ↑',440,126,14,'#4e6d43');if(isMilitaryChapter()){box(610,250,280,110,'#ba9e8055',6);for(let x=625;x<880;x+=40){box(x,265,16,10,'#aa9377',2);}text('遠處疑似軍事活動',750,315,15,'#795d46');text('勿靠近圍觀 · 依指引遠離',750,343,12,'#795d46');}}else{for(let y=65;y<600;y+=70){ctx.strokeStyle='#dcd9c7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(930,y);ctx.stroke();}box(28,52,904,12,'#a7b8a3',2);box(28,52,12,510,'#a7b8a3',2);box(920,52,12,510,'#a7b8a3',2);if(shelter){for(const o of obstacles()){box(o.x+4,o.y+5,o.w,o.h,'#385d4120');box(o.x,o.y,o.w,o.h,'#b8cbb2');box(o.x+10,o.y+12,o.w-20,28,'#edf0d9');}text(state.stage==='cover'?'暫時掩蔽 · 等待可信通行指引':state.stage==='bunker'?'防空警報中 · 依現場引導':state.route==='air'?'遠離窗戶 · 依現場引導':state.route==='tsunami'?'高處等待 · 勿返回海岸':!route().street?'在家安頓 · 留意可靠資訊':'依序登記 · 告知照護需求',480,90,16);person(265,285,'#88a59d');person(300,300,'#c8ac72');person(690,280,'#8cae8c');}else{box(75,105,135,112,'#c5d3b9');box(84,115,117,33,'#e3e7ce');box(84,158,117,38,'#e3e7ce');text('玄關收納',142,134,12);box(250,95,110,70,'#baac88');for(let x=267;x<350;x+=25)box(x,107,16,28,'#e3d6b5',3);box(410,245,200,125,'#d9caa4');box(430,265,160,85,'#bb9671');box(438,273,144,65,'#d8b88c');box(680,95,180,70,'#aabfab');box(690,105,160,44,'#dfe7d1');box(80,440,180,85,'#91aa94');box(90,450,70,55,'#b8c9ac');box(170,450,75,55,'#b8c9ac');box(650,400,85,110,'#c6b79b');box(385,530,130,30,'#9eae92');text('玄關 / 樓梯',450,552,12);tree(890,110);person(500,410,'#91aaa0');person(540,420,'#d8b778');person(820,480,'#b5a3ae');}text(shelter?'照顧彼此，也留意可靠資訊。':'從日常的一小步開始。',480,580,12,'#8d9682');}
if(isChapter()&&state.stage==='crisis'&&state.done.includes('quake')){const lamp=state.flags.includes('light'),bright=state.flags.includes('packedLight')||state.flags.includes('houseLight'),radius=lamp?(bright?230:125):75;const shade=ctx.createRadialGradient(state.x,state.y,20,state.x,state.y,radius);shade.addColorStop(0,'rgba(17,33,40,0.03)');shade.addColorStop(1,'rgba(17,33,40,0.72)');ctx.fillStyle=shade;ctx.fillRect(0,0,960,600);text(lamp?(bright?'手電筒已開啟':'手機暫時照明 · 留意電量'):'停電中 · 先確認照明',480,85,14,'#f4e7c3');}
if(path.length){ctx.setLineDash([4,9]);ctx.lineWidth=3;ctx.strokeStyle='#739b7380';ctx.beginPath();ctx.moveTo(state.x,state.y);path.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}
nearest=null;let distance=65;for(const p of spots()){const done=p.id==='mRadio'?state.done.includes('mBroadcast'):p.id==='mLink'?(state.done.includes('mLinkPlan')||state.done.includes('mLinkRequest')):p.id==='qRadio'?state.done.includes('qBroadcast'):p.id==='qMeet'?(state.done.includes('qMeetPlan')||state.done.includes('qLostContact')):state.done.includes(p.id),d=Math.hypot(state.x-p.x,state.y-p.y);if(d<distance){distance=d;nearest=p;}const pulse=1+Math.sin(t/400+p.x)*.08;ctx.fillStyle=done?'#82997a30':'#fff8df55';ctx.beginPath();ctx.arc(p.x,p.y,25*pulse,0,7);ctx.fill();ctx.fillStyle=done?'#75936d':'#fbfaf0';ctx.strokeStyle=done?'#75936d':'#91aa7e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,17,0,7);ctx.fill();ctx.stroke();text(done?'✓':p.icon,p.x,p.y+6,20,done?'#fff':'#59784c');box(p.x-61,p.y+27,122,24,'#f9fbf0ed',5);text(p.label,p.x,p.y+43,12,'#4f6d47');}if(isInteractiveChapter()&&state.done.includes(isMilitaryChapter()?'mFamily':'qFamily')&&['crisis','street'].includes(state.stage)){person(state.x-27,state.y+25,'#d2b06e');text('小晴',state.x-27,state.y-5,10,'#605d40');}
person(state.x,state.y,'#dd955b',true);ctx.restore();const prompt=$('#interact-prompt');const stationary=isMilitaryChapter()&&['bunker','cover'].includes(state.stage);prompt.hidden=(!nearest&&!stationary)||dialog.open||!active;prompt.textContent=stationary?'保持掩蔽 · 按 E 或點標記確認下一步':nearest?`E / 點擊互動 · ${nearest.label}`:'';}
function loop(t){const dt=Math.max(0,Math.min((t-last)/1000,.04));last=t;if(active&&!dialog.open&&!state.ended&&!(isMilitaryChapter()&&['bunker','cover'].includes(state.stage))){let dx=0,dy=0;for(const k of keys){const d=directions[k];if(d){dx+=d[0];dy+=d[1];}}if(dx||dy){const len=Math.hypot(dx,dy);dx=dx/len*190*dt;dy=dy/len*190*dt;if(walkable(state.x+dx,state.y))state.x+=dx;if(walkable(state.x,state.y+dy))state.y+=dy;}else if(path.length){const p=path[0],len=Math.hypot(p.x-state.x,p.y-state.y),speed=210*dt;if(len<=speed){state.x=p.x;state.y=p.y;path.shift();if(!path.length&&autoTarget){const target=autoTarget;autoTarget=null;target.action();}}else{state.x+=(p.x-state.x)/len*speed;state.y+=(p.y-state.y)/len*speed;}}}draw(t);requestAnimationFrame(loop);}
function restoreTransition(){if(isMilitaryChapter()){restoreMilitaryTransition();return;}if(isChapter()&&state.done.includes('contact')&&!state.done.includes('qNight')){event('qNight',finish);return;}if(state.ended||state.done.includes('contact')){finish();return;}if(state.stage==='street'&&state.done.includes(route().destination)){settle();return;}if(state.stage==='crisis'){if(!state.done.includes(route().entry)){startCrisis();return;}if(!route().street||state.route==='tsunami'){afterEntry();return;}if(state.done.includes(state.route==='air'?'elevator':'exit')){toStreet();return;}}toast('歡迎回來，接著上次的小小準備。');}
try{const saved=restoreSavedState(localStorage.getItem(storage));if(saved){state=saved;active=true;if(!walkable(state.x,state.y)){state.x=240;state.y=360;}update();restoreTransition();}else welcome();}catch{state=initialState();welcome();}update();requestAnimationFrame(loop);setInterval(()=>{if(active)save();},2500);
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
