// node tools/previews.mjs <bundleDir> <outDir> [ids,...] — видео-превью блоков 432×768 без звука одним браузером
import {renderMedia, selectComposition, openBrowser, getCompositions} from '@remotion/renderer';
import fs from 'node:fs';
const [bundle, out, only] = process.argv.slice(2);
const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions: {gl: 'swangle'}});
const ids = only ? only.split(',') : (await getCompositions(bundle, {puppeteerInstance: browser, browserExecutable: exe})).map((c) => c.id);
fs.mkdirSync(out, {recursive: true});
for (const id of ids) {
  const file = `${out}/${id.replace(/^P-/, '')}.mp4`;
  if (fs.existsSync(file)) { console.log('skip', id); continue; }
  const t = Date.now();
  try {
    const composition = await selectComposition({serveUrl: bundle, id, puppeteerInstance: browser, browserExecutable: exe});
    await renderMedia({composition, serveUrl: bundle, codec: 'h264', crf: 24, outputLocation: file, scale: 0.4, muted: true, concurrency: 2, puppeteerInstance: browser, browserExecutable: exe, chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 120000});
    console.log('ok', id, ((Date.now() - t) / 1000).toFixed(0) + 's');
  } catch (e) { console.log('ERR', id, String(e.message || e).split('\n')[0]); }
}
await browser.close({silent: true});
