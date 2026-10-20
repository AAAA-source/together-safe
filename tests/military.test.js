import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../content.js';
import {harness,choice,reach} from './harness.js';

const variants=['stay','stay-alert','relocate','relocate-cover','relocate-alert-clear','relocate-alert'];
const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function setup(variant,{items=['water','food','flashlight','medicine','papers','radio'],plan=true,stock=true,skip=false,mobile=false,standalone=false}={}){
 const h=harness(undefined,{mobile,standalone});h.click('#military-routes');h.click(`[data-scenario=${variant}]`);
 if(!skip){
  reach(h,'bag');for(const id of items)h.click(`[data-item=${id}]`);h.click('#pack-confirm');h.click('#continue');
  for(const id of ['pantry','family','phone','neighbor']){reach(h,id);choice(h,(id==='family'&&!plan||id==='pantry'&&!stock)?1:0);}
 }
 reach(h,'door');if(h.buttons.some(b=>b.id==='go'))h.click('#go');
 return h;
}
function drive(start,{random=()=>0,reload=false,mobile=false,standalone=false,trace=[]}={}){
 let h=start,iterations=0;
 while(!h.state.ended&&iterations++<90){
  assert.ok(content.restoreSavedState(h.store.get('together-safe-v2')),'all intermediate saves should be valid');
  if(h.nodes.get('dialog').open){
   const choices=h.buttons.filter(button=>button.dataset.choice!==undefined&&!button.disabled);
   if(choices.length){
    const button=choices[Math.floor(random()*choices.length)];
    button.click();trace.push(h.state.history.at(-1)?.id);
    if(reload){h=harness(h.store.get('together-safe-v2'),{mobile,standalone});}
    else h.click('#continue');
   }else if(h.buttons.some(b=>b.id==='radio-power')){
    if(!h.state.chapter.radioPower)h.click('#radio-power');
    h.click('#radio-emergency');h.click('#radio-listen');
   }else throw Error('Unexpected dialogue '+h.nodes.get('dialog-content').innerHTML);
  }else{
   const task=content.militaryTask(h.state);
   reach(h,task.id);
  }
 }
 assert.ok(h.state.ended,`chapter did not finish: ${JSON.stringify(h.state)} ${trace}`);
 assert.equal(new Set(h.state.done).size,h.state.done.length);
 assert.ok(h.state.ready>=0&&h.state.ready<=100&&h.state.care>=0&&h.state.care<=100);
 return h;
}
for(const variant of variants)test(`military full journey: ${variant}`,()=>{
 const h=drive(setup(variant));const state=h.state;
 assert.ok(state.done.includes('mNight'));assert.equal(state.done.includes('mAlert'),variant.includes('alert'));
 assert.equal(state.done.includes('mEncounter'),!variant.startsWith('stay'));
 assert.equal(state.done.includes('mCoverWait'),variant.includes('cover')||variant==='relocate-alert');
 assert.equal(state.done.includes('mRelief'),!variant.startsWith('stay'));
 assert.match(h.nodes.get('dialog-content').innerHTML,/守住日常，也守住彼此/);
 assert.equal(content.militaryEpilogues(state).length,6);
});

test('all military variants finish after reload at every selected-choice feedback boundary',()=>{
 for(const variant of variants){const h=drive(setup(variant,{items:['toy'],plan:false,stock:false}),{reload:true});assert.ok(h.state.done.includes('mNight'),variant);}
});

test('military randomized stress: 96 paths, including empty packs, bad choices, reloads and mobile cameras',()=>{
 const endings=new Set();let completed=0;
 for(let seed=1;seed<=96;seed++){
  const random=rng(seed),variant=variants[(seed-1)%variants.length],mobile=seed%2===0;
  const items=seed%16===0?['water','food','flashlight','medicine','papers','radio']:content.PACK_ITEMS.filter(()=>random()<.5).slice(0,content.PACK_LIMIT).map(item=>item.id);
  const h=drive(setup(variant,{items,plan:random()<.5,stock:random()<.5,skip:seed%7===0,mobile}),{random:seed%4===0?()=>0:random,reload:seed%3===0,mobile});
  endings.add(content.militaryEnding(h.state).title);completed++;
 }
 assert.equal(completed,96);assert.ok(endings.size>=4,'varied choices should produce distinct endings');
});

