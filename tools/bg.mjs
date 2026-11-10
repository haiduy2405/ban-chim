// Backgrounds: 7 themes x 4 layers (sky/far/mid/near), 1920x1080. far/mid/near tile horizontally (all periodic).
import { OL, OUT, renderSvg, svgDoc, saveWebp, lin, rad, mix, lighten, darken, rng } from './lib.mjs';
import fs from 'fs';
const W = 1920, H = 1080, TAU = Math.PI * 2;
const f1 = n => +n.toFixed(1);

// ---- periodic ridge helpers ----
const sinSum = (comps) => x => comps.reduce((s, [f, a, p]) => s + a * Math.sin(TAU * f * x / W + p), 0);
const mountFn = (y0, comps) => x => y0 - comps.reduce((s, [f, a, p]) => s + a * (1 - Math.abs(Math.sin(Math.PI * f * x / W + p))), 0);
const humpFn = (y0, humps) => x => y0 - humps.reduce((s, [cx, a, sg]) => s + [-1, 0, 1].reduce((q, k) => q + a * Math.exp(-(((x - cx - k * W) / sg) ** 2)), 0), 0);
const mesaFn = (y0, A, comps) => { const sm = t => t * t * (3 - 2 * t); const g = sinSum(comps); return x => y0 - A * sm(Math.max(0, Math.min(1, 1.8 * g(x) / A + .35))); };
function poly(fn, bottom = H, step = 6) {
  let d = `M0,${bottom} L0,${f1(fn(0))}`;
  for (let x = step; x <= W; x += step) d += ` L${x},${f1(fn(x))}`;
  return d + ` L${W},${bottom} Z`;
}
function line(fn, step = 6) { let d = `M0,${f1(fn(0))}`; for (let x = step; x <= W; x += step) d += ` L${x},${f1(fn(x))}`; return d; }
const wrap3 = (x, f) => [-W, 0, W].map(o => f(x + o)).join('');

