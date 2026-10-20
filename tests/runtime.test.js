import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as content from '../content.js';

// Exercise the actual game controller with a minimal DOM and a canvas sink.
// These are controller tests, not a replacement for visual browser QA.
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*?;\n/,'const {EVENTS,SOURCES,initialState,applyChoice,ending,ROUTES,selectRoute}=content;\n');
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
  getContext(){return new Proxy({},{get:()=>()=>{}});}
 }
 function matches(e,s){if(s==='button')return true;if(s.startsWith('#'))return e.id===s.slice(1);const m=s.match(/^\[data-(\w+)(?:="?([^\]"]+)"?)?\]$/);return !!m&&Object.hasOwn(e.dataset,m[1])&&(!m[2]||e.dataset[m[1]]===m[2]);}
 for(const id of ['world','dialog','dialog-content','toast','chapter','route-label','readiness','ready-bar','care','care-bar','inventory','journal','map-tag','mission','interact-prompt','interact','notebook','help','restart'])nodes.set(id,new Element(id));
 const store=new Map(saved?[['together-safe-v2',saved]]:[]);
 const sandbox={content,document:{querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},navigator:{},location:{protocol:'http:',href:'http://localhost/'},requestAnimationFrame(){},setInterval(){},setTimeout(){return ++timeout;},clearTimeout(){},console};
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);run(source);
 return {run,nodes,buttons,store,click:s=>{const b=buttons.find(e=>matches(e,s));assert.ok(b,`Button ${s} should exist`);b.click();},get state(){return JSON.parse(run('JSON.stringify(state)'));}};
}
function choice(h,index=0){h.click(`[data-choice=${index}]`);h.click('#continue');}
function reach(h,id){h.run(`(()=>{const target=spots().find(p=>p.id===${JSON.stringify(id)});if(!target)throw Error('Missing spot ${id}');navigate(target.x,target.y,target);})()`);let elapsed=0;while(h.run('path.length')&&elapsed<15000){elapsed+=40;h.clock=(h.clock??0)+40;h.run(`loop(${h.clock})`);}assert.ok(h.nodes.get('dialog').open,`Reached ${id} should open dialog`);}

for(const route of Object.keys(content.ROUTES))test(`actual controller: ${route} can be walked to a complete ending`,()=>{
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

test('every home hotspot and optional event is reachable without crossing furniture',()=>{const h=harness();h.click('[data-route=quake]');const ids=h.run('spots().map(p=>p.id)');for(const id of ids){h.run(`(()=>{const p=spots().find(p=>p.id==='${id}');navigate(p.x,p.y);})()`);assert.ok(h.run('path.length')>0,id);assert.equal(h.run('path.every(p=>walkable(p.x,p.y))'),true,id);}});
test('wrong destinations do not advance the route',()=>{const h=harness();h.click('[data-route=tsunami]');h.run("state.stage='street';state.x=100;state.y=330;arrive('bunker')");assert.equal(h.state.stage,'street');assert.equal(h.state.done.includes('bunker'),false);assert.match(h.nodes.get('toast').textContent,/高處/);});
test('refresh between choice feedback and transition resumes correctly',()=>{for(const [route,event,stage]of [['quake','exit','street'],['air','elevator','street'],['tsunami','tsunami','street'],['cyber','cyber','shelter'],['typhoon','typhoon','shelter']]){let s=content.initialState(route);s.stage='crisis';s=content.applyChoice(s,content.ROUTES[route].entry,0);if(event!==content.ROUTES[route].entry)s=content.applyChoice(s,event,0);const h=harness(JSON.stringify(s));assert.equal(h.state.stage,stage,route);}});
test('refresh after arrival or final choice does not strand completion',()=>{let s=content.initialState('air');s.stage='street';s=content.applyChoice(s,'bunker',0);let h=harness(JSON.stringify(s));assert.equal(h.state.stage,'shelter');s=h.state;s=content.applyChoice(s,'contact',0);h=harness(JSON.stringify(s));assert.equal(h.state.ended,true);});
