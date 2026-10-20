export const SOURCES = {
 prepare: {title:'臺灣全民安全指引・物資準備',url:'https://prepare.mnd.gov.tw/emergency-supplies/go-bag'},
 disaster: {title:'臺灣全民安全指引・災害應對',url:'https://prepare.mnd.gov.tw/emergency-responses'},
 info: {title:'臺灣全民安全指引・假資訊防範',url:'https://prepare.mnd.gov.tw/misinformation-prevention'},
 mind: {title:'臺灣全民安全指引・心理準備',url:'https://prepare.mnd.gov.tw/mental-preparedness'},
 stock: {title:'臺灣全民安全指引・日常居家儲備',url:'https://prepare.mnd.gov.tw/emergency-supplies/household-supplies'}
};
export const ROUTES={
 quake:{name:'地震與停電',icon:'☀',desc:'就近掩護，搖晃後評估撤離',entry:'quake',destination:'shelter',place:'社區收容處',street:true},
 air:{name:'防空避難',icon:'⌂',desc:'辨識警報，進入合適掩蔽空間',entry:'air',destination:'bunker',place:'地下防空避難空間',street:true},
 tsunami:{name:'海嘯警報',icon:'≈',desc:'遠離海岸，步行往高處避難',entry:'tsunami',destination:'high',place:'高處避難平台',street:true},
 typhoon:{name:'颱風來臨',icon:'☂',desc:'提早準備，依警戒在家避風',entry:'typhoon',destination:'home',place:'家中安全處',street:false},
 military:{name:'軍事侵略與斷訊',icon:'◇',desc:'不圍觀軍事活動，從可靠管道取得資訊',entry:'military',destination:'shelter',place:'社區救濟站',street:true},
 cyber:{name:'資安與可疑訊息',icon:'▤',desc:'辨識釣魚，保護帳號與個資',entry:'cyber',destination:'home',place:'家中安全處',street:false}
};
export function selectRoute(random=Math.random){const ids=Object.keys(ROUTES);return ids[Math.min(ids.length-1,Math.max(0,Math.floor(random()*ids.length)))];}
export function drawSideEvents(route,random=Math.random){const pool=route==='cyber'?['backup','careSupplies','wifi']:['backup','careSupplies','wifi'];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,2);}
const c=(text,result,flags=[],ready=0,care=0,risk=0)=>({text,result,flags,ready,care,risk});
export const EVENTS={
 bag:{title:'玄關的背包，裝什麼？',text:'你找到一個輕便背包。孩子問：「如果要離開家，我們要帶什麼？」',source:'prepare',choices:[c('飲水、乾糧、手電筒、必要藥品與證件影本','你準備好必要用品，也確認家人的個別需求。遊戲中的背包只是簡化清單；實際內容須依需求調整。',['bag'],25,5),c('只帶手機和充電線','手機很有幫助，但斷電斷網時，飲水、照明與必要用品同樣重要。你把補齊清單記下來。',[],5,0,1),c('裝滿所有收藏品','你試背後發現太重了。避難包應衡量負重能力，優先保留必要用品。',[],0,0,1)]},
 pantry:{title:'把準備放進日常',text:'廚房櫃子裡有一些罐頭。你要怎麼準備家裡的儲備？',source:'stock',choices:[c('依全家需求準備，平時使用、定期補充','你為飲食、衛生與特殊需求列出清單，並排定檢查日期。居家儲備與隨身避難包是不同用途。',['stock'],20,5),c('只買一種最便宜的食物','家人的飲食、飲水、藥品與照護需求不盡相同。準備時也要考慮保存與使用方式。',[],5,0,1)]},
 family:{title:'如果電話打不通',text:'家人坐在餐桌旁。奶奶說：「手機沒訊號的話，我們要去哪裡找彼此？」',source:'prepare',choices:[c('約定安全集合點、備案與紙本聯絡資料','你們約好：在自身安全且可通行的前提下，依事先約定聯絡。孩子也知道不用獨自冒險找人。',['plan'],15,20),c('到時候一直打電話就好','通訊可能中斷。你們發現事先約定集合與聯絡方式，可以減少臨時奔波。',[],0,5,1)]},
 phone:{title:'群組裡的緊急截圖',text:'「朋友說今晚全區停電，快轉傳！」訊息沒有來源和日期，卻已經被轉傳很多次。',source:'info',choices:[c('查來源、日期與官方資訊，再回覆家人','你提醒家人先別轉傳，並找到可查證的資訊管道。冷靜查證也是照顧彼此。',['verified'],10,15),c('先轉傳，總比沒提醒好','未查證的消息容易造成不必要的恐慌。你撤回轉傳，提醒大家確認來源。',[],0,-5,1)]},
 neighbor:{title:'門口的林阿姨',text:'林阿姨說，她平常一個人住，走路也比較慢。「如果有狀況，可以一起留意嗎？」',source:'prepare',choices:[c('事先交換聯絡方式，討論可行的互助安排','你們在平時了解彼此需求，也說好危機時先確保自身安全，再尋求合適協助。',['neighbor'],5,20),c('每個人先管好自己','先保護自己很重要；平時建立鄰里聯繫，也能讓危機時多一份支持。',[],0,0)]},
 quake:{title:'地板突然晃了起來',text:'【地震情境演練】杯子晃動，手機跳出地震警訊。你目前在室內。沒有倒數，先想想應對原則。',source:'disaster',choices:[c('就近到堅固桌下，趴下、掩護、穩住','你護住頭頸、穩住身體，等待搖晃停止。遊戲暫停移動，避免讓玩家誤以為地震中應穿越房間找出口。',['protected'],10,10),c('立刻衝出家門','搖晃時奔跑會增加跌倒與遭掉落物傷害的風險。你停下來，就近掩護直到搖晃停止。',[],0,0,2),c('搭電梯趕快下樓','電梯可能停電受困。你改為就近掩護，等待搖晃停止，再評估後續行動。',[],0,0,2)]},
 power:{title:'搖晃停了，燈也暗了',text:'【搖晃已停止】你確認家人暫時無恙。照明熄滅，手機網路時好時壞。接下來怎麼做？',source:'prepare',choices:[c('使用手電筒，保留手機電力並收聽資訊','手電筒幫助你觀察環境；收音機等備援管道可在斷網時提供資訊。你不急著摸黑外出。',['light'],10,5),c('一直開手機直播看看大家怎麼說','未確認的直播不等於可靠指示，持續使用也會消耗電量。你改為節省電力、尋找可信資訊。',[],0,0,1)]},
 air:{title:'手機出現防空警報',text:'【防空情境演練，非即時警報】你正在家中玄關，收到防空警報訊息。窗外有人想跑去拍攝。',source:'disaster',choices:[c('保持冷靜，依標示與引導到合適的避難處','你確認這次情境中的地下避難空間就在社區內，由安全通道可達。不搭電梯，也不為了取物延誤。',['alert'],10,10),c('先去窗邊看看、拍照上傳','靠近門窗與停留拍攝會增加風險。你離開窗邊，依指示準備避難。',[],0,0,2),c('開車穿越街區回另一個家','不要為了回家增加不必要的移動。應依所在位置就近選擇合適避難處，聽從引導。',[],0,0,2)]},
 elevator:{title:'電梯看起來還能用',text:'通往地下避難空間的路口，有樓梯與電梯。這裡的樓梯經確認可通行，且你和家人可安全使用。',source:'disaster',choices:[c('走安全樓梯，配合現場引導','你選擇可通行的樓梯，避免電梯因停電而受困。行動不便者需依現場條件與人員協助安排。',['stairs'],10,10),c('搭電梯比較快','危機時電梯可能受困。你改走已確認安全的樓梯；這次選擇記入回顧。',[],0,0,1)]},
 exit:{title:'這次，需要暫時離開家',text:'【虛構劇情】現場人員已評估住家不宜繼續停留，並確認樓梯與街區疏散路線可通行。請依引導前往「社區收容處」。',source:'disaster',choices:[c('依安全路線撤離，不搭電梯','你依引導離開。若背包已備好且就在手邊，可順手帶上；不為取物返回危險建物。',['departed'],5,10),c('先回去多搬幾件東西','財物不值得冒險。現場人員提醒你不要返回危險建物，你改依引導撤離。',[],0,0,1)]},
 debris:{title:'這條近路被擋住了',text:'前方巷道有掉落物與破損招牌。旁邊的步道已標示可通行，繞行也能到達目的地。',source:'disaster',choices:[c('沿安全步道繞行','你選擇已確認可通行的路線。遊戲中封鎖的巷道仍無法穿越。',['detour'],5,5),c('鑽過去，應該很快','不要穿越有掉落物風險的區域。你退回安全處，改走可通行步道。',[],0,0,1)]},
 park:{title:'空曠的公園，可以嗎？',text:'你走到公園入口。這裡並非本次指示的目的地。',source:'disaster',choices:[c('重新確認這次危機與指定地點','不同危機需要不同避難方式。地震後的收容地點與防空避難空間不可混為一談；依本次情境指示行動。',[],0,5)]},
 rumor:{title:'又一則沒有來源的消息',text:'有人傳來「不用避難了，快出來！」，沒有官方公告，也沒有現場人員確認。',source:'info',choices:[c('繼續依現場指示，查證可靠來源','你沒有把群組訊息當成解除警報。可靠資訊能幫助大家穩定行動。',['checked'],5,10),c('看到很多人轉傳，就相信了','轉傳次數不能證明真假。你停下腳步確認，這次不依未查證訊息離開。',[],0,-5,1)]},
 shelter:{title:'走進社區收容處',text:'工作人員已開設收容空間，請大家依序登記需求。這是住家不宜居住時的暫時安置點。',source:'disaster',choices:[c('依序登記，告知家人的必要照護需求','你提供必要資料，確認飲水、休息與照護安排。收容處與防空避難設施的用途不同。',['arrived'],5,15)]},
 bunker:{title:'到達防空避難空間',text:'你已到達有標示、由人員引導的地下避難空間，周圍遠離窗戶。警報尚未解除。',source:'disaster',choices:[c('依引導靠牆坐下，保護頭部並等待解除','你採取室內防空避難姿勢，繼續等待可靠的解除訊息，不因外面暫時安靜就離開。',['arrived','protected'],10,10),c('外面沒聲音了，現在就出去','安靜不代表警報解除。你留在安全處，等待防空警報解除與現場指示。',['arrived'],0,0,2)]},
 child:{title:'「我們會不會一直待在這裡？」',text:'孩子拉住你的衣角。奶奶也有些不安。你們目前已在本次安排的避難地點。',source:'mind',choices:[c('先聽他們說，簡單解釋已知情況，一起慢慢呼吸','你不承諾無法保證的事，讓家人知道有人陪伴，也會繼續確認可靠資訊。',['comfort'],0,20),c('叫他們別想太多，自己滑手機','害怕是正常反應。你發現陪伴與傾聽，比要求對方立刻冷靜更有幫助。',[],0,-5,1)]},
 contact:{title:'傳出一則平安訊息',text:'現在可以聯絡親友了。你想讓他們知道狀況，也留意電量與通訊資源。',source:'prepare',choices:[c('簡短報平安，依約定更新狀況','你清楚說明目前狀況，不公開他人的個資，也不散播未確認消息。',['contact'],0,10),c('反覆撥打每個人的電話','先依事先約定的方式聯絡，簡短說明必要資訊，並留意電量與通訊狀況。',[],0,0,1)]},
 tsunami:{title:'海邊的家，收到海嘯警報',text:'【海嘯情境演練】你住在沿海街區，收到官方海嘯警報。這次指示的步行路線通往遠離海岸的高處避難平台。',source:'disaster',choices:[c('立刻依指示步行往高處、遠離海岸','你不去海邊觀看，也不開車造成壅塞。此次虛構平台位於內陸高地，並非地下室。',['tsunamiAware'],10,10),c('跑到地下室躲起來','海嘯與防空的應對不同，低窪處不適合躲海嘯。你改為依指示往內陸高處避難。',[],0,0,2),c('去海邊拍攝海浪','不要靠近海岸觀察海嘯。你停止拍攝，立即沿指示路線遠離海岸、往高處。',[],0,0,2)]},
 high:{title:'抵達高處避難平台',text:'你已沿指定路線抵達虛構的內陸高地。有人說海面看起來正常，想先回家。',source:'disaster',choices:[c('留在安全處，等待官方解除與現場指示','海面暫時平靜不代表危險解除。你留在安全高處，不急著返回沿海地區。',['arrived'],10,10),c('陪他回海邊拿東西','不要在警報未解除前返回沿海地區。你改為留在高處，等待指示。',['arrived'],0,0,2)]},
 typhoon:{title:'風雨抵達之前',text:'【颱風情境演練】官方發布颱風警報。這次劇情中的住家未列入撤離範圍，沒有淹水或結構危險。家人想趁風雨前去海邊。',source:'disaster',choices:[c('確認儲備與警戒資訊，留在家中安全處','你取消不必要的外出並持續留意官方資訊。若後續收到撤離指示或住家不安全，仍需依引導疏散。',['stayed'],10,10),c('風雨還不大，先去海邊看看','不要到海邊或危險區域觀浪。你改為留在家中，留意警戒與撤離資訊。',[],0,0,2)]},
 military:{title:'不尋常的軍事活動',text:'【軍事侵略情境演練】你從家中觀察到附近疑似軍事活動，網路不穩。此刻尚無防空警報。',source:'disaster',choices:[c('遠離門窗，不圍觀拍攝，透過可靠管道獲取資訊','你沒有接近軍事活動，也不公開軍事動態。後續路線將在現場人員確認安全後才開放。',['militaryAware'],10,10),c('到街上靠近拍攝，直播給朋友','接近與公開軍事動態會增加風險。你離開窗邊並停止拍攝，等待可信資訊。',[],0,0,2)]},
 cyber:{title:'「你的帳號即將停用」',text:'【資安情境演練】手機收到陌生簡訊，要你立即點連結輸入帳號、密碼與驗證碼。家人正打算照做。',source:'info',choices:[c('不點連結，從已知的官方管道自行查證','你沒有把密碼或驗證碼提供給陌生來源，也提醒家人謹慎處理可疑訊息。',['cyberAware'],15,10),c('先輸入密碼和驗證碼再說','這是遊戲中的模擬選擇，沒有真的蒐集資料。遇到可疑要求，應停止操作、改從可信管道處理；若已外洩，應立即透過官方管道保護帳號。',[],0,0,2)]},
 wifi:{title:'免費 Wi-Fi，要連嗎？',text:'你的裝置發現一個來路不明的免費 Wi-Fi。旁邊的紙條還印著要求下載軟體的 QR code。',source:'info',choices:[c('不連陌生網路，也不掃不明 QR code','你保留警覺，不為了方便而開啟不明連線、連結或檔案。',['wifiSafe'],5,5),c('免費就試試看，順便下載軟體','可疑網路、QR code 與軟體可能帶來風險。你停止操作，改用可信的連線方式。',[],0,0,1)]},
 backup:{title:'照片和重要資料的備份',text:'家人問：「如果手機突然壞掉，聯絡資料和重要檔案還找得到嗎？」',source:'info',choices:[c('平時備份重要資料，更新軟體並保護密碼','你把備份和更新加入日常習慣。資料能否取回，也值得在平時確認。',['backup'],5,5),c('手機一直都很好，不必備份','故障與資安事件不會先預告。你把備份重要資料與更新軟體列入待辦。',[],0,0,1)]},
 careSupplies:{title:'每個人的需要不一樣',text:'奶奶需要處方藥，孩子有自己的照護用品，家裡也養了一隻貓。要怎麼一起準備？',source:'prepare',choices:[c('確認個別照護與寵物需求，檢查物品效期','你把藥品、照護用品與寵物所需加入清單，依專業指示與保存需求準備，不自行調整用藥。',['careSupplies'],5,10),c('每個人都裝一模一樣的用品','通用清單之外，也要考慮個別需求。你邀請家人一起確認，而不是假設人人相同。',[],0,0,1)]}
};
export function initialState(route='quake',random=Math.random){return {version:3,chapter:route==='quake'?{revision:1,pack:[],packDraft:[],radioPower:false,radioBand:null,packConfirmed:false}:null,route,stage:'prepare',x:240,y:360,ready:0,care:0,risk:0,flags:[],done:[],history:[],sideEvents:drawSideEvents(route,random),ended:false};}
export function applyChoice(state,id,index){const event=resolveEvent(state,id),choice=event?.choices[index];if(!choice||!availableChoice(state,choice)||state.done.includes(id))return state;return {...state,ready:Math.min(100,state.ready+choice.ready),care:Math.max(0,Math.min(100,state.care+choice.care)),risk:state.risk+choice.risk,flags:[...new Set([...state.flags,...choice.flags])],done:[...state.done,id],history:[...state.history,{id,index,label:event.title,decision:choice.text,outcome:choice.result}]};}
export function ending(state){if(state.risk>=6)return {icon:'🌱',title:'平安，從下一次準備開始',text:'你完成了演練，也發現幾個容易猶豫的時刻。把回顧中的一件事帶回生活，下次就多一份把握。'};if(state.flags.includes('plan')&&state.flags.includes('bag')&&state.flags.includes('comfort')&&state.risk<=1)return {icon:'🏡',title:'有準備，也有彼此',text:'平時準備在關鍵時刻派上用場，你也記得照顧家人的感受。今天的結局，是你們一起完成的。'};if(state.care>=60)return {icon:'🤝',title:'一起走，就多一份安心',text:'你用查證、陪伴與合作度過這次演練。再補齊物資與聯絡約定，下一次會更從容。'};return {icon:'☀️',title:'把今天的一步，帶回日常',text:'你完成了這次情境的應對。回頭看看做過的選擇，找出下一件可以和家人一起完成的準備。'};}


