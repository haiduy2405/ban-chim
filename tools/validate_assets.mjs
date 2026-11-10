// Validate the asset set: node tools/validate_assets.mjs  (exit 1 on failure)
import { sharp, OUT } from './lib.mjs';
import fs from 'fs';
const fails = [], ok = [];
const chk = (c, m) => (c ? ok : fails).push(m);
const THEMES = ['rung', 'bien', 'samac', 'suong', 'tuyet', 'bao', 'dem'], LAYERS = ['sky', 'far', 'mid', 'near'];
const BIRDS = ['normal', 'fast', 'gold', 'civ', 'dodge', 'crate', 'swoop', 'heavy', 'bat', 'boss1', 'boss2'];
const raw = async f => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
let total = 0, bgTotal = 0;
const size = f => fs.statSync(f).size;

// birds
const man = JSON.parse(fs.readFileSync(OUT('birds', 'manifest.json')));
for (const t of BIRDS) {
  const m = man[t]; chk(!!m, `birds manifest has ${t}`); if (!m) continue;
  const f = OUT(m.file.replace(/^/, '')); chk(fs.existsSync(f), `bird file ${t}`); if (!fs.existsSync(f)) continue;
  total += size(f);
  const boss = t.startsWith('boss'), cw = boss ? 512 : 256, ch = boss ? 384 : 192;
  chk(m.frames === 6 && m.dead === 1 && m.cellW === cw && m.cellH === ch && m.r === (boss ? 96 : 48), `bird manifest values ${t}`);
  const { data, w, h } = await raw(f);
  chk(w === cw * 7 && h === ch, `bird strip size ${t} (${w}x${h})`);
  const frames = [];
  for (let i = 0; i < 7; i++) {
    let cnt = 0; const sig = [];
    for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) { const a = data[((y * w) + i * cw + x) * 4 + 3]; if (a > 128) cnt++; sig.push(a > 128 ? 1 : 0); }
    frames.push(sig);
    const cA = data[((ch / 2) * w + i * cw + cw / 2) * 4 + 3];
    chk(cnt > 400 && cA === 255, `bird ${t} frame ${i} has opaque body at centre (${cnt} px)`);
  }
  const diff = (a, b) => a.reduce((s, v, k) => s + (v !== b[k] ? 1 : 0), 0);
  chk(diff(frames[0], frames[3]) > 300, `bird ${t} wing frames differ`);
  chk(diff(frames[3], frames[6]) > 20, `bird ${t} dead frame differs`);
}
// backgrounds
const bm = JSON.parse(fs.readFileSync(OUT('bg', 'manifest.json')));
for (const th of THEMES) for (const ly of LAYERS) {
  const f = OUT('bg', `${th}_${ly}.webp`); chk(fs.existsSync(f), `bg exists ${th}_${ly}`); if (!fs.existsSync(f)) continue;
  chk(!!bm[`${th}_${ly}`], `bg manifest ${th}_${ly}`);
  const s = size(f); total += s; bgTotal += s;
  const { data, w, h } = await raw(f); chk(w === 1920 && h === 1080, `bg dims ${th}_${ly}`);
  const A = (x, y) => data[(y * w + x) * 4 + 3];
  if (ly === 'sky') { let min = 255; for (let y = 0; y < h; y += 9) for (let x = 0; x < w; x += 9) min = Math.min(min, A(x, y)); chk(min === 255, `sky opaque ${th}`); continue; }
  let any = 0, band = 0, bandN = 0;
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const a = A(x, y); if (a > 40) any++; if (y > h * .10 && y < h * .60) { bandN++; if (a > 40) band++; } }
  chk(any > 2000, `${th}_${ly} has content`); chk(band / bandN < .03, `${th}_${ly} keeps 10-60% band empty (${(100 * band / bandN).toFixed(2)}%)`);
  const col = x => { const o = []; for (let y = 0; y < h; y++) { const i = (y * w + x) * 4, a = data[i + 3] / 255; o.push(data[i] * a, data[i + 1] * a, data[i + 2] * a, data[i + 3]); } return o; };
  const d = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
  const seam = d(col(w - 1), col(0)), nb = Math.max(d(col(100), col(101)), d(col(0), col(1)), d(col(w - 2), col(w - 1)));
  chk(seam <= nb * 1.6 + 2.5, `${th}_${ly} tiles seamlessly (seam ${seam.toFixed(2)} vs neighbour ${nb.toFixed(2)})`);
}
chk(bgTotal < 10e6, `bg folder size ${(bgTotal / 1e6).toFixed(2)} MB < 10 MB`);
// guns
for (const g of ['pistol', 'rifle', 'smg', 'shotgun', 'sniper', 'launcher']) {
  const f = OUT('guns', `${g}.png`); chk(fs.existsSync(f), `gun ${g}`); if (!fs.existsSync(f)) continue; total += size(f);
  const { data, w, h } = await raw(f); let tr = 0, op = 0; for (let i = 3; i < data.length; i += 16) { if (data[i] === 0) tr++; else op++; }
  chk(w === 512 && h === 256 && tr > 1000 && op > 1000, `gun ${g} 512x256 w/ alpha`);
}
// fx
const FX = { 'cloud1.png': [512, 256], 'cloud2.png': [512, 256], 'cloud3.png': [512, 256], 'feather1.png': [96, 96], 'feather2.png': [96, 96], 'egg.png': [64, 80], 'explosion.png': [1536, 192], 'muzzle.png': [512, 128], 'coin.png': [128, 128], 'gem.png': [128, 128] };
for (const [n, [fw, fh]] of Object.entries(FX)) {
  const f = OUT('fx', n); chk(fs.existsSync(f), `fx ${n}`); if (!fs.existsSync(f)) continue; total += size(f);
  const { data, w, h } = await raw(f); let tr = 0; for (let i = 3; i < data.length; i += 16) if (data[i] === 0) tr++;
  chk(w === fw && h === fh && tr > 20, `fx ${n} ${fw}x${fh} alpha`);
}
chk(total < 14e6, `total ${(total / 1e6).toFixed(2)} MB`);
for (const m of fails) console.log('FAIL', m);
console.log(`${ok.length} passed, ${fails.length} failed. total size ${(total / 1e6).toFixed(2)} MB`);
process.exit(fails.length ? 1 : 0);