// ---- tree / plant shapes (absolute coords) ----
function pine(x, base, h, o) {
  const n = 4, tw = h * .075, ol = o.ol, st = `stroke="${ol}" stroke-width="${o.sw || 2.4}" stroke-linejoin="round"`;
  let s = `<rect x="${f1(x - tw / 2)}" y="${f1(base - h * .17)}" width="${f1(tw)}" height="${f1(h * .17)}" fill="${o.trunk}" ${st}/>`;
  const top = base - h, th = h * .36;
  for (let i = n - 1; i >= 0; i--) {
    const yt = top + i * h * .185, yb = yt + th, w = h * (.24 + .1 * i);
    s += `<path d="M${f1(x)},${f1(yt)} L${f1(x + w / 2)},${f1(yb)} Q${f1(x)},${f1(yb - th * .14)} ${f1(x - w / 2)},${f1(yb)} Z" fill="${i % 2 ? o.c1 : o.c0}" ${st}/>`;
    const d = o.light || -1;
    s += `<path d="M${f1(x)},${f1(yt + 2)} L${f1(x + d * w / 2 * .92)},${f1(yb - 1)} Q${f1(x + d * w / 4)},${f1(yb - th * .13)} ${f1(x)},${f1(yb - th * .12)} Z" fill="${lighten(i % 2 ? o.c1 : o.c0, .16)}" opacity=".6"/>`;
    if (o.rim) s += `<path d="M${f1(x)},${f1(yt)} L${f1(x - d * w / 2)},${f1(yb)}" stroke="${o.rim}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
    if (o.snow) s += `<path d="M${f1(x)},${f1(yt - 1)} L${f1(x + w * .3)},${f1(yt + th * .58)} L${f1(x + w * .14)},${f1(yt + th * .5)} L${f1(x + w * .04)},${f1(yt + th * .72)} L${f1(x - w * .1)},${f1(yt + th * .5)} L${f1(x - w * .2)},${f1(yt + th * .68)} L${f1(x - w * .3)},${f1(yt + th * .58)} Z" fill="#f6fbff" stroke="${ol}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  return s;
}
const pineSil = (x, base, h, c) => { let s = ''; for (let i = 0; i < 3; i++) { const yt = base - h + i * h * .27, yb = yt + h * .42, w = h * (.3 + .13 * i); s += `<path d="M${f1(x)},${f1(yt)} L${f1(x + w / 2)},${f1(yb)} L${f1(x - w / 2)},${f1(yb)}Z" fill="${c}"/>`; } return s + `<rect x="${f1(x - 1.5)}" y="${f1(base - h * .1)}" width="3" height="${f1(h * .12)}" fill="${c}"/>`; };
function palm(x, base, h, lean, o) {
  const tx = x + lean, ty = base - h, cx = x + lean * .1, cy = base - h * .55;
  const q = `M${f1(x)},${f1(base)} Q${f1(cx)},${f1(cy)} ${f1(tx)},${f1(ty)}`;
  let s = `<path d="${q}" stroke="${o.ol}" stroke-width="19" fill="none" stroke-linecap="round"/><path d="${q}" stroke="${o.trunk}" stroke-width="13.5" fill="none" stroke-linecap="round"/><path d="${q}" stroke="${darken(o.trunk, .3)}" stroke-width="13.5" fill="none" stroke-dasharray="2.2 11" opacity=".85"/><path d="M${f1(x - 4)},${f1(base)} Q${f1(cx - 4)},${f1(cy)} ${f1(tx - 4)},${f1(ty)}" stroke="${lighten(o.trunk, .25)}" stroke-width="3" fill="none" opacity=".5"/>`;
  const angs = [200, 170, 140, 108, 72, 40, 10, -20];
  for (const a of angs) {
    const r = a * Math.PI / 180, l = h * .5 * (.85 + .15 * Math.abs(Math.cos(r)));
    const tipx = tx + Math.cos(r) * l, tipy = ty - Math.sin(r) * l * .55 + Math.abs(Math.cos(r)) * l * .42;
    const c1x = tx + Math.cos(r) * l * .55, c1y = ty - Math.sin(r) * l * .55 * .8 - 20;
    s += `<path d="M${f1(tx)},${f1(ty)} Q${f1(c1x)},${f1(c1y)} ${f1(tipx)},${f1(tipy)} Q${f1(c1x)},${f1(c1y + 26)} ${f1(tx)},${f1(ty)}Z" fill="${o.c0}" stroke="${o.ol}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${f1(tx)},${f1(ty)} Q${f1(c1x)},${f1(c1y + 10)} ${f1(tipx)},${f1(tipy)}" stroke="${lighten(o.c0, .3)}" stroke-width="2" fill="none" opacity=".8"/>`;
  }
  s += `<circle cx="${f1(tx - 5)}" cy="${f1(ty + 9)}" r="8" fill="#7a4a22" stroke="${o.ol}" stroke-width="2.2"/><circle cx="${f1(tx + 7)}" cy="${f1(ty + 11)}" r="8" fill="#8a5a2c" stroke="${o.ol}" stroke-width="2.2"/>`;
  return s;
}
function cactus(x, base, h, o) {
  const w = h * .2, tw = w * .85, aw = w * .6;
  const parts = [[`M${f1(x)},${f1(base)} L${f1(x)},${f1(base - h + tw / 2)}`, tw], [`M${f1(x)},${f1(base - h * .42)} L${f1(x - w * 1.9)},${f1(base - h * .42)} L${f1(x - w * 1.9)},${f1(base - h * .7)}`, aw], [`M${f1(x)},${f1(base - h * .3)} L${f1(x + w * 2.1)},${f1(base - h * .3)} L${f1(x + w * 2.1)},${f1(base - h * .58)}`, aw]];
  let s = parts.map(([d, sw]) => `<path d="${d}" stroke="${o.ol}" stroke-width="${f1(sw + 5)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  s += parts.map(([d, sw]) => `<path d="${d}" stroke="${o.c0}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  s += parts.map(([d, sw]) => `<path d="${d}" stroke="${lighten(o.c0, .25)}" stroke-width="${f1(sw * .28)}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f1(-sw * .2)},0)" opacity=".7"/><path d="${d}" stroke="${o.c1}" stroke-width="${f1(sw * .16)}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f1(sw * .24)},0)" opacity=".7"/>`).join('');
  s += `<circle cx="${f1(x)}" cy="${f1(base - h - 2)}" r="${f1(w * .22)}" fill="#ff7aa8" stroke="${o.ol}" stroke-width="1.6"/>`;
  return s;
}
const rock = (x, y, w, h, c, ol) => `<path d="M${f1(x - w)},${f1(y)} Q${f1(x - w * .9)},${f1(y - h)} ${f1(x - w * .2)},${f1(y - h * 1.05)} Q${f1(x + w * .7)},${f1(y - h)} ${f1(x + w)},${f1(y)} Z" fill="${c}" stroke="${ol}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${f1(x - w * .6)},${f1(y - h * .5)} Q${f1(x - w * .3)},${f1(y - h * .95)} ${f1(x)},${f1(y - h * .95)}" stroke="${lighten(c, .3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
const bush = (x, y, s, c, ol) => `<g stroke="${ol}" stroke-width="2.4"><ellipse cx="${f1(x - s * .5)}" cy="${f1(y - s * .35)}" rx="${f1(s * .6)}" ry="${f1(s * .4)}" fill="${c}"/><ellipse cx="${f1(x + s * .45)}" cy="${f1(y - s * .38)}" rx="${f1(s * .55)}" ry="${f1(s * .42)}" fill="${darken(c, .08)}"/><ellipse cx="${f1(x)}" cy="${f1(y - s * .55)}" rx="${f1(s * .62)}" ry="${f1(s * .46)}" fill="${lighten(c, .06)}"/></g>`;

// ---- theme data ----
const TH = {
  rung: { sky: [[0, '#3aa6f0'], [.55, '#9fdcff'], [.8, '#ffe3b3'], [1, '#ffd08a']], orb: { x: .8, y: .2, r: 60, core: '#fff8d8', g1: 'rgba(255,240,170,.6)' }, far: ['#8fb4d2', '#6a92b5'], mid: ['#5c9a52', '#3f7a3c'], midSil: '#2f6a34', trees: 'pine', c0: '#2a7a38', c1: '#1f5f2c', trunk: '#5a3a22', ground: ['#4f9a3f', '#2a5f24'], tufts: '#2f7a2c', cnt: 13, ol: '#23331c', bush: '#3a8a3a' },
  bien: { sky: [[0, '#3b3f9a'], [.4, '#ff7e5f'], [.75, '#ffc27a'], [1, '#ffe3b0']], orb: { x: .28, y: .5, r: 70, core: '#fff1c9', g1: 'rgba(255,170,100,.55)' }, far: ['#7a5aa0', '#5a4382'], mid: ['#e0708a', '#4a3a8a'], trees: 'palm', c0: '#3aa850', c1: '#237a34', trunk: '#8a5a30', ground: ['#f4d9a0', '#c9a566'], tufts: '#3a8a40', cnt: 6, ol: '#3b2417' },
  samac: { sky: [[0, '#4aa3e0'], [.5, '#bfe3f5'], [.8, '#ffe6b0'], [1, '#ffd08a']], orb: { x: .78, y: .18, r: 64, core: '#fffbe0', g1: 'rgba(255,245,190,.7)' }, far: ['#ecc088', '#d9a263'], mid: ['#e8b068', '#c98a4b'], trees: 'cactus', c0: '#3a9a5c', c1: '#2a7a46', trunk: '#2e7d4f', ground: ['#dcaa62', '#a8763a'], tufts: '#b98443', cnt: 9, ol: '#4a2a14' },
  suong: { sky: [[0, '#7f98a0'], [.55, '#b9ccce'], [.85, '#dfe8e2'], [1, '#e8eee4']], orb: { x: .8, y: .22, r: 44, core: '#f6f9ee', g1: 'rgba(240,246,225,.4)' }, far: ['#a9bec2', '#8aa3a9'], mid: ['#7d9a8a', '#5a7a6a'], midSil: '#4a6a5a', trees: 'pine', c0: '#3a6a52', c1: '#2c5440', trunk: '#4a3a2c', ground: ['#4a7a58', '#2a4a34'], tufts: '#3a6a48', cnt: 13, ol: '#1c3026', bush: '#4a7a5a', fog: true },
  tuyet: { sky: [[0, '#8fb0d8'], [.6, '#dbe8f6'], [1, '#f4f8fc']], orb: { x: .75, y: .22, r: 46, core: '#ffffff', g1: 'rgba(235,245,255,.5)' }, far: ['#cbdaee', '#a3b8d4'], mid: ['#e8f1fb', '#a9bdd8'], midSil: '#6a8aaa', trees: 'snowpine', c0: '#2f6b4a', c1: '#27593d', trunk: '#4a3a30', ground: ['#f8fbff', '#c3d3e8'], tufts: '#ffffff', cnt: 13, ol: '#2a3a4a', snow: true },
  bao: { sky: [[0, '#10141e'], [.5, '#262e3e'], [1, '#434d60']], orb: null, clouds: true, far: ['#2e3646', '#232a38'], mid: ['#212836', '#161b26'], midSil: '#10141c', trees: 'pine', c0: '#1a2230', c1: '#141a26', trunk: '#10141a', ground: ['#1c2430', '#0c1016'], tufts: '#141c28', cnt: 13, ol: '#07090d', rim: '#46526a' },
  dem: { sky: [[0, '#040815'], [.6, '#14224a'], [1, '#2c3a6e']], orb: { x: .78, y: .2, r: 50, core: '#f3f1dc', g1: 'rgba(200,210,255,.3)', moon: true }, stars: true, far: ['#243668', '#17254b'], mid: ['#182a54', '#0f1a35'], midSil: '#0c1630', trees: 'pine', c0: '#12343a', c1: '#0e2a30', trunk: '#161620', ground: ['#14283a', '#08121c'], tufts: '#183a4a', cnt: 13, ol: '#050a14', rim: '#4a6aa0' },
};

function skySvg(t, key) {
  const R = rng(key.length * 977 + 5);
  let defs = lin('sk', t.sky.map(([o, c]) => [o, c])), s = `<rect width="${W}" height="${H}" fill="url(#sk)"/>`;
  if (t.stars) {
    for (let i = 0; i < 210; i++) { const x = R() * W, y = Math.pow(R(), 1.3) * H * .72, r = .6 + R() * 1.5; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#fff" opacity="${f1(.35 + R() * .65)}"/>`; }
    for (let i = 0; i < 12; i++) { const x = R() * W, y = R() * H * .5, r = 4 + R() * 4; s += `<path d="M${f1(x - r)},${f1(y)} L${f1(x + r)},${f1(y)} M${f1(x)},${f1(y - r)} L${f1(x)},${f1(y + r)}" stroke="#fff" stroke-width="1.3" opacity=".7" stroke-linecap="round"/>`; }
  }
  if (t.clouds) {
    defs += `<filter id="bl" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>`;
    const cols = ['#1a2030', '#252d3d', '#323c50', '#46526a'];
    s += `<g filter="url(#bl)">`;
    for (let layer = 0; layer < 4; layer++) for (let i = 0; i < 22; i++) { const x = R() * W, y = (layer * .13 + R() * .14) * H, rx = 140 + R() * 220, ry = 40 + R() * 70; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${cols[3 - layer]}" opacity="${f1(.4 + R() * .3)}"/>`; }
    s += `</g>`;
  }
  if (t.orb) {
    const o = t.orb, ox = o.x * W, oy = o.y * H, r = o.r * 1.35;
    defs += rad('og', [[0, o.core, .95], [.12, o.g1, .75], [.4, o.g1, .2], [1, o.g1, 0]]);
    s += `<circle cx="${f1(ox)}" cy="${f1(oy)}" r="${f1(r * 5)}" fill="url(#og)"/>`;
    if (o.moon) {
      defs += `<clipPath id="mc"><circle cx="${f1(ox)}" cy="${f1(oy)}" r="${f1(r)}"/></clipPath>`;
      s += `<circle cx="${f1(ox)}" cy="${f1(oy)}" r="${f1(r)}" fill="${o.core}"/><g clip-path="url(#mc)" fill="#cfcdb4" opacity=".55"><circle cx="${f1(ox - r * .3)}" cy="${f1(oy - r * .25)}" r="${f1(r * .22)}"/><circle cx="${f1(ox + r * .35)}" cy="${f1(oy + r * .2)}" r="${f1(r * .3)}"/><circle cx="${f1(ox - r * .15)}" cy="${f1(oy + r * .5)}" r="${f1(r * .14)}"/><circle cx="${f1(ox + r * .5)}" cy="${f1(oy - r * .45)}" r="${f1(r * .12)}"/></g>`;
    } else s += `<circle cx="${f1(ox)}" cy="${f1(oy)}" r="${f1(r)}" fill="${o.core}"/>`;
  }
  return svgDoc(W, H, s, defs);
}

