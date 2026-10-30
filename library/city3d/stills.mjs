// node work/stills.mjs 165 300 ... → work/st/fNNN.png (один бандл, один браузер)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const frames = process.argv.slice(2).map(Number);
const BROWSER = fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium_headless_shell')).map(d=>`/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`).find(f=>fs.existsSync(f));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const SH = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const browser = await openBrowser('chrome', {browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}});
const comp = await selectComposition({serveUrl, inputProps: SH, id: process.env.COMP || 'Reel', puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
fs.mkdirSync('work/st', {recursive: true});
for (const f of frames) {
  const t0 = Date.now();
  await renderStill({serveUrl, composition: comp, inputProps: SH, frame: f, output: `work/st/f${String(f).padStart(4,'0')}.png`, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 120000});
  console.log('frame', f, (Date.now()-t0)/1000+'s');
}
await browser.close({silent: true});
