// node work/stills.mjs out_dir f1 f2 ... — один бандл, много стоп-кадров композиции Reel
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'fs'; import path from 'path'; import {execSync} from 'child_process';
const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = execSync('ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell | tail -1').toString().trim();
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'swangle'};
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'Reel', puppeteerInstance: browser, chromiumOptions});
for (const fr of frames) {
  const t = Date.now();
  await renderStill({composition, serveUrl, frame: Number(fr), output: `${outDir}/f${String(fr).padStart(4, '0')}.png`, puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 120000});
  console.log(fr, ((Date.now() - t) / 1000).toFixed(1) + 's');
}
await browser.close({silent: true});
