// Builds assets/preview.html (contact sheet) and screenshots it to assets/preview.png
import { withBrowser, OUT } from './lib.mjs';
import fs from 'fs';
const man = JSON.parse(fs.readFileSync(OUT('birds', 'manifest.json')));
const TH = ['rung', 'bien', 'samac', 'suong', 'tuyet', 'bao', 'dem'];
const strip = (t, px) => { const m = man[t], sc = px / m.cellW; return `<div class="cell"><div class="spr" style="width:${px}px;height:${m.cellH * sc}px;background:url(birds/${t}.webp) 0 0/${m.cellW * 7 * sc}px ${m.cellH * sc}px"></div><span>${t}</span></div>`; };
const frames = (t, px) => [0, 2, 3, 6].map(i => { const m = man[t], sc = px / m.cellW; return `<div class="spr" style="width:${px}px;height:${m.cellH * sc}px;background:url(birds/${t}.webp) ${-i * px}px 0/${m.cellW * 7 * sc}px ${m.cellH * sc}px"></div>`; }).join('');
let h = `<!doctype html><meta charset=utf-8><title>Bắn Chim assets preview</title><style>body{margin:0;padding:16px;background:#7fc4ee;font:12px sans-serif;width:1568px}h2{margin:14px 0 6px}.row{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}.cell{text-align:center}.spr{display:block}.bgc{position:relative;width:380px;height:214px;overflow:hidden;border-radius:6px}.bgc img{position:absolute;inset:0;width:100%;height:100%}.g{background:#8fb7d8;border-radius:6px}.dark{background:#333;padding:6px;border-radius:6px}</style>`;
h += `<h2>Birds — frames 0,2,3 (flap) + 6 (dead), 128px</h2><div class=row>`;
for (const t of Object.keys(man)) h += `<div class="dark" style="background:#8ec9f0"><div class=row style="gap:0">${frames(t, t.startsWith('boss') ? 150 : 128)}</div>${t}</div>`;
h += `</div><h2>Birds at game size (~60px wide cell → r≈11; and 96px), frame 0</h2><div class=row>`;
for (const t of Object.keys(man)) if (!t.startsWith('boss')) h += strip(t, 96) ;
for (const t of Object.keys(man)) if (!t.startsWith('boss')) h += strip(t, 60) ;
h += `</div><h2>Backgrounds (sky+far+mid+near composite)</h2><div class=row>`;
for (const t of TH) h += `<div class=bgc>${['sky', 'far', 'mid', 'near'].map(l => `<img src="bg/${t}_${l}.webp">`).join('')}</div>`;
h += `</div><h2>Guns</h2><div class=row>${['pistol', 'rifle', 'smg', 'shotgun', 'sniper', 'launcher'].map(g => `<div class=g><img src="guns/${g}.png" width=250></div>`).join('')}</div>`;
h += `<h2>FX</h2><div class=row>${[1, 2, 3].map(i => `<img src="fx/cloud${i}.png" width=200>`).join('')}<img src="fx/feather1.png"><img src="fx/feather2.png"><img src="fx/egg.png"><img src="fx/coin.png" width=80><img src="fx/gem.png" width=80></div><div class=row style="margin-top:6px"><div class=g><img src="fx/explosion.png" width=1152></div><div class=g><img src="fx/muzzle.png" width=380></div></div>`;
h += `<h2>Birds (live loop)</h2><style>@keyframes fl{to{background-position-x:-576px}}</style><div class=row>${Object.keys(man).filter(t => !t.startsWith('boss')).map(t => `<div class=spr style="width:96px;height:72px;background:url(birds/${t}.webp) 0 0/672px 72px;animation:fl .5s steps(6) infinite"></div>`).join('')}</div>`;
fs.writeFileSync(OUT('preview.html'), h);
await withBrowser(async b => {
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })).newPage();
  await p.goto('file://' + OUT('preview.html')); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT('preview.png'), fullPage: true });
});
console.log('preview done');
