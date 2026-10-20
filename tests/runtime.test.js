import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as content from '../content.js';

// Exercise the actual game controller with a minimal DOM and a canvas sink.
// These are controller tests, not a replacement for visual browser QA.
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import \{([^}]+)\} from .*?;\n/,'const {$1}=content;\n');
function harness(saved){
 const nodes=new Map(),buttons=[];let timeout=0;
 class Element{
  constructor(id){this.id=id;this.style={};this.handlers={};this.open=false;this.dataset={};this._html='';this.textContent='';}
  set innerHTML(value){this._html=value;if(this.id==='dialog-content'){buttons.length=0;for(const match of value.matchAll(/<button\b([^>]*)>/g)){const e=new Element();for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){if(attr[1]==='id')e.id=attr[2];if(attr[1].startsWith('data-'))e.dataset[attr[1].slice(5)]=attr[2];}buttons.push(e);}}}
  get innerHTML(){return this._html;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  click(){this.onclick?.();this.handlers.click?.();}
  showModal(){this.open=true;}
  close(){this.open=false;}
  focus(){}
  querySelectorAll(selector){return buttons.filter(e=>matches(e,selector));}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  getContext(){return new Proxy({},{get:(_,name)=>name==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}
 }
 function matches(e,s){if(s==='button')return true;if(s.startsWith('#'))return e.id===s.slice(1);const m=s.match(/^\[data-(\w+)(?:="?([^\]"]+)"?)?\]$/);return !!m&&Object.hasOwn(e.dataset,m[1])&&(!m[2]||e.dataset[m[1]]===m[2]);}
 for(const id of ['family-status','camera-toggle','language-select','translate-scene','language-help','world','dialog','dialog-content','toast','chapter','route-label','readiness','ready-bar','care','care-bar','inventory','journal','map-tag','mission','interact-prompt','interact','notebook','help','restart'])nodes.set(id,new Element(id));
 nodes.get('world').width=960;nodes.get('world').height=600;
 const store=new Map(saved?[['together-safe-v2',saved]]:[]);
 const sandbox={content,document:{querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},navigator:{},location:{protocol:'http:',href:'http://localhost/'},requestAnimationFrame(){},setInterval(){},setTimeout(){return ++timeout;},clearTimeout(){},console};
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);run(source);
 return {run,nodes,buttons,store,click:s=>{const b=buttons.find(e=>matches(e,s));assert.ok(b,`Button ${s} should exist`);b.click();},get state(){return JSON.parse(run('JSON.stringify(state)'));}};
}
function choice(h,index=0){h.click(`[data-choice=${index}]`);h.click('#continue');}
function reach(h,id){h.run(`(()=>{const target=spots().find(p=>p.id===${JSON.stringify(id)});if(!target)throw Error('Missing spot ${id}');navigate(target.x,target.y,target);})()`);let elapsed=0;while(h.run('path.length')&&elapsed<15000){elapsed+=40;h.clock=(h.clock??0)+40;h.run(`loop(${h.clock})`);}assert.ok(h.nodes.get('dialog').open,`Reached ${id} should open dialog`);}

for(const route of Object.keys(content.ROUTES).filter(id=>id!=='quake'))test(`actual controller: ${route} can be walked to a complete ending`,()=>{
 const h=harness();h.click(`[data-route=${route}]`);
 for(const id of ['bag','pantry','family','phone','neighbor']){reach(h,id);choice(h);}
 reach(h,'door');assert.equal(h.state.stage,'crisis');choice(h);
 if(content.ROUTES[route].street){
  if(route!=='tsunami'){if(route!=='air'){reach(h,'power');choice(h);}reach(h,'door');choice(h);}
  assert.equal(h.state.stage,'street');
  reach(h,content.ROUTES[route].destination);choice(h); // misinformation check
  assert.ok(h.nodes.get('dialog').open);choice(h); // arrival
 }
 assert.equal(h.state.stage,'shelter');reach(h,'child');choice(h);reach(h,'contact');choice(h);
 assert.equal(h.state.ended,true);assert.match(h.nodes.get('dialog-content').innerHTML,/有準備，也有彼此/);
});

test('every home hotspot and optional event is reachable without crossing furniture',()=>{const h=harness();h.click('[data-route=air]');const ids=h.run('spots().map(p=>p.id)');for(const id of ids){h.run(`(()=>{const p=spots().find(p=>p.id==='${id}');navigate(p.x,p.y);})()`);assert.ok(h.run('path.length')>0,id);assert.equal(h.run('path.every(p=>walkable(p.x,p.y))'),true,id);}});
test('wrong destinations do not advance the route',()=>{const h=harness();h.click('[data-route=tsunami]');h.run("state.stage='street';state.x=100;state.y=330;arrive('bunker')");assert.equal(h.state.stage,'street');assert.equal(h.state.done.includes('bunker'),false);assert.match(h.nodes.get('toast').textContent,/高處/);});
test('refresh between choice feedback and transition resumes correctly',()=>{for(const [route,event,stage]of [['quake','exit','street'],['air','elevator','street'],['tsunami','tsunami','street'],['cyber','cyber','shelter'],['typhoon','typhoon','shelter']]){let s=content.initialState(route);s.stage='crisis';s=content.applyChoice(s,content.ROUTES[route].entry,0);if(event!==content.ROUTES[route].entry)s=content.applyChoice(s,event,0);if(route==='quake')s.chapter=null;const h=harness(JSON.stringify(s));assert.equal(h.state.stage,stage,route);}});
test('refresh after arrival or final choice does not strand completion',()=>{let s=content.initialState('air');s.stage='street';s=content.applyChoice(s,'bunker',0);let h=harness(JSON.stringify(s));assert.equal(h.state.stage,'shelter');s=h.state;s=content.applyChoice(s,'contact',0);h=harness(JSON.stringify(s));assert.equal(h.state.ended,true);});

function prepareChapter(h,{items=['water','food','flashlight','medicine','papers','radio'],plan=true,neighbor=true}={}){
 h.click('[data-route=quake]');reach(h,'bag');
 for(const item of items)h.click(`[data-item=${item}]`);
 h.click('#pack-confirm');h.click('#continue');
 for(const id of ['pantry','family','phone','neighbor']){reach(h,id);choice(h,id==='family'&&!plan||id==='neighbor'&&!neighbor?1:0);}
}
function crisisChapter(h,{lamp=0}={}){
 reach(h,'door');choice(h);
 reach(h,'power');choice(h,lamp);
 reach(h,'qFamily');choice(h);
 reach(h,'qRadio');h.click('#radio-power');h.click('#radio-emergency');h.click('#radio-listen');choice(h);
 reach(h,'door');choice(h);
}
function streetChapter(h){
 reach(h,'debris');choice(h);
 reach(h,'qMeet');choice(h);
 if(!h.state.flags.includes('familyLocated')){reach(h,'qMeetHelp');choice(h);}
 reach(h,'shelter');choice(h);choice(h);
}
function settleChapter(h,{supplies=0,child=0}={}){
 reach(h,'qSupplies');choice(h,supplies);
 reach(h,'child');choice(h,child);
 reach(h,'contact');choice(h);
 reach(h,'qNight');choice(h);
}

test('earthquake chapter: packed items, family plan and radio lead to full epilogues',()=>{
 const h=harness();prepareChapter(h);crisisChapter(h);assert.equal(h.state.stage,'street');streetChapter(h);settleChapter(h);
 assert.equal(h.state.ended,true);assert.match(h.nodes.get('dialog-content').innerHTML,/燈熄了，約定還亮著/);assert.match(h.nodes.get('dialog-content').innerHTML,/小晴也在故事裡/);assert.ok(h.state.flags.includes('usedCarePack'));assert.ok(h.state.flags.includes('usedPlan'));
});
test('earthquake chapter: no light, no plan, no supplies unlock real fallback steps',()=>{
 const h=harness();prepareChapter(h,{items:['food','toy'],plan:false});
 reach(h,'door');choice(h);reach(h,'power');
 const before=h.state.history.length;h.click('[data-choice=0]');assert.equal(h.state.history.length,before,'unavailable flashlight cannot be selected');choice(h,1);
 reach(h,'qFamily');choice(h);reach(h,'qRadio');h.click('#radio-power');h.click('#radio-music');assert.ok(!h.buttons.some(b=>b.id==='radio-listen'));h.click('#radio-emergency');h.click('#radio-listen');choice(h);reach(h,'door');choice(h);
 streetChapter(h);reach(h,'qSupplies');const again=h.state.history.length;h.click('[data-choice=0]');assert.equal(h.state.history.length,again);choice(h,1);reach(h,'child');choice(h,2);reach(h,'contact');choice(h);reach(h,'qNight');choice(h);
 assert.equal(h.state.ended,true);assert.ok(h.state.done.includes('qLostContact'));assert.ok(h.state.done.includes('qMeetHelp'));assert.ok(h.state.flags.includes('supplyHelp'));assert.match(h.nodes.get('dialog-content').innerHTML,/陌生的路上，有人接住你們/);assert.match(h.nodes.get('dialog-content').innerHTML,/小熊/);
});
test('packing draft and radio knobs survive reload without awarding duplicate progress',()=>{
 let h=harness();h.click('[data-route=quake]');reach(h,'bag');h.click('[data-item=flashlight]');h=harness(h.store.get('together-safe-v2'));assert.deepEqual(h.state.chapter.packDraft,['flashlight']);reach(h,'bag');h.click('#pack-confirm');h.click('#continue');const score=h.state.ready;h.run("event('bag')");assert.equal(h.state.ready,score);
});
test('chapter reload after contact or toy choice resumes without discarding progress',()=>{
 let s=content.initialState('quake');s=content.packState(s,['water','food','medicine','papers','toy','flashlight']);s.stage='shelter';s=content.applyChoice(s,'child',2);let h=harness(JSON.stringify(s));assert.ok(h.state.flags.includes('comfort'));assert.ok(h.state.flags.includes('usedToy'));s=content.applyChoice(h.state,'contact',0);h=harness(JSON.stringify(s));assert.equal(h.state.ended,false);assert.match(h.nodes.get('dialog-content').innerHTML,/晚一點/);choice(h);assert.equal(h.state.ended,true);
});
test('version 2 saves stay on the legacy route and retain choices',()=>{const s=content.initialState('quake');s.version=2;delete s.chapter;s.stage='crisis';s.done=['quake'];s.history=[{id:'quake',index:0}];const h=harness(JSON.stringify(s));assert.equal(h.state.chapter,null);assert.equal(h.state.version,3);assert.ok(h.run("spots().some(p=>p.id==='power')"));});
test('translation stays local until explicit link click and encodes current scene only',()=>{const h=harness();h.nodes.get('language-select').value='en';h.nodes.get('language-select').onchange();const url=new URL(h.nodes.get('translate-scene').href);assert.equal(url.hostname,'translate.google.com');assert.equal(url.searchParams.get('tl'),'en');assert.match(url.searchParams.get('text'),/今天/);assert.ok(!url.searchParams.get('text').includes('sideEvents'));assert.equal(h.state.done.length,0);});

test('incomplete chapter cannot skip family or broadcast prerequisites',()=>{const h=harness();h.click('[data-route=quake]');h.run("state.stage='crisis';state.done=['quake'];depart()");assert.equal(h.state.stage,'crisis');assert.match(h.nodes.get('toast').textContent,/照明/);h.run("state.done.push('power');depart()");assert.match(h.nodes.get('toast').textContent,/小晴/);h.run("state.done.push('qFamily');depart()");assert.match(h.nodes.get('toast').textContent,/收音機/);});
test('radio settings survive reload and still require powered emergency band',()=>{
 let s=content.initialState('quake');s.stage='crisis';s.done=['quake','power','qFamily'];s.chapter.radioPower=true;s.chapter.radioBand='music';
 const h=harness(JSON.stringify(s));reach(h,'qRadio');assert.match(h.nodes.get('dialog-content').innerHTML,/音樂頻道/);assert.ok(!h.buttons.some(b=>b.id==='radio-listen'));h.click('#radio-emergency');assert.ok(h.buttons.some(b=>b.id==='radio-listen'));h.click('#radio-power');assert.ok(!h.buttons.some(b=>b.id==='radio-listen'));
});
test('camera keeps player visible at map boundaries and supports square mobile canvas',()=>{
 const h=harness();h.run("canvas.height=960;viewZoom=1.8;state.x=30;state.y=65");let c=JSON.parse(h.run('JSON.stringify(camera())'));assert.equal(c.x,0);assert.equal(c.y,0);
 h.run('state.x=930;state.y=565');c=JSON.parse(h.run('JSON.stringify(camera())'));assert.equal(c.x,960-960*1.8);assert.equal(c.y,960-600*1.8);
});
