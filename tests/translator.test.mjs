// Headless browser checks for the one RUDVENTUR translator (translator_v7.html):
// the World Keyboards panel (world-keyboards.js) follows ?lang=, types into the
// translator's text box and into the chat box of the Chat tab (global-chat.html),
// and nothing throws a script error, at 1440 and 390 pixels wide.
// Serves the repository itself; the map library, fonts and translation services load from the web.
//   npm i -D puppeteer            (or: npm i -D puppeteer-core and set CHROME_PATH)
//   node tests/translator.test.mjs            (SHOTS=prefix also saves screenshots)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const puppeteer = (await import(process.env.CHROME_PATH ? 'puppeteer-core' : 'puppeteer')).default;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port + '/';
const out = process.env.SHOTS || '';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)fail++;};
for (const w of [1440,390]) {
  const p = await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' '))); p.on('dialog',d=>d.dismiss());
  await p.setViewport({width:w,height:w>500?900:844,deviceScaleFactor:1});
  await p.goto(base+'translator_v7.html?lang=pl&keyboard=1',{waitUntil:'load',timeout:60000}); await sleep(2500);
  await sleep(4000);
  ok(await p.$eval('#wk-panel',e=>e.classList.contains('open')), w+' keyboard opens from ?keyboard=1');
  ok(await p.$eval('#wk-layout',e=>e.value)==='polish', w+' layout follows ?lang=pl');
  await p.focus('#translate-input');
  for (const ch of ['c','z','e','s','c']) { await p.evaluate(c=>{[...document.querySelectorAll('#wk-panel .key')].find(k=>k.lastChild.textContent===c).click()},ch); }
  ok(await p.$eval('#translate-input',e=>e.value)==='czesc', w+' keyboard types into the translator text box');
  if (out) await p.screenshot({path:`${out}-translate-${w}.png`});
  await p.click('.tr-tab[data-tab=chat]'); await sleep(4000);
  const f = p.frames().find(x=>x.url().includes('global-chat.html'));
  ok(!!f, w+' chat tab loads Global Chat');
  await f.focus('#globalInput'); await sleep(200);
  await p.evaluate(()=>{[...document.querySelectorAll('#wk-panel .key')].find(k=>k.lastChild.textContent==='h').click();[...document.querySelectorAll('#wk-panel .key')].find(k=>k.lastChild.textContent==='i').click()});
  ok(await f.$eval('#globalInput',e=>e.value)==='hi', w+' keyboard types into the chat box');
  ok((await p.$eval('#wk-target',e=>e.textContent)).includes('Chat'), w+' keyboard shows it is typing into Chat');
  if (out) await p.screenshot({path:`${out}-chat-${w}.png`});
  ok(typeof await p.evaluate(()=>typeof window.rvTranslateTo)==='string', w+' translation is offered to the chat');
  ok(errs.length===0, w+' no script errors '+JSON.stringify(errs));
  await p.close();
}
await b.close(); server.close(); console.log(fail?fail+' failed':'all passed'); process.exit(fail?1:0);