// The earthquake chapter is authored separately from the quick practice routes.
// Item slots are a game abstraction, not a real-world weight recommendation.
export const PACK_ITEMS = [
 {id:'water',name:'飲用水',icon:'◉',note:'依個人需求準備飲水。'},
 {id:'food',name:'即食乾糧',icon:'▤',note:'常溫保存、方便食用。'},
 {id:'flashlight',name:'手電筒與電池',icon:'✦',note:'停電時不必持續消耗手機電力。'},
 {id:'medicine',name:'個人照護用品',icon:'✚',note:'阿嬤的個人必要藥品與用品，依原專業指示準備。'},
 {id:'papers',name:'證件與聯絡卡',icon:'▧',note:'證件影本、紙本聯絡資料與集合備案。'},
 {id:'radio',name:'可攜式收音機',icon:'▣',note:'斷網時的備援資訊管道。'},
 {id:'toy',name:'小晴的小熊',icon:'♡',note:'熟悉的小物，可以陪孩子安頓情緒。'},
 {id:'album',name:'厚厚的相簿',icon:'▥',note:'很珍貴，但需要空間；可在平時另做數位備份。'}
];
export const PACK_LIMIT = 6;
const q = (title,text,source,choices)=>({title,text,source,choices});
Object.assign(EVENTS,{
 qCabinet:q('打開玄關備用櫃','搖晃已停止。你就在玄關旁，確認腳下安全後，打開平時放備用品的櫃子。裡面有一支可用的手電筒。','stock',[
  c('檢查電池，取用家中的備用手電筒','你先確認腳下與周圍狀況，再在可安全取得的範圍內取用照明。這次補上了準備，也多了一次尋找的步驟。',['houseLight'],5,0),
  c('暫時不取，先保留手機照明','你可以暫用手機照明，留意電量。備用品仍留在原處，但這次不會加入隨身物品。',[],0,0)
 ]),
 qFamily:q('小晴：「我可以幫忙嗎？」','搖晃已停止。阿嬤和小晴都能回應、沒有明顯不適。爸爸剛才出門到里辦公處辦事，現在電話暫時打不通。你先和身邊的家人確認下一步。','mind',[
  c('請小晴協助看聯絡卡，一起確認阿嬤的需要','小晴有了一件能在你身邊完成的小任務：記住約定、留意標示。你也聽見阿嬤說，需要帶上自己的照護用品。',['familyChecked','childRole'],0,15),
  c('先由自己安排，簡短告知家人接下來的行動','你確認了家人的狀況並說明安排。小晴雖然沒有參與分工，但知道要和你待在一起，不獨自找爸爸。',['familyChecked'],0,5)
 ]),
 qBroadcast:q('收音機傳來清楚的聲音','【虛構演練廣播】住家這側經現場人員評估需要暫時撤離；樓梯與指定步道已確認可通行。社區收容處已開設，請依現場引導前往。這段訊息不是即時災情。','stock',[
  c('記下安置點與路線，和家人確認','你把廣播中的安排和現場指引交叉確認。先前準備的備援資訊管道，現在成了下一步的依據。',['broadcastKnown'],5,5),
  c('只記得要出門，沒有確認目的地','阿嬤提醒你再聽一次。你們補記了安置點，避免把「離開家」誤當成完整計畫。',['broadcastKnown'],0,0,1)
 ]),
 qMeetPlan:q('那張聯絡卡，現在用上了','你們到達事先約定、這次已確認可安全停留的聯絡點。工作人員轉達：爸爸已在社區收容處登記，會在那裡等你們。','prepare',[
  c('依備案確認訊息，再沿指定步道前往','不必在街區逐一尋找。小晴對照卡上的約定，說：「我們知道下一步了。」你把確認後的消息告訴阿嬤。',['familyLocated','usedPlan'],0,15),
  c('仍想離開指定路線，自己找一圈','約定的用途，就是減少不必要的奔波。現場人員提醒你別離開已確認的路線，你改依確認消息前往。',['familyLocated'],0,0,1)
 ]),
 qLostContact:q('沒有訊號，也沒有約好的地方','你再次看手機，仍聯絡不到爸爸。你們平時沒有約定集合備案。附近的協助站有工作人員，可幫忙確認家人是否已登記。','prepare',[
  c('先讓家人待在身邊，到協助站詢問','你們不分頭找人，決定先向現場人員尋求可靠協助。地圖上的「聯絡協助站」現在是下一步。',['needsContactHelp'],0,5),
  c('想請小晴一個人去另一條街找','孩子不應獨自冒險尋人。你取消這個安排，讓小晴待在身邊，改到協助站詢問。',['needsContactHelp'],0,0,2)
 ]),
 qMeetHelp:q('多一道詢問，也有人願意幫忙','協助站人員透過此次演練的登記資料確認：爸爸已在社區收容處。這次不必再到街上尋找。','prepare',[
  c('確認必要資訊，再一起前往收容處','你把家人留在身邊，完成一次詢問。爸爸有了下落，你也決定回家後寫好聯絡與集合備案。',['familyLocated','contactHelp'],0,10),
  c('把家人的完整資料公開貼到社群尋人','公開個資可能帶來其他風險。你撤回這個打算，改由可信人員協助確認必要資訊。',['familyLocated','contactHelp'],0,0,1)
 ]),
 qNeighbor:q('「我們也往同一個地方去。」','林阿姨在已確認安全的步道旁，由工作人員協助。她認出你，說自己走得慢，擔心跟不上。','prepare',[
  c('告知工作人員需求，在安全前提下互相留意','你沒有獨自承擔超出能力的搬運或救援，而是把需求清楚交接。平時認識彼此，讓這次開口更容易。',['neighborHelped'],0,10),
  c('先照顧家人，確認人員已接手協助','你確認林阿姨已有工作人員協助，再照顧身邊家人。互助也包含清楚自己的能力與界線。',['neighborReferred'],0,5)
 ]),
 qSupplies:q('阿嬤的那一小包用品','你們已在收容處安頓，爸爸也來到身邊。阿嬤想確認個人照護用品是否在手邊；工作人員正在登記需求。','prepare',[
  {...c('拿出備好的個人用品，向人員說明需求','阿嬤認出自己的用品。你確認保存與使用需求，依原本的專業指示處理，不自行調整藥物。',['careSettled','usedCarePack'],0,10),requires:'packedMedicine'},
  c('向工作人員登記需求，請醫護人員協助確認','你沒有返回不安全的住家取物，也不向別人借不明藥物。你們登記照護需求，等待專業人員協助安排。',['careSettled','supplyHelp'],0,10)
 ]),
 qNight:q('晚一點，坐在同一張毯子上','你們完成安頓與報平安。小晴問：「明天回家，可以一起再整理一次嗎？」這段故事還沒把所有問題解決，但你們已經有了能一起做的下一步。','mind',[
  c('一起寫下一件明天能完成的準備','你們把今天的經驗留在行動簿裡。安全準備不需要一次做到完美，可以從今天記得的一件小事開始。',['tomorrowPlan'],0,5),
  c('先休息，等有精神再一起回顧','休息也是照顧彼此。你們約好有餘力時再談，不強迫家人現在立刻整理所有感受。',['restTogether'],0,5)
 ])
});

