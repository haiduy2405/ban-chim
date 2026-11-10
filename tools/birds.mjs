// Bird sprite strips. All art is authored in a 256x192 cell (r=48); bosses are rasterized at 2x (512x384).
import { OL, OUT, renderSvg, svgDoc, saveWebp, lin, rad, mix, lighten, darken } from './lib.mjs';
import fs from 'fs';
const OW = 2.6, CX = 128, CY = 96, R = 48;
const BODY = { rx: 1.1 * R, ry: 0.72 * R };
const HEAD = { x: CX + 0.95 * R, y: CY - 0.38 * R, r: 0.45 * R };
const f1 = n => +n.toFixed(2);

function wingPath(L, Wd, scal = 1, deep = 1) {
  const tips = [[-Wd * .22, -L * .92], [-Wd * .6, -L * .7], [-Wd * .85, -L * .46], [-Wd * .8, -L * .2]];
  let p = `M0,0 C${f1(Wd * .5)},${f1(-L * .15)} ${f1(Wd * .75)},${f1(-L * .6)} ${f1(Wd * .15)},${f1(-L)}`;
  let prev = [Wd * .15, -L], valleys = [];
  for (const t of tips) {
    const c = [(prev[0] + t[0]) / 2 + Wd * .13 * deep, (prev[1] + t[1]) / 2 + L * .05 * deep];
    p += ` Q${f1(c[0])},${f1(c[1])} ${f1(t[0])},${f1(t[1])}`;
    valleys.push([.25 * prev[0] + .5 * c[0] + .25 * t[0], .25 * prev[1] + .5 * c[1] + .25 * t[1]]);
    prev = t;
  }
  p += ` L${f1(-Wd * .3)},${f1(-L * .04)} Z`;
  return { d: p, tips: [[Wd * .15, -L], ...tips], valleys };
}

