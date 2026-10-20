import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS,SOURCES,ROUTES,initialState,applyChoice,ending,selectRoute,drawSideEvents,packState,PACK_ITEMS,availableChoice,resolveEvent,chapterEpilogues,chapterEnding} from '../content.js';

test('every event has a source and meaningful bounded outcomes',()=>{assert.equal(Object.keys(EVENTS).length,34);for(const [id,e] of Object.entries(EVENTS)){assert.ok(SOURCES[e.source]?.url.startsWith('https://prepare.mnd.gov.tw/'),id);assert.ok(e.choices.length>=2||['park','shelter'].includes(id),id);for(const c of e.choices){assert.ok(c.text&&c.result);assert.ok([c.ready,c.care,c.risk].every(Number.isFinite));assert.ok(c.risk>=0);}}});
test('random selection covers all six routes at uniform intervals',()=>{const ids=Object.keys(ROUTES);for(let i=0;i<ids.length;i++)assert.equal(selectRoute(()=>(i+.5)/ids.length),ids[i]);assert.equal(selectRoute(()=>0),ids[0]);assert.equal(selectRoute(()=>.999999),ids.at(-1));});
test('side events are unique, valid and repeatable with a seed source',()=>{for(const r of Object.keys(ROUTES)){const a=drawSideEvents(r,()=>.5);assert.equal(a.length,2);assert.equal(new Set(a).size,2);a.forEach(id=>assert.ok(EVENTS[id]));assert.deepEqual(a,drawSideEvents(r,()=>.5));}});
test('choices cannot be farmed or mutate previous state',()=>{const original=initialState();const next=applyChoice(original,'bag',0);assert.equal(original.done.length,0);assert.ok(next.flags.includes('bag'));assert.equal(applyChoice(next,'bag',0),next);assert.equal(applyChoice(next,'missing',0),next);assert.equal(applyChoice(next,'bag',99),next);});
test('all six route narratives have valid entries and distinct destinations',()=>{for(const r of Object.values(ROUTES)){assert.ok(EVENTS[r.entry]);if(r.street)assert.ok(EVENTS[r.destination]);else assert.equal(r.destination,'home');}assert.equal(ROUTES.tsunami.destination,'high');assert.equal(ROUTES.air.destination,'bunker');assert.equal(ROUTES.quake.destination,'shelter');assert.equal(ROUTES.typhoon.street,false);assert.equal(ROUTES.cyber.street,false);});
test('positive preparation and care reach the prepared ending on every route',()=>{for(const [id,r]of Object.entries(ROUTES)){let s=initialState(id);for(const event of ['bag','pantry','family','phone','neighbor',r.entry,...(r.street?[r.destination]:[]),'child','contact'])s=applyChoice(s,event,0);assert.equal(ending(s).title,'有準備，也有彼此');assert.ok(s.ready<=100&&s.care<=100);}});
test('four distinct endings are reachable from real choices',()=>{const reached=new Set();let s=initialState();reached.add(ending(s).title);for(const id of ['family','phone','neighbor','child','contact'])s=applyChoice(s,id,0);reached.add(ending(s).title);s=applyChoice(s,'bag',0);reached.add(ending(s).title);s=initialState();for(const id of ['quake','air','tsunami'])s=applyChoice(s,id,1);reached.add(ending(s).title);assert.equal(reached.size,4);});
test('JSON saves preserve route choices and ending result',()=>{let s=initialState('tsunami',()=>.25);for(const id of ['bag','tsunami','high'])s=applyChoice(s,id,0);const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(restored,s);assert.deepEqual(ending(restored),ending(s));});

test('packing enforces slots, valid unique items, and one-time scoring',()=>{
 const original=initialState('quake');const packed=packState(original,['water','water','unknown','food','flashlight','medicine','papers','toy','radio']);
 assert.equal(packed.chapter.pack.length,6);assert.equal(new Set(packed.chapter.pack).size,6);assert.ok(packed.flags.includes('packedToy'));assert.ok(!packed.flags.includes('packedRadio'));assert.ok(packed.flags.includes('bag'));assert.equal(original.done.length,0);assert.equal(packState(packed,['radio']),packed);
});
test('conditional actions enforce actual inventory, including fallback lighting and supplies',()=>{
 let s=initialState('quake');assert.equal(applyChoice(s,'qSupplies',0),s);assert.equal(applyChoice(s,'power',0),s);s=applyChoice(s,'qCabinet',0);assert.notEqual(applyChoice(s,'power',0),s);const prepared=packState(initialState('quake'),['medicine']);assert.notEqual(applyChoice(prepared,'qSupplies',0),prepared);
});
test('chapter has five reachable endings and epilogues preserve concrete causes',()=>{
 const titles=new Set();let s=initialState('quake');titles.add(chapterEnding(s).title);
 s=packState(s,['water','food','flashlight','medicine','papers','toy']);titles.add(chapterEnding(s).title);
 s=applyChoice(s,'qMeetPlan',0);s=applyChoice(s,'child',2);titles.add(chapterEnding(s).title);assert.match(chapterEpilogues(s).find(e=>e.who==='小晴也在故事裡').text,/小熊/);
 let help=applyChoice(initialState('quake'),'qMeetHelp',0);titles.add(chapterEnding(help).title);assert.match(chapterEpilogues(help).find(e=>e.who==='爸爸與那張聯絡卡').text,/協助站/);
 for(const [id,index]of [['quake',1],['qLostContact',1],['phone',1],['qMeetPlan',1]])help=applyChoice(help,id,index);titles.add(chapterEnding(help).title);assert.equal(titles.size,5);
});
test('portable radio and toy unlock additional choices without mutating base events',()=>{
 const s=packState(initialState('quake'),['radio','toy']);assert.equal(EVENTS.child.choices.length,2);assert.equal(resolveEvent(s,'child').choices.length,3);assert.equal(resolveEvent(s,'rumor').choices.length,3);assert.ok(applyChoice(s,'rumor',2).flags.includes('usedPortableRadio'));assert.equal(resolveEvent(initialState('air'),'rumor').choices.length,2);
});