test('single-file offline artifact completes the military chapter using its bundled controller',()=>{
 const h=drive(setup('relocate-alert',{items:['toy'],plan:false,standalone:true}),{reload:true,standalone:true});assert.equal(h.state.ended,true);assert.ok(h.state.done.includes('mCoverWait'));
});

test('active air alert and street cover do not allow avatar movement or premature departure',()=>{
 for(const stage of ['bunker','cover']){
  let state=content.initialState('military');state.stage=stage;state.done=['military','mFamily','mSignal','mBroadcast'];state.chapter.airAlert=true;
  const h=harness(JSON.stringify(state)),before=[h.state.x,h.state.y];
  h.windowHandlers.keydown({key:'ArrowRight',preventDefault(){}});h.run('loop(100);loop(140);loop(180)');
  assert.deepEqual([h.state.x,h.state.y],before);
  h.run('navigate(800,400)');assert.deepEqual([h.state.x,h.state.y],before);
  h.run('militaryDecide()');assert.equal(h.state.stage,stage);assert.ok(!h.state.done.includes('mDecision'));
 }
});

test('military stage prerequisites reject shortcuts and unprepared supply options',()=>{
 let s=content.initialState('military');s.stage='crisis';s.done=['military'];const h=harness(JSON.stringify(s));
 h.run("militaryEvent('mSignal');militaryDecide()");assert.ok(!h.state.done.includes('mSignal'));assert.equal(h.state.stage,'crisis');
 h.run("state.stage='street';arrive('shelter')");assert.ok(!h.state.done.includes('mRelief'));
 assert.equal(content.militaryArrivalReady(h.state),false);
 assert.equal(content.applyChoice(s,'mSupplies',0),s);
 assert.equal(content.militaryDepartureReady(content.initialState('air')),false);
});

test('military scenario, alert and street encounter are deterministic when random input is seeded',()=>{
 for(let seed=1;seed<=12;seed++)assert.deepEqual(content.initialState('military',rng(seed)),content.initialState('military',rng(seed)));
});

test('all five military endings are reachable',()=>{
 let s=content.initialState('military');s.chapter.scenario='stay';const found=new Set([content.militaryEnding(s).title]);
 s=content.packState(s,['water','food','flashlight','medicine','papers']);s=content.applyChoice(s,'mSignal',0);s=content.applyChoice(s,'child',0);found.add(content.militaryEnding(s).title);
 s=content.initialState('military');s.chapter.scenario='relocate';found.add(content.militaryEnding(s).title);s=content.applyChoice(s,'mLinkHelp',0);found.add(content.militaryEnding(s).title);
 for(const id of ['mFamily','mSignal','mAlert','mWait'])s=content.applyChoice(s,id,1);found.add(content.militaryEnding(s).title);assert.equal(found.size,5);
});

test('old military quick-practice save remains on its original playable route',()=>{
 let state=content.initialState('military');state.chapter=null;state.stage='crisis';state=content.applyChoice(state,'military',0);
 const h=harness(JSON.stringify(state));assert.equal(h.state.chapter,null);reach(h,'power');choice(h);reach(h,'door');choice(h);reach(h,'shelter');choice(h);choice(h);reach(h,'child');choice(h);reach(h,'contact');choice(h);assert.ok(h.state.ended);
});

test('all military hotspot grid destinations are reachable in every scene',()=>{
 for(const variant of variants){
  const h=harness();h.click('#military-routes');h.click(`[data-scenario=${variant}]`);
  for(const stage of ['prepare','crisis','street','shelter','bunker','cover']){
   h.run(`state.stage='${stage}';state.x=100;state.y=330;state.done=['military','mFamily','mSignal','mBroadcast','mLinkRequest'];`);
   assert.equal(h.run('spots().every(p=>walkable(Math.round(p.x/20)*20,Math.round(p.y/20)*20))'),true,`${variant}:${stage}`);
   if(!['bunker','cover'].includes(stage)){
    const ids=h.run('spots().map(p=>p.id)');
    for(const id of ids){h.run(`(()=>{const p=spots().find(p=>p.id==='${id}');navigate(p.x,p.y);})()`);assert.ok(h.run('path.length')>0,`${variant}:${stage}:${id}`);assert.equal(h.run('path.every(p=>walkable(p.x,p.y))'),true);}
   }
  }
 }
});
test('military hazard area blocks both keyboard movement and automatic pathfinding',()=>{
 const s=content.initialState('military');s.chapter.scenario='relocate';s.chapter.encounter='clear';s.stage='street';s.done=['military','mDecision','mEncounter'];const h=harness(JSON.stringify(s));
 assert.equal(h.run('walkable(740,300)'),false);
 h.run('navigate(740,420)');assert.equal(h.run('path.every(p=>walkable(p.x,p.y))'),true);
 h.run('state.x=585;state.y=300');h.windowHandlers.keydown({key:'ArrowRight',preventDefault(){}});h.run('loop(100);loop(140);loop(180)');assert.ok(h.state.x<596);
});