function wingSvg(id, pal, sx, sy, theta, L, Wd, o = {}) {
  const w = wingPath(L, Wd, 1, o.deep || 1);
  const col = o.far ? darken(pal.wing, .25) : pal.wing, colD = o.far ? darken(pal.wingD, .25) : pal.wingD;
  const inner = wingPath(L * .55, Wd * .8, 1, .6);
  let s = `<g transform="translate(${sx},${sy}) rotate(${f1(theta)})">`;
  s += `<path d="${w.d}" fill="url(#${id}wg${o.far ? 'f' : 'n'})" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/>`;
  if (!o.bat) {
    s += `<path d="${inner.d}" fill="${o.far ? col : lighten(pal.wing, .18)}" opacity=".85" transform="translate(${f1(-Wd * .05)},${f1(-L * .02)})"/>`;
    for (const v of w.valleys.slice(0, 3)) s += `<path d="M${f1(Wd * .05)},${f1(-L * .3)} L${f1(v[0])},${f1(v[1])}" stroke="${OL}" stroke-opacity=".45" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  } else {
    for (const t of w.tips) s += `<path d="M0,0 L${f1(t[0])},${f1(t[1])}" stroke="${darken(pal.wingD, .5)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M0,0 C${f1(Wd * .5)},${f1(-L * .15)} ${f1(Wd * .75)},${f1(-L * .6)} ${f1(Wd * .15)},${f1(-L)}" stroke="${OL}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }
  s += `</g>`;
  return { svg: s, defs: lin(`${id}wg${o.far ? 'f' : 'n'}`, [[0, col], [.55, col], [1, colD]], 0, 1, 0, 0) };
}

// ---------- per-type definitions ----------
const T = {
  normal: { body: '#a8713f', belly: '#ecd2a2', wing: '#8a5530', wingD: '#5e3820', beak: '#f0b04a', fps: 12 },
  fast: { body: '#3f8be0', belly: '#d6ecff', wing: '#2757b3', wingD: '#173b82', beak: '#2f3350', tail: 'fork', L: 74, Wd: 26, fps: 16 },
  gold: { body: '#f7bf1b', belly: '#ffe680', wing: '#e8a10c', wingD: '#c27a05', beak: '#ff8a1f', flat: true, fps: 14 },
  civ: { body: '#fbfbf8', belly: '#ffffff', wing: '#e2e8f0', wingD: '#b4c0d2', beak: '#f29b5c', fps: 10 },
  dodge: { body: '#22b8aa', belly: '#c4f4ec', wing: '#11877f', wingD: '#0a5c58', beak: '#ffc83a', fps: 14 },
  crate: { body: '#f2902a', belly: '#ffd49a', wing: '#cf6d12', wingD: '#96480a', beak: '#ffd23a', fps: 10 },
  swoop: { body: '#cf3a24', belly: '#f6cfa5', wing: '#a82614', wingD: '#701508', beak: '#f5c542', tail: 'point', L: 78, Wd: 24, fps: 14 },
  heavy: { body: '#7f8b99', belly: '#c3cbd4', wing: '#5f6b79', wingD: '#3b4551', beak: '#e9b83a', L: 70, Wd: 32, fps: 9 },
  bat: { body: '#6a3d9e', belly: '#a97fd1', wing: '#4d2b7c', wingD: '#2c1550', beak: '#8e5cc4', tail: 'bat', bat: true, L: 78, Wd: 40, fps: 14 },
  boss1: { body: '#6a4225', belly: '#b98a55', wing: '#52311a', wingD: '#2f1a0c', headC: '#f7f4ea', beak: '#f3b11a', L: 80, Wd: 36, boss: true, fps: 8 },
  boss2: { body: '#7b3db5', belly: '#c9a3ee', wing: '#5a2a8c', wingD: '#35145c', beak: '#f0b72a', tail: 'plume', L: 80, Wd: 36, boss: true, fps: 8 },
};

function tailSvg(id, pal, kind, b) {
  const c = pal.wingD;
  let d;
  if (kind === 'fork') d = `M92,86 Q66,80 44,${70 + b} Q60,92 72,96 Q60,100 44,${122 + b} Q70,112 92,106 Z`;
  else if (kind === 'point') d = `M92,86 Q64,86 46,${96 + b} Q64,102 92,106 Z`;
  else if (kind === 'bat') d = `M92,92 Q70,92 58,${94 + b} Q50,${96 + b} 56,${99 + b} Q72,102 92,102 Z`;
  else if (kind === 'plume') d = `M92,84 Q64,70 42,${60 + b} Q58,82 66,90 Q50,90 40,${98 + b} Q60,102 70,100 Q56,112 46,${126 + b} Q76,114 92,106 Z`;
  else d = `M92,84 Q66,74 46,${76 + b} Q60,88 50,94 Q62,98 48,${110 + b} Q74,108 92,106 Z`;
  return d;
}

function frame(type, i, dead, pre) {
  const P = T[type], id = `${pre}${i}`; // unique ids per frame
  const ph = (i / 6) * Math.PI * 2;
  const theta = dead ? 196 : 270 + 70 * Math.cos(ph);
  const thetaFar = dead ? 188 : 270 + 70 * Math.cos(ph - .8);
  const L = P.L || 66, Wd = P.Wd || 30;
  const bob = dead ? 9 : Math.sin(ph) * 3;
  const headC = P.headC || P.body;
  const k = P.flat ? .5 : 1;
  let defs = '', s = '';
  defs += rad(`${id}b`, [[0, lighten(P.body, .22 * k)], [.55, P.body], [1, darken(P.body, .16 * k)]], .4, .3, .8);
  defs += rad(`${id}h`, [[0, lighten(headC, .22 * k)], [.6, headC], [1, darken(headC, .14 * k)]], .4, .3, .8);
  defs += lin(`${id}t`, [[0, P.wing], [1, P.wingD]], 1, 0, 0, 0);
  defs += `<clipPath id="${id}cb"><ellipse cx="${CX}" cy="${CY}" rx="${BODY.rx}" ry="${BODY.ry}"/></clipPath>`;
  const o = { bat: P.bat };
  const wf = wingSvg(id, P, 132, 76, thetaFar, L * .92, Wd * .9, { far: true, bat: P.bat, deep: P.bat ? 1.5 : 1 });
  const wn = wingSvg(id, P, 120, 82, theta, L, Wd, { bat: P.bat, deep: P.bat ? 1.5 : 1 });
  defs += wf.defs + wn.defs;
  // legs
  if (type !== 'bat' && type !== 'crate') {
    s += `<g stroke="${OL}" stroke-width="5.2" stroke-linecap="round" fill="none"><path d="M122,124 L${dead ? 112 : 108},${dead ? 146 : 142}"/><path d="M136,126 L${dead ? 128 : 126},${dead ? 148 : 144}"/></g>`;
    s += `<g stroke="${P.beak}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M122,124 L${dead ? 112 : 108},${dead ? 146 : 142}"/><path d="M136,126 L${dead ? 128 : 126},${dead ? 148 : 144}"/></g>`;
  }
  // crate (hangs below body)
  if (type === 'crate') {
    const sw = dead ? 0 : Math.sin(ph) * 2.5;
    s += `<g transform="rotate(${f1(sw)} 128 126)"><path d="M128,126 L128,150" stroke="${OL}" stroke-width="3.4"/><path d="M128,126 L128,150" stroke="#e8d7a8" stroke-width="1.6"/>
      <rect x="108" y="150" width="40" height="32" rx="3" fill="#c8914f" stroke="${OL}" stroke-width="${OW}"/>
      <path d="M108,162 H148 M108,172 H148" stroke="#8a5a28" stroke-width="2"/><path d="M110,152 L146,180 M146,152 L110,180" stroke="#a8743a" stroke-width="3"/>
      <rect x="108" y="150" width="40" height="32" rx="3" fill="none" stroke="${OL}" stroke-width="${OW}"/><circle cx="113" cy="155" r="1.6" fill="${OL}"/><circle cx="143" cy="155" r="1.6" fill="${OL}"/></g>`;
  }
  const crestPre = (() => {
    if (type === 'gold') return `<g fill="${P.wing}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"><path d="M164,60 Q158,40 150,34 Q162,38 172,54Z"/><path d="M170,56 Q170,34 166,26 Q180,34 180,56Z"/><path d="M178,58 Q184,40 194,36 Q190,50 188,64Z"/></g>`;
    if (type === 'dodge') return `<g fill="${P.wing}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"><path d="M158,62 Q148,44 136,40 Q150,42 168,56Z"/><path d="M166,57 Q160,34 150,26 Q172,32 178,54Z"/><path d="M176,56 Q180,34 192,30 Q192,46 188,60Z"/></g>`;
    if (type === 'bat') return `<g fill="${P.body}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"><path d="M158,66 L152,16 L176,52Z"/><path d="M174,54 L194,18 L192,66Z"/></g><g fill="${P.belly}"><path d="M158,58 L155,28 L170,52Z" opacity=".8"/><path d="M180,54 L190,30 L188,58Z" opacity=".8"/></g>`;
    if (type === 'boss1') {
      const fe = [[-118, '#d8302a', 46], [-98, '#f08a24', 52], [-78, '#ffffff', 54], [-58, '#2f7ad8', 50], [-38, '#d8302a', 44], [-140, '#f2c418', 40], [-18, '#f08a24', 36]];
      return fe.map(([a, c, l]) => `<g transform="translate(166,60) rotate(${a + 90})"><path d="M0,0 Q-9,-${l * .5} 0,-${l} Q9,-${l * .5} 0,0Z" fill="${c}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/><path d="M0,-6 L0,-${l - 8}" stroke="${OL}" stroke-opacity=".5" stroke-width="1.4"/><path d="M0,-${l - 10} Q-5,-${l - 4} 0,-${l}Q5,-${l - 4} 0,-${l - 10}" fill="${OL}" opacity=".7"/></g>`).join('');
    }
    return '';
  })();
  s += `<g transform="translate(0,0)">${wf.svg}</g>${crestPre}`;
  // outline union: tail + body + head (outline layer first, fill layer second)
  const td = tailSvg(id, P, P.tail, bob);
  const union = (fill) => {
    const st = fill ? '' : `stroke="${OL}" stroke-width="${OW * 2}" stroke-linejoin="round"`;
    const F = (n, dflt) => fill ? `fill="${n}"` : `fill="${OL}"`;
    return `<g ${st}><path d="${td}" ${F(`url(#${id}t)`)}/><ellipse cx="${CX}" cy="${CY}" rx="${BODY.rx}" ry="${BODY.ry}" ${F(`url(#${id}b)`)}/><circle cx="${HEAD.x}" cy="${HEAD.y}" r="${HEAD.r}" ${F(`url(#${id}h)`)}/></g>`;
  };
  s += union(false) + union(true);
  // belly
  s += `<g clip-path="url(#${id}cb)"><ellipse cx="136" cy="${CY + 24}" rx="50" ry="22" fill="${P.belly}" opacity=".95"/></g>`;
  if (type === 'normal') s += `<g stroke="${P.wingD}" stroke-width="2" stroke-linecap="round" opacity=".6"><path d="M142,104 l4,6 M152,100 l4,6 M132,110 l4,6 M148,112 l3,5"/></g><path d="M150,70 Q172,52 196,68 Q178,62 150,70Z" fill="${darken(P.body, .3)}" opacity=".85"/><ellipse cx="190" cy="92" rx="5" ry="3.4" fill="#2a1a10" opacity=".8"/>`;
  if (type === 'fast') s += `<path d="M104,92 L148,92 M110,100 L150,100" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>`;
  if (type === 'swoop') s += `<path d="M148,104 l3,5 M158,102 l3,5 M138,108 l3,5 M152,112 l3,5" stroke="${P.wingD}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/><path d="M182,80 Q184,92 178,100" stroke="#2a0d08" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  if (type === 'civ') s += `<g transform="translate(144,106)"><path d="M-5,-15 h10 v10 h10 v10 h-10 v10 h-10 v-10 h-10 v-10 h10Z" fill="#d8262c" stroke="#ffffff" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke"/><path d="M-5,-15 h10 v10 h10 v10 h-10 v10 h-10 v-10 h-10 v-10 h10Z" fill="#e4303a" stroke="#8a1218" stroke-width="1.2" stroke-linejoin="round"/></g>`;
  if (type === 'heavy') {
    s += `<g clip-path="url(#${id}cb)"><ellipse cx="158" cy="110" rx="21" ry="17" transform="rotate(-18 158 110)" fill="url(#${id}pl)" stroke="${OL}" stroke-width="${OW}"/><path d="M142,108 Q158,100 176,108" stroke="${OL}" stroke-opacity=".5" stroke-width="1.8" fill="none"/><circle cx="148" cy="116" r="2" fill="${OL}"/><circle cx="168" cy="117" r="2" fill="${OL}"/><circle cx="158" cy="100" r="2" fill="${OL}"/></g>`;
    defs += lin(`${id}pl`, [[0, '#d5dde6'], [.5, '#9aa6b4'], [1, '#6a7684']], 0, 0, 1, 1);
  }
  if (type === 'boss1') s += `<g clip-path="url(#${id}cb)"><path d="M130,100 q6,10 0,20 M142,96 q6,12 0,24 M154,100 q6,10 0,20" stroke="${darken(P.belly, .35)}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g><path d="M176,86 L190,92 M176,92 L188,99" stroke="#d8302a" stroke-width="3.2" stroke-linecap="round"/>`;
  if (type === 'boss2') s += `<g clip-path="url(#${id}cb)"><circle cx="150" cy="106" r="13" fill="#f2c418" stroke="${OL}" stroke-width="${OW}"/><path d="M150,98 l3,6 6,1 -5,4 1,7 -5,-4 -5,4 1,-7 -5,-4 6,-1Z" fill="#d8302a" stroke="${OL}" stroke-width="1"/></g>`;
  s += wn.svg;
  // beak
  const hook = ['swoop', 'heavy', 'boss1', 'boss2'].includes(type);
  const bk = P.beak, bkD = darken(P.beak, .22);
  if (type === 'bat') {
    s += `<path d="M190,70 Q203,72 206,80 Q204,88 190,90Z" fill="${P.beak}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/><path d="M195,87 l3,8 l3,-8 M201,85 l3,7 l2,-7" fill="#fff" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="203" cy="77" rx="2.4" ry="1.8" fill="#1f0f3a"/>`;
  } else if (hook) {
    const big = P.boss ? 1.12 : 1;
    s += `<g transform="translate(190,78) scale(${big}) translate(-190,-78)"><path d="M189,66 Q208,64 213,82 Q206,78 192,79Z" fill="${bk}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/><path d="M191,79 Q204,79 207,86 Q198,92 190,90Z" fill="${bkD}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/></g>`;
  } else {
    s += `<path d="M190,71 Q202,74 209,82 Q200,87 190,90Z" fill="${bk}" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/><path d="M191,81 Q200,82 207,82" stroke="${OL}" stroke-opacity=".6" stroke-width="1.5" fill="none"/>`;
  }
  // heavy helmet (over head top, above the eye)
  if (type === 'heavy') {
    defs += lin(`${id}hm`, [[0, '#dfe6ee'], [.45, '#a3afbd'], [1, '#69768a']], 0, 0, 1, 1);
    s += `<path d="M148.6,70 A25,25 0 0 1 198.6,70 Z" fill="url(#${id}hm)" stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"/><rect x="146" y="65" width="55" height="7" rx="3.2" fill="#8794a4" stroke="${OL}" stroke-width="${OW}"/><path d="M174,45 Q172,56 174,66" stroke="${OL}" stroke-opacity=".5" stroke-width="2" fill="none"/><circle cx="155" cy="68.5" r="1.8" fill="${OL}"/><circle cx="192" cy="68.5" r="1.8" fill="${OL}"/><path d="M160,56 Q168,48 178,47" stroke="#fff" stroke-opacity=".65" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  if (type === 'boss2') {
    s += `<g stroke="${OL}" stroke-width="${OW}" stroke-linejoin="round"><path d="M153,62 L153,34 L162,48 L173.6,28 L185,48 L194,34 L194,62 Q174,67 153,62Z" fill="#f4c21c"/></g><path d="M156,56 Q174,61 191,56" stroke="#b8860b" stroke-width="2" fill="none"/><circle cx="173.6" cy="52" r="3.6" fill="#e0262e" stroke="${OL}" stroke-width="1.2"/><circle cx="162" cy="55" r="2.4" fill="#2f7ad8" stroke="${OL}" stroke-width="1"/><circle cx="185" cy="55" r="2.4" fill="#2f7ad8" stroke="${OL}" stroke-width="1"/><path d="M158,40 L158,50 M189,40 L189,50" stroke="#fff3a0" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
  }
  if (type === 'boss1') s += `<rect x="152" y="58" width="42" height="7" rx="3" fill="#d8302a" stroke="${OL}" stroke-width="${OW}"/><path d="M158,61.5 h6 M170,61.5 h6 M182,61.5 h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  // eye
  const ex = type === 'bat' ? 180 : 181, ey = 74;
  if (dead) {
    s += `<g stroke="${OL}" stroke-width="3.6" stroke-linecap="round"><path d="M${ex - 6},${ey - 6} l12,12 M${ex + 6},${ey - 6} l-12,12"/></g>`;
    s += `<path d="M190,90 Q198,98 204,92" stroke="#e0505a" stroke-width="3" fill="none" stroke-linecap="round" opacity="${type === 'bat' ? 0 : 0}"/>`;
  } else if (type === 'bat') {
    s += `<circle cx="${ex}" cy="${ey}" r="8" fill="#ff2a3a" stroke="${OL}" stroke-width="2"/><ellipse cx="${ex + 1.5}" cy="${ey}" rx="2" ry="5" fill="#2a0408"/><circle cx="${ex - 1.5}" cy="${ey - 3}" r="1.8" fill="#fff"/><path d="M${ex - 9},${ey - 8} L${ex + 9},${ey - 2}" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>`;
  } else if (type === 'dodge') {
    s += `<circle cx="${ex}" cy="${ey}" r="9" fill="#fff" stroke="${OL}" stroke-width="2.2"/><circle cx="${ex + 1.5}" cy="${ey + .5}" r="3" fill="#111"/><circle cx="${ex - .5}" cy="${ey - 2}" r="1.5" fill="#fff"/><path d="M${ex - 10},${ey - 11} L${ex + 10},${ey - 6}" stroke="${OL}" stroke-width="3.2" stroke-linecap="round"/>`;
  } else {
    const ang = (type === 'swoop' || type === 'heavy' || P.boss) ? 1 : 0;
    s += `<circle cx="${ex}" cy="${ey}" r="7" fill="${type === 'boss2' ? '#ffe26a' : '#fff'}" stroke="${OL}" stroke-width="2.2"/><circle cx="${ex + 1.8}" cy="${ey + .6}" r="${P.boss ? 3.2 : 3.6}" fill="#15100c"/><circle cx="${ex + .2}" cy="${ey - 1.8}" r="1.4" fill="#fff"/>`;
    if (ang) s += `<path d="M${ex - 8},${ey - 8} L${ex + 9},${ey - 2.5}" stroke="${OL}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  return { defs, svg: s };
}

export async function buildBirds(browser) {
  const manifest = {};
  for (const type of Object.keys(T)) {
    const P = T[type], scale = P.boss ? 2 : 1, cw = 256, ch = 192, n = 7;
    let defs = '', inner = '';
    for (let i = 0; i < n; i++) {
      const dead = i === 6;
      const fr = frame(type, dead ? 3 : i, dead, `${type}${i}_`);
      defs += fr.defs;
      inner += `<g transform="translate(${i * cw},0)">${fr.svg}</g>`;
    }
    const buf = await renderSvg(browser, svgDoc(cw * n, ch, inner, defs), cw * n, ch, scale);
    await saveWebp(buf, OUT('birds', `${type}.webp`), 90);
    manifest[type] = { file: `birds/${type}.webp`, frames: 6, dead: 1, cellW: cw * scale, cellH: ch * scale, r: R * scale, fps: P.fps };
    console.log('bird', type);
  }
  fs.writeFileSync(OUT('birds', 'manifest.json'), JSON.stringify(manifest, null, 2));
}