function farSvg(t, key) {
  const R = rng(key.length * 31 + 11);
  let defs = lin('fg', [[0, t.far[0]], [1, t.far[1]]]), s = '';
  const amp = key === 'tuyet' ? 1.25 : 1;
  if (key === 'bien') {
    const fn = humpFn(.665 * H, [[300, 70, 120], [520, 36, 60], [1130, 52, 90], [1400, 90, 150], [1720, 40, 70]]);
    defs += lin('sea', [[0, '#f09a7a'], [.2, '#b0608a'], [1, '#5a3a7a']]);
    s += `<path d="${poly(fn)}" fill="url(#fg)"/><rect x="0" y="${f1(.665 * H)}" width="${W}" height="${H}" fill="url(#sea)"/><path d="M0,${f1(.665 * H)} H${W}" stroke="#ffd0a0" stroke-width="3" opacity=".6"/>`;
    s += `<path d="${poly(fn)}" fill="${t.far[0]}"/>`;
    s += `<rect x="0" y="${f1(.665 * H)}" width="${W}" height="${H}" fill="url(#sea)"/>`;
  } else if (key === 'samac') {
    const fn = mesaFn(.69 * H, 70, [[3, 40, .4], [5, 28, 1.3], [8, 14, 2.4]]), fn2 = mesaFn(.7 * H, 50, [[4, 36, 2.1], [7, 24, .2], [11, 12, 1]]);
    s += `<path d="${poly(fn2)}" fill="${mix(t.far[0], '#ffffff', .25)}" opacity=".8"/><path d="${poly(fn)}" fill="url(#fg)"/><path d="${line(fn)}" stroke="${lighten(t.far[0], .35)}" stroke-width="3" fill="none" opacity=".7"/>`;
  } else {
    const a = key === 'tuyet' ? [[3, 62, .3], [7, 34, 1.7], [13, 16, 2.5]] : [[3, 48, .3], [7, 28, 1.7], [13, 14, 2.5]];
    const back = mountFn(.675 * H, a.map(([f, v, p]) => [f + 1, v * 1.05, p + 2])), fn = mountFn(.69 * H, a);
    s += `<path d="${poly(back)}" fill="${mix(t.far[0], '#ffffff', key === 'bao' || key === 'dem' ? 0 : .3)}" opacity=".75"/><path d="${poly(fn)}" fill="url(#fg)"/>`;
    // sun-side highlight along ridge
    s += `<path d="${line(fn)}" stroke="${lighten(t.far[0], .3)}" stroke-width="3" fill="none" opacity=".55"/>`;
    if (key === 'tuyet') {
      const base = .685 * H;
      const cap = x => Math.max(0, base - fn(x)) * .62 + 5 * Math.abs(Math.sin(TAU * 37 * x / W));
      let d = `M0,${f1(fn(0))}`; for (let x = 6; x <= W; x += 6) d += ` L${x},${f1(fn(x))}`;
      for (let x = W; x >= 0; x -= 6) d += ` L${x},${f1(fn(x) + cap(x))}`;
      s += `<path d="${d} Z" fill="#fafdff"/><path d="${d} Z" fill="url(#fg)" opacity=".18"/>`;
    }
    if (key === 'rung' || key === 'suong' || key === 'dem' || key === 'bao') for (let i = 0; i < 60; i++) { const x = R() * W, h = 30 + R() * 28; s += wrap3(x, xx => pineSil(xx, fn(((xx % W) + W) % W) + 6, h, darken(t.far[1], .1))); }
  }
  if (t.fog) { defs += lin('fo', [[.55, '#e8eee4', 0], [.7, '#e8eee4', .55], [1, '#e8eee4', .9]]); s += `<rect y="${f1(.55 * H)}" width="${W}" height="${f1(.45 * H)}" fill="url(#fo)"/>`; }
  return svgDoc(W, H, s, defs);
}

