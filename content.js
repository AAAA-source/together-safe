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
export function initialState(route='quake',random=Math.random){return {version:2,route,stage:'prepare',x:240,y:360,ready:0,care:0,risk:0,flags:[],done:[],history:[],sideEvents:drawSideEvents(route,random),ended:false};}
export function applyChoice(state,id,index){const event=EVENTS[id],choice=event?.choices[index];if(!choice||state.done.includes(id))return state;return {...state,ready:Math.min(100,state.ready+choice.ready),care:Math.max(0,Math.min(100,state.care+choice.care)),risk:state.risk+choice.risk,flags:[...new Set([...state.flags,...choice.flags])],done:[...state.done,id],history:[...state.history,{id,index}]};}
export function ending(state){if(state.risk>=6)return {icon:'🌱',title:'平安，從下一次準備開始',text:'你完成了演練，也發現幾個容易猶豫的時刻。把回顧中的一件事帶回生活，下次就多一份把握。'};if(state.flags.includes('plan')&&state.flags.includes('bag')&&state.flags.includes('comfort')&&state.risk<=1)return {icon:'🏡',title:'有準備，也有彼此',text:'平時準備在關鍵時刻派上用場，你也記得照顧家人的感受。今天的結局，是你們一起完成的。'};if(state.care>=60)return {icon:'🤝',title:'一起走，就多一份安心',text:'你用查證、陪伴與合作度過這次演練。再補齊物資與聯絡約定，下一次會更從容。'};return {icon:'☀️',title:'把今天的一步，帶回日常',text:'你完成了這次情境的應對。回頭看看做過的選擇，找出下一件可以和家人一起完成的準備。'};}