export function packState(state,selected){
 if(!state.chapter||state.done.includes('bag'))return state;
 const ids=[...new Set(selected)].filter(id=>PACK_ITEMS.some(item=>item.id===id)).slice(0,PACK_LIMIT);
 const essential=['water','food','flashlight','medicine','papers'];
 const complete=essential.every(id=>ids.includes(id));
 const next=applyChoice(state,'bag',complete?0:1);
 const itemFlags={flashlight:'packedLight',medicine:'packedMedicine',papers:'packedPapers',radio:'packedRadio',toy:'packedToy'};
 const flags=ids.filter(id=>itemFlags[id]).map(id=>itemFlags[id]);
 return {...next,flags:[...new Set([...next.flags,...flags])],chapter:{...next.chapter,pack:ids,packDraft:ids,packConfirmed:true},history:next.history.map(h=>h.id==='bag'?{...h,label:'親手整理避難包',decision:ids.length?ids.map(id=>PACK_ITEMS.find(item=>item.id===id).name).join('、'):'這次先不裝物品',outcome:complete?'必要用品已在手邊；實際內容仍需依每位家人的需求調整。':'這次選擇會保留到後面的停電與照護情境。遊戲格數只為呈現取捨，不是現實重量標準。'}:h)};
}
export function availableChoice(state,choice){return (!choice.requires||state.flags.includes(choice.requires))&&(!choice.requiresAny||choice.requiresAny.some(flag=>state.flags.includes(flag))); }
export function chapterEpilogues(state){
 const f=id=>state.flags.includes(id);
 return [
  {who:'停電時的一束光',text:f('packedLight')?'你事先裝進背包的手電筒，在燈熄滅後立即派上用場。':f('houseLight')?'你多找了一次玄關備用櫃，取到了家中的手電筒。':'你暫用手機照明，留意電量，並記下補齊備用照明的需求。'},
  {who:'爸爸與那張聯絡卡',text:f('usedPlan')?'事前約好的聯絡點與備案，讓你們少了一段無方向的尋找。':'協助站人員幫忙確認爸爸的下落。你們決定下次先寫好家庭聯絡備案。'},
  {who:'阿嬤的照護用品',text:f('usedCarePack')?'你拿出備好的個人用品，阿嬤和工作人員能更清楚確認需求。':'你沒有冒險回家取物，而是登記需求，請醫護人員協助安排。'},
  {who:'小晴也在故事裡',text:f('packedToy')&&f('comfort')?'你拿出小熊、聽她說害怕。熟悉的小物和陪伴，讓這一晚多一點安定。':f('childRole')&&f('comfort')?'她幫忙記住約定，你也留時間聽她說。小晴記得的是「我們一起做了什麼」。':f('comfort')?'你留時間傾聽，沒有要求她立刻不害怕。':'你們先完成安頓。回顧時，你想起還可以再找時間，聽小晴說說今天的感受。'},
  {who:'林阿姨與鄰里',text:f('neighborHelped')?'平時建立的聯繫，成了這次把需求交給工作人員的一座橋。':f('neighborReferred')?'你確認工作人員已接手，再照顧家人。你沒有勉強自己做超出能力的事。':'這次你先安頓了家人。之後有餘力時，可以從認識鄰居與討論互助開始。'}
 ];
}
export function chapterEnding(state){
 const f=id=>state.flags.includes(id);
 if(state.risk>=6)return {icon:'🌱',title:'把今天的猶豫，變成明天的準備',text:'你們完成了這次演練。那些不確定的時刻沒有被跳過，而是留下了下次能一起練習的方向。'};
 if(f('bag')&&f('usedPlan')&&f('comfort'))return {icon:'🏡',title:'燈熄了，約定還亮著',text:'備用品、聯絡卡與願意聽彼此說話的時間，接住了這一天。你們不是沒有害怕，而是知道下一步可以一起做什麼。'};
 if(f('contactHelp'))return {icon:'🤝',title:'陌生的路上，有人接住你們',text:'有些約定來不及在平時寫好，但你沒有讓家人分頭冒險。你向可信的人員求助，慢慢把彼此重新連起來。'};
 if(!f('bag'))return {icon:'🎒',title:'把缺少的準備，寫進明天',text:'你們找到可用的協助，也發現哪些用品值得提早放好。這個結局不是要求一次完美，而是留下可以開始的清單。'};
 return {icon:'☀️',title:'先安頓，再慢慢說',text:'今天先把大家安頓下來。等有了休息的空間，還能一起回頭談談害怕、互助，以及下一次想做得更好的地方。'};
}