test('all six variants work offline with intentionally incomplete preparation',()=>{
 for(const variant of variants){const h=drive(setup(variant,{items:[],plan:false,stock:false,standalone:true}),{standalone:true});assert.ok(h.state.ended,variant);}
});
test('repeated event clicks cannot duplicate inventory or chapter progress',()=>{
 const h=setup('relocate-alert');
 const original=h.buttons.find(button=>button.dataset.choice==='0');original.click();const once=h.state.history.length;original.click();assert.equal(h.state.history.length,once);h.click('#continue');
 const finished=drive(h);const length=finished.state.history.length;finished.run("event('mNight',finish)");assert.equal(finished.state.history.length,length);assert.ok(finished.state.ended);
});

test('actual canvas pointer handler targets the same marker on desktop and zoomed mobile',()=>{
 for(const mobile of [false,true]){
  const s=content.initialState('military');s.stage='crisis';s.done=['military'];s.x=480;s.y=380;
  const h=harness(JSON.stringify(s),{mobile});
  const position=JSON.parse(h.run("JSON.stringify((()=>{const p=spots().find(p=>p.id==='mFamily'),c=camera();return {x:(p.x*c.zoom+c.x)/canvas.width,y:(p.y*c.zoom+c.y)/canvas.height};})())"));
  h.nodes.get('world').handlers.pointerdown({clientX:position.x*(mobile?360:960),clientY:position.y*(mobile?360:600)});
  for(let t=40;t<2000&&h.run('path.length');t+=40)h.run(`loop(${t})`);
  assert.ok(h.nodes.get('dialog').open);assert.match(h.nodes.get('dialog-content').innerHTML,/先確認身邊的人/);
 }
});
test('held touch controls stop on release and blur, including after military shelter scenes',()=>{
 const s=content.initialState('military');s.stage='crisis';s.done=['military'];s.x=240;s.y=360;
 const h=harness(JSON.stringify(s),{mobile:true}),button=h.touchButtons.find(b=>b.dataset.dir==='right');
 button.onpointerdown({pointerId:1,preventDefault(){}});h.run('loop(40);loop(80)');assert.ok(h.state.x>240);
 button.handlers.pointerup();const stopped=h.state.x;h.run('loop(120);loop(160)');assert.equal(h.state.x,stopped);
 button.onpointerdown({pointerId:2,preventDefault(){}});h.windowHandlers.blur();h.run('loop(200)');assert.equal(h.state.x,stopped);
});

test('military departure and air-alert markers have separate labels and click areas',()=>{
 for(const mobile of [false,true])for(const id of ['door','mAlert']){
  const s=content.initialState('military');s.stage='crisis';s.chapter.airAlert=true;s.x=480;s.y=420;s.done=['military','mFamily','mSignal','mBroadcast'];
  const h=harness(JSON.stringify(s),{mobile});
  const pair=JSON.parse(h.run("JSON.stringify(spots().filter(p=>['door','mAlert'].includes(p.id)))"));
  const [a,b]=pair;assert.ok(Math.abs(a.x-b.x)>=130||Math.abs(a.y-b.y)>=78,'click rectangles must not overlap');
  assert.ok(Math.abs(a.x-b.x)>=122||Math.abs(a.y-b.y)>=24,'labels must not overlap');
  assert.equal(h.run('spots().filter(p=>[\'door\',\'mAlert\'].includes(p.id)).every(p=>walkable(Math.round(p.x/20)*20,Math.round(p.y/20)*20))'),true);
  const position=JSON.parse(h.run(`JSON.stringify((()=>{const p=spots().find(p=>p.id==='${id}'),c=camera();return {x:(p.x*c.zoom+c.x)/canvas.width,y:((p.y+40)*c.zoom+c.y)/canvas.height};})())`));
  h.nodes.get('world').handlers.pointerdown({clientX:position.x*(mobile?360:960),clientY:position.y*(mobile?360:600)});
  assert.equal(h.run('autoTarget?.id'),id,'clicking the label must target the correct marker');
 }
});
