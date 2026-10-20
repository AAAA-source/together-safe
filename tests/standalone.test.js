import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildStandalone} from '../scripts/build-standalone.mjs';

test('single-file release is current and has no external executable or style dependencies',()=>{
 const html=buildStandalone();
 assert.equal(html,readFileSync(new URL('../一起平安-離線版.html',import.meta.url),'utf8'));
 assert.doesNotMatch(html,/<script[^>]*src=|<link[^>]*rel="(?:stylesheet|manifest)"|@import|url\(\s*https?:/i);
 const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(js);
 assert.doesNotMatch(js,/^\s*(?:import|export)\s/m);
 assert.doesNotMatch(js,/serviceWorker\.register/);
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const route of ['quake','air','tsunami','typhoon','military','cyber'])assert.ok(js.includes(`${route}:`));
});
