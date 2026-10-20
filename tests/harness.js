import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as content from '../content.js';

// Exercise the actual game controller with a minimal DOM and a canvas sink.
// These are controller tests, not a replacement for visual browser QA.
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import \{([^}]+)\} from .*?;\n/,'const {$1}=content;\n');
export function harness(saved,options={}){
 const nodes=new Map(),buttons=[];let touchButtons=[];let timeout=0;const windowHandlers={};
 class Element{
  constructor(id){this.id=id;this.style={};this.handlers={};this.open=false;this.dataset={};this._html='';this.textContent='';}
  set innerHTML(value){this._html=value;if(this.id==='dialog-content'){buttons.length=0;for(const match of value.matchAll(/<button\b([^>]*)>/g)){const e=new Element();e.disabled=/\bdisabled\b/.test(match[1]);for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){if(attr[1]==='id')e.id=attr[2];if(attr[1].startsWith('data-'))e.dataset[attr[1].slice(5)]=attr[2];}buttons.push(e);}}}
  get innerHTML(){return this._html;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  click(){this.onclick?.();this.handlers.click?.();}
  showModal(){this.open=true;}
  close(){this.open=false;}
  focus(){}
  setPointerCapture(){}
  querySelectorAll(selector){return buttons.filter(e=>matches(e,selector));}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  getBoundingClientRect(){return {left:0,top:0,width:options.mobile?360:960,height:options.mobile?360:this.height||600};}
  getContext(){return new Proxy({},{get:(_,name)=>name==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});}
 }
 function matches(e,s){if(s==='button')return true;if(s.startsWith('#'))return e.id===s.slice(1);const m=s.match(/^\[data-(\w+)(?:="?([^\]"]+)"?)?\]$/);return !!m&&Object.hasOwn(e.dataset,m[1])&&(!m[2]||e.dataset[m[1]]===m[2]);}
 for(const id of ['family-status','camera-toggle','language-select','translate-scene','language-help','world','dialog','dialog-content','toast','chapter','route-label','readiness','ready-bar','care','care-bar','inventory','journal','map-tag','mission','interact-prompt','interact','notebook','help','restart'])nodes.set(id,new Element(id));
 touchButtons=['up','down','left','right'].map(dir=>{const e=new Element();e.dataset.dir=dir;return e;});
 nodes.get('world').width=960;nodes.get('world').height=600;
 const store=new Map(saved?[['together-safe-v2',saved]]:[]);
 const sandbox={content,document:{querySelector:s=>nodes.get(s.slice(1)),querySelectorAll:selector=>selector==='[data-dir]'?touchButtons:[],addEventListener(){}},window:{addEventListener(name,fn){windowHandlers[name]=fn;},matchMedia(){return {matches:!!options.mobile};}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},navigator:{},location:{protocol:'http:',href:'http://localhost/'},requestAnimationFrame(){},setInterval(){},setTimeout(){return ++timeout;},clearTimeout(){},console};
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);run(options.standalone?fs.readFileSync(new URL('../一起平安-離線版.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\(\(\)=>\{\n/,'').replace(/\n\}\)\(\);$/,''):source);
 return {run,nodes,buttons,store,windowHandlers,touchButtons,click:s=>{const b=buttons.find(e=>matches(e,s));assert.ok(b,`Button ${s} should exist`);b.click();},get state(){return JSON.parse(run('JSON.stringify(state)'));}};
}
export function choice(h,index=0){h.click(`[data-choice=${index}]`);h.click('#continue');}
export function reach(h,id){h.run(`(()=>{const target=spots().find(p=>p.id===${JSON.stringify(id)});if(!target)throw Error('Missing spot ${id}');navigate(target.x,target.y,target);})()`);let elapsed=0;while(h.run('path.length')&&elapsed<15000){elapsed+=40;h.clock=(h.clock??0)+40;h.run(`loop(${h.clock})`);}assert.ok(h.nodes.get('dialog').open,`Reached ${id} should open dialog`);}