function midSvg(t, key) {
  const R = rng(key.length * 53 + 3);
  let defs = lin('mg', [[0, t.mid[0]], [1, t.mid[1]]]), s = '';
  if (key === 'bien') {
    const fn = sinSum([[9, 4, 0], [23, 2.5, 1.3]]); const y = x => .765 * H + fn(x);
    s += `<path d="${poly(y)}" fill="url(#mg)"/><path d="${line(y)}" stroke="#ffc9a0" stroke-width="3" fill="none" opacity=".8"/>`;
    for (let i = 0; i < 90; i++) { const x = R() * W, yy = (.79 + R() * .2) * H, l = 30 + R() * 80, k = (yy / H - .77) * 3; s += wrap3(x, xx => `<path d="M${f1(xx)},${f1(yy)} q${f1(l / 2)},-6 ${f1(l)},0" stroke="${k < .3 ? '#ffd9b0' : '#9a7ac0'}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${f1(.5 - k * .3)}"/>`); }
  } else {
    const comps = key === 'samac' ? [[2, 26, .4], [5, 10, 2], [9, 4, 1]] : [[2, 20, .4], [5, 11, 2.2], [11, 5, 1]];
    const fn = x => .765 * H + sinSum(comps)(x);
    s += `<path d="${poly(fn)}" fill="url(#mg)"/><path d="${line(fn)}" stroke="${lighten(t.mid[0], .3)}" stroke-width="3.5" fill="none" opacity=".65"/>`;
    if (key === 'samac') for (let i = 0; i < 14; i++) { const x = R() * W, y = fn(x) + 24 + R() * 80; s += wrap3(x, xx => `<path d="M${f1(xx)},${f1(y)} q40,-8 90,0" stroke="${darken(t.mid[1], .15)}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".35"/>`); }
    if (t.midSil) for (let i = 0; i < 48; i++) { const x = R() * W, h = 44 + R() * 40; s += wrap3(x, xx => pineSil(xx, fn(((xx % W) + W) % W) + 6, h, t.midSil)); }
    if (key === 'tuyet') s += `<path d="${line(fn)}" stroke="#ffffff" stroke-width="7" fill="none" opacity=".8"/>`;
  }
  if (t.fog) { defs += lin('fo', [[.75, '#e4ece6', 0], [1, '#e4ece6', .85]]); s += `<rect y="${f1(.74 * H)}" width="${W}" height="${f1(.26 * H)}" fill="url(#fo)"/>`; }
  return svgDoc(W, H, s, defs);
}

