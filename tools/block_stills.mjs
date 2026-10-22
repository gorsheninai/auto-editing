// node tools/stills.mjs <bundleDir> <outDir> <ids,...> [fractions] — стоп-кадры композиций одним браузером
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
const [bundle, out, ids, fr = '0.35,0.8'] = process.argv.slice(2);
const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const inputProps = process.env.PASSPORT ? {passport: JSON.parse(process.env.PASSPORT)} : {};
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions: {gl: 'swangle'}});
for (const id of ids.split(',')) {
  try {
    const comp = await selectComposition({serveUrl: bundle, id, inputProps, puppeteerInstance: browser, browserExecutable: exe});
    for (const q of fr.split(',').map(Number)) {
      const frame = Math.min(comp.durationInFrames - 1, Math.round(comp.durationInFrames * q));
      await renderStill({composition: comp, inputProps, serveUrl: bundle, output: `${out}/${process.env.TAG||''}${id}_${Math.round(q * 100)}.png`, frame, puppeteerInstance: browser, scale: 0.4, browserExecutable: exe});
    }
    console.log('ok', id);
  } catch (e) { console.log('ERR', id, String(e.message || e).split('\n')[0]); }
}
await browser.close({silent: true});