export function resolveEvent(state,id){
 const original=EVENTS[id];if(!original)return null;
 const e={...original,choices:original.choices.map(choice=>({...choice}))};
 if(state.route!=='quake'||!state.chapter)return e;
 if(id==='power'){
  e.title='先讓眼前，亮起來';
  e.text='【搖晃已停止】家裡停電了。你停在確認可安全站立的位置，先照亮眼前，再帶家人移動。'+(state.flags.includes('packedLight')?'手電筒已在你的背包裡。':'若沒有備用照明，可以先用手機；玄關備用櫃也可能找得到手電筒。');
  e.choices=[
   {...c('打開手電筒，確認周圍與腳下','你使用已備好的照明，讓手機留作必要聯絡。燈光會隨著你移動，幫助你辨識場景。',['light'],10,5),requiresAny:['packedLight','houseLight']},
   c('暫用手機照明，留意電量','你先用手機照亮附近，減少不必要的操作與耗電。如果想換成手電筒，可以查看玄關備用櫃。',['light','phoneLight'],5,5)
  ];
 }
 if(id==='qMeetPlan'&&!state.flags.includes('packedPapers')){e.title='還記得，我們約好了';e.text='這次沒帶上紙本卡，但你們記得平時討論過的聯絡點與備案。工作人員轉達：爸爸已在社區收容處登記。';}
 if(id==='rumor'&&state.flags.includes('packedRadio'))e.choices.push({...c('用隨身收音機對照資訊，再向現場人員確認','你把背包裡的備援工具用在路上。這次沒有依賴不明群組訊息，而是確認可靠來源後再行動。',['checked','usedPortableRadio'],5,10),requires:'packedRadio'});
 if(id==='child'&&state.flags.includes('packedToy'))e.choices.push({...c('拿出小熊，聽小晴說說今天的害怕','你沒有要求她立刻不害怕。小熊是一個熟悉的陪伴，你也認真聽她說，把安頓情緒的時間留給彼此。',['comfort','usedToy'],0,20),requires:'packedToy'});
 return e;
}