function nearSvg(t, key) {
  const R = rng(key.length * 101 + 7);
  const gfn = x => .872 * H + sinSum([[6, 5, .7], [17, 2.5, 2]])(x);
  let defs = lin('gg', [[0, t.ground[0]], [1, t.ground[1]]]), s = '';
  s += `<path d="${poly(gfn)}" fill="url(#gg)"/><path d="${line(gfn)}" stroke="${t.ol}" stroke-width="3" fill="none"/><path d="${line(x => gfn(x) + 5)}" stroke="${lighten(t.ground[0], .25)}" stroke-width="3" fill="none" opacity=".6"/>`;
  if (key === 'tuyet') s += `<path d="${line(x => gfn(x) + 26)}" stroke="#9fb6d4" stroke-width="5" fill="none" opacity=".35"/>`;
  const items = [];
  for (let i = 0; i < t.cnt; i++) items.push({ x: (i + .15 + R() * .7) * W / t.cnt, base: .9 * H + (R() * 12 - 3), s: .75 + R() * .55 });
  let body = '';
  for (const it of items) {
    if (t.trees === 'palm') { const h = 190 + R() * 60, lean = (R() < .5 ? -1 : 1) * (30 + R() * 60); body += wrap3(it.x, xx => palm(xx, it.base, h, lean, t)); }
    else if (t.trees === 'cactus') { const h = 110 + R() * 110; body += wrap3(it.x, xx => cactus(xx, it.base, h, t)); }
    else { const h = (t.snow ? 190 : 170) + R() * 110; body += wrap3(it.x, xx => pine(xx, it.base, h, { ...t, light: R() < .5 ? -1 : 1 })); }
  }
  // fillers between trees
  const F = rng(key.length * 7 + 1);
  for (let i = 0; i < 9; i++) {
    const x = F() * W, y = .93 * H + F() * 20;
    if (t.trees === 'cactus') body += wrap3(x, xx => rock(xx, y, 26 + F() * 22, 20 + F() * 14, '#b98a58', t.ol));
    else if (key === 'tuyet') body += wrap3(x, xx => rock(xx, y, 30 + F() * 30, 20 + F() * 12, '#f4f9ff', t.ol));
    else if (t.trees === 'palm') body += wrap3(x, xx => bush(xx, y, 30 + F() * 20, '#2f9a48', t.ol));
    else body += wrap3(x, xx => bush(xx, y, 34 + F() * 26, t.bush || t.c0, t.ol));
  }
  s += body;
  // foreground tufts along the ground edge
  for (let i = 0; i < 70; i++) { const x = R() * W, y = gfn(x) + 10 + R() * 70, h = 10 + R() * 14; s += wrap3(x, xx => `<path d="M${f1(xx - 5)},${f1(y)} L${f1(xx - 3)},${f1(y - h)} L${f1(xx)},${f1(y - h * .5)} L${f1(xx + 3)},${f1(y - h * 1.1)} L${f1(xx + 5)},${f1(y)}Z" fill="${t.tufts}" stroke="${t.ol}" stroke-width="1.4" stroke-linejoin="round" opacity=".95"/>`); }
  if (t.fog) { defs += lin('fo', [[.82, '#dfe8e2', 0], [1, '#dfe8e2', .4]]); s += `<rect y="${f1(.8 * H)}" width="${W}" height="${f1(.2 * H)}" fill="url(#fo)"/>`; }
  return svgDoc(W, H, s, defs);
}

export async function buildBg(browser) {
  const manifest = {};
  for (const key of Object.keys(TH)) {
    const t = TH[key];
    const layers = { sky: skySvg, far: farSvg, mid: midSvg, near: nearSvg };
    for (const [ln, fn] of Object.entries(layers)) {
      const buf = await renderSvg(browser, fn(t, key), W, H, 1);
      await saveWebp(buf, OUT('bg', `${key}_${ln}.webp`), 82);
      manifest[`${key}_${ln}`] = { file: `bg/${key}_${ln}.webp`, width: W, height: H, tile: ln !== 'sky', opaque: ln === 'sky' };
    }
    console.log('bg', key);
  }
  fs.writeFileSync(OUT('bg', 'manifest.json'), JSON.stringify(manifest, null, 2));
}
