import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=new URL('../',import.meta.url);
export function buildStandalone(){
 const read=name=>readFileSync(new URL(name,root),'utf8');
 const data=read('content.js').replace(/^export /gm,'');
 const game=read('game.js').replace(/^import .*?;\n/,'').replace(/^if\('serviceWorker'.*$/m,'');
 const js=`(()=>{\n${data}\n${game}\n})();`.replace(/<\/script/gi,'<\\/script');
 return read('index.html')
  .replace('<title>今天，也要一起平安</title>','<title>今天，也要一起平安・離線版</title>')
  .replace('<link rel="stylesheet" href="style.css">',()=>`<style>${read('style.css')}</style>`)
  .replace('<link rel="icon" href="icon.svg" type="image/svg+xml">',()=>`<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(read('icon.svg'))}" type="image/svg+xml">`)
  .replace('<link rel="manifest" href="manifest.webmanifest">','')
  .replace('href="./" class="brand"','href="#" class="brand"')
  .replace(/<a id="download-offline"[^>]*>.*?<\/a>/,'<span>單檔離線版 · 遊戲內容已內嵌</span>')
  .replace('<script type="module" src="game.js"></script>',()=>`<script>${js}</script>`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const output=new URL('一起平安-離線版.html',root);
 writeFileSync(output,buildStandalone());
 console.log(`已產生：${fileURLToPath(output)}`);
}
