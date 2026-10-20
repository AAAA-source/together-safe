import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restoreSavedState} from '../content.js';
import {harness} from './harness.js';

const clone=state=>JSON.parse(JSON.stringify(state));
test('reject damaged saves before assigning them to the active game',()=>{
 const good=initialState('military'),bad=[];
 for(const [key,value]of [['route','__proto__'],['route','missing'],['stage','unknown'],['ready',101],['care',-1],['x',1e100],['ended','yes'],['flags',null],['done',['constructor']],['history',[{id:'military',index:'__proto__'}]],['sideEvents',['wifi','wifi']]]){const s=clone(good);s[key]=value;bad.push(s);}
 for(const change of [c=>c.pack.push('not-an-item'),c=>c.packDraft.push(...Array(7).fill('water')),c=>c.radioBand='unrecognized',c=>c.scenario='invalid',c=>c.airAlert='false',c=>c.encounter='invalid']){const s=clone(good);change(s.chapter);bad.push(s);}
 for(const value of [null,undefined,'{','[]',...bad]){assert.equal(restoreSavedState(value),null);assert.doesNotThrow(()=>harness(typeof value==='string'?value:JSON.stringify(value)));}
});
test('legacy quick routes cannot be restored into a military-only scene',()=>{
 for(const route of ['quake','air','tsunami','cyber','typhoon']){const s=initialState(route);s.stage='bunker';assert.equal(restoreSavedState(s),null);s.stage='cover';assert.equal(restoreSavedState(s),null);}
});
test('saved history text is escaped rather than interpreted as markup',()=>{
 const s=initialState('military');s.history=[{id:'military',index:0,label:'<img src=x onerror=alert(1)>',decision:'<script>bad()</script>',outcome:'A & B'}];s.done=['military'];
 const h=harness(JSON.stringify(s));h.run('review()');const html=h.nodes.get('dialog-content').innerHTML;
 assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;img/);assert.match(html,/A &amp; B/);
});
