import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../content.js';
import {harness} from './harness.js';

function ready(options={}){
 const s=initialState('air');s.x=300;s.y=360;const h=harness(JSON.stringify(s),{mobile:true,...options});return h;
}
function pointer(h,type,x=0,y=0,id=1){
 const element=h.nodes.get('joystick'),r=element.getBoundingClientRect();
 element.handlers[type]({pointerId:id,pointerType:'touch',clientX:r.left+r.width/2+x*r.width*.3,clientY:r.top+r.height/2+y*r.width*.3,preventDefault(){},stopPropagation(){}});
}
function tick(h,ms=40){h.clock=(h.clock??0)+ms;h.run(`loop(${h.clock})`);}
const position=h=>[h.state.x,h.state.y];

test('joystick center dead zone prevents drift; drag distance controls speed',()=>{
 const h=ready();pointer(h,'pointerdown',.05,0);tick(h);assert.deepEqual(position(h),[300,360]);
 pointer(h,'pointermove',.5,0);tick(h);const slow=h.state.x-300;assert.ok(slow>0&&slow<7.6);
 pointer(h,'pointermove',1,0);const before=h.state.x;tick(h);assert.ok(h.state.x-before>slow);assert.ok(Math.abs(h.state.x-before-7.6)<1e-8);
});
test('diagonal joystick travel never exceeds straight-line speed',()=>{
 const h=ready();pointer(h,'pointerdown',1,1);tick(h);
 assert.ok(Math.abs(Math.hypot(h.state.x-300,h.state.y-360)-7.6)<1e-8);
});
test('dragging beyond the base clamps travel and release stops immediately',()=>{
 const h=ready();pointer(h,'pointerdown',5,0);tick(h);assert.equal(h.run('stick.x'),1);assert.equal(h.run('stick.y'),0);
 assert.ok(h.nodes.get('joystick').hasPointerCapture(1));pointer(h,'pointerup',5,0);const at=position(h);tick(h);assert.deepEqual(position(h),at);
 assert.equal(h.run('stick.pointerId'),null);assert.ok(!h.nodes.get('joystick').hasPointerCapture(1));assert.equal(h.nodes.get('joystick-thumb').style.transform,'translate3d(0px,0px,0)');
});
for(const type of ['pointercancel','lostpointercapture'])test(`${type} clears held joystick input`,()=>{
 const h=ready();pointer(h,'pointerdown',1,0);tick(h);pointer(h,type);const at=position(h);tick(h);assert.deepEqual(position(h),at);assert.equal(h.run('stick.pointerId'),null);
});
test('unrelated fingers cannot take over or release an active stick',()=>{
 const h=ready();pointer(h,'pointerdown',1,0,1);pointer(h,'pointerdown',-1,0,2);pointer(h,'pointermove',-1,0,2);pointer(h,'pointerup',0,0,2);tick(h);
 assert.ok(h.state.x>300);assert.equal(h.run('stick.pointerId'),1);pointer(h,'pointerup',0,0,1);
});
test('opening a dialogue, changing tabs, resizing and blurring reset movement',()=>{
 for(const cause of ['dialog','visibility','resize','blur','window-release']){
  const h=ready();pointer(h,'pointerdown',1,0);tick(h);
  if(cause==='dialog')h.run('help()');
  if(cause==='visibility'){h.document.hidden=true;h.documentHandlers.visibilitychange();}
  if(cause==='resize')h.windowHandlers.resize();
  if(cause==='blur')h.windowHandlers.blur();
  if(cause==='window-release')h.windowHandlers.pointerup({pointerId:1});
  const at=position(h);tick(h);assert.deepEqual(position(h),at,cause);assert.equal(h.run('stick.pointerId'),null,cause);
 }
});
test('joystick takeover cancels click-to-walk and map taps cannot interrupt the held stick',()=>{
 const h=ready();h.run('navigate(400,380)');assert.ok(h.run('path.length')>0);pointer(h,'pointerdown',1,0);assert.equal(h.run('path.length'),0);
 h.nodes.get('world').handlers.pointerdown({clientX:200,clientY:200});assert.equal(h.run('path.length'),0);
 pointer(h,'pointerup');h.run('navigate(400,380)');assert.ok(h.run('path.length')>0);
});
test('keyboard input still works and takes over from a held joystick',()=>{
 const h=ready();pointer(h,'pointerdown',1,0);h.windowHandlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(h.run('stick.pointerId'),null);tick(h);assert.ok(h.state.x<300);h.windowHandlers.keyup({key:'ArrowLeft'});const at=position(h);tick(h);assert.deepEqual(position(h),at);
});
test('stick obeys collision boundaries',()=>{
 const h=ready();h.run('state.x=408;state.y=300');pointer(h,'pointerdown',1,0);tick(h);tick(h);assert.ok(h.state.x<=416);
});
test('military cover, active alerts, completed games and open dialogues reject stick input',()=>{
 for(const stage of ['bunker','cover']){
  const s=initialState('military');s.stage=stage;s.done=['military'];const h=harness(JSON.stringify(s),{mobile:true});pointer(h,'pointerdown',1,0);tick(h);assert.equal(h.run('stick.pointerId'),null);assert.equal(h.nodes.get('joystick').getAttribute('aria-disabled'),'true');
 }
 const h=ready();h.run('state.ended=true;update()');pointer(h,'pointerdown',1,0);assert.equal(h.run('stick.pointerId'),null);
 const d=ready();d.run('help()');pointer(d,'pointerdown',1,0);assert.equal(d.run('stick.pointerId'),null);
});
test('single-file offline version includes working joystick controls',()=>{
 const h=ready({standalone:true});pointer(h,'pointerdown',1,0);tick(h);assert.ok(h.state.x>300);pointer(h,'pointerup');const at=position(h);tick(h);assert.deepEqual(position(h),at);
});
