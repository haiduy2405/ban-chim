// Small FX: clouds, feathers, egg, explosion strip, muzzle flash strip, coin, gem.
import { OL, OUT, renderSvg, svgDoc, savePng, saveWebp, lin, rad, lighten, darken, rng } from './lib.mjs';
const f1 = n => +n.toFixed(1);
export async function buildFx(br) {
  // clouds 512x256 (3 variants): soft white, subtle blue-grey underside
  const cloudDefs = `<filter id="b"><feGaussianBlur stdDeviation="3"/></filter>` + lin('cg', [[0, '#ffffff'], [.6, '#f3f8ff'], [1, '#cfdcf0']]);
  const variants = [[[130, 160, 70], [210, 130, 85], [300, 150, 80], [380, 168, 60], [250, 175, 90]], [[110, 170, 55], [190, 140, 70], [270, 120, 78], [350, 150, 70], [420, 175, 50], [250, 180, 85]], [[150, 165, 80], [250, 135, 90], [350, 165, 75], [250, 190, 100], [90, 185, 45], [430, 190, 45]]];
  for (let i = 0; i < 3; i++) {
    const c = variants[i];
    const s = `<g filter="url(#b)">${c.map(([x, y, r]) => `<circle cx="${x}" cy="${y - 28}" r="${r * .82}" fill="url(#cg)"/>`).join('')}<rect x="${Math.min(...c.map(a => a[0] - a[2])) + 20}" y="190" width="400" height="40" fill="url(#cg)" opacity="0"/></g>`;
    await savePng(await renderSvg(br, svgDoc(512, 256, s, cloudDefs), 512, 256), OUT('fx', `cloud${i + 1}.png`));
  }
  // feathers 96x96
  const fe = (col, rot, id) => { const d = lin(id, [[0, lighten(col, .3)], [1, col]], 0, 0, 1, 1); return svgDoc(96, 96, `<g transform="rotate(${rot} 48 48)"><path d="M48,88 L48,14" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><path d="M48,12 Q76,28 68,58 Q62,76 48,84 Q34,76 28,58 Q20,28 48,12Z" fill="url(#${id})" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M48,20 L48,82" stroke="${OL}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/><path d="M48,36 L62,30 M48,48 L64,44 M48,60 L60,58 M48,36 L34,30 M48,48 L32,44 M48,60 L36,58" stroke="${OL}" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/></g>`, d); };
  await savePng(await renderSvg(br, fe('#d9b48a', 30, 'f1'), 96, 96), OUT('fx', 'feather1.png'));
  await savePng(await renderSvg(br, fe('#f4f1ea', -35, 'f2'), 96, 96), OUT('fx', 'feather2.png'));
  // egg 64x80
  const egg = svgDoc(64, 80, `<path d="M32,6 C48,6 58,38 58,52 C58,68 46,76 32,76 C18,76 6,68 6,52 C6,38 16,6 32,6Z" fill="url(#eg)" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><g fill="#b98a58" opacity=".75"><ellipse cx="22" cy="48" rx="4" ry="3"/><ellipse cx="40" cy="38" rx="3" ry="2.4"/><ellipse cx="38" cy="58" rx="4.5" ry="3.2"/><ellipse cx="25" cy="30" rx="2.4" ry="2"/><ellipse cx="46" cy="52" rx="2.2" ry="1.8"/></g><path d="M20,28 Q22,16 30,12" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".8"/>`, rad('eg', [[0, '#fffbe8'], [.7, '#f4e2b8'], [1, '#d9b98a']], .38, .3, .85));
  await savePng(await renderSvg(br, egg, 64, 80, 1), OUT('fx', 'egg.png'));
  // explosion strip 8 x 192
  let ex = '', exd = '';
  for (let i = 0; i < 8; i++) {
    const k = i / 7, R = rng(40 + i), cx = i * 192 + 96, cy = 98;
    const size = 28 + 62 * Math.sin(Math.min(1, k * 1.25) * Math.PI / 2), alpha = k < .6 ? 1 : 1 - (k - .6) / .4 * .9;
    exd += rad(`e${i}`, [[0, '#fffbd0'], [.3, '#ffd23a'], [.65, '#ff7a1a'], [1, '#c8341e']]) + rad(`s${i}`, [[0, '#6a5a52', .75], [1, '#3a302c', 0]]);
    let g = `<g opacity="${f1(alpha)}">`;
    if (k > .3) for (let j = 0; j < 6; j++) { const a = j / 6 * 6.28 + i, d = size * (.5 + k * .35); g += `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d * .9)}" r="${f1(size * .38)}" fill="url(#s${i})"/>`; }
    // lumpy fireball
    const pts = 12; let d = '';
    for (let j = 0; j <= pts; j++) { const a = j / pts * 6.28, rr = size * (.82 + .26 * Math.sin(j * 2.3 + i * 1.7) * (j % 2 ? 1 : .6)); d += `${j ? 'L' : 'M'}${f1(cx + Math.cos(a) * rr)},${f1(cy + Math.sin(a) * rr)}`; }
    g += `<path d="${d}Z" fill="url(#e${i})" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" opacity="${f1(k < .75 ? 1 : 1 - (k - .75) * 3)}"/>`;
    if (k < .7) for (let j = 0; j < 8; j++) { const a = j / 8 * 6.28 + .4, d1 = size * 1.05, d2 = size * (1.25 + k * .6); g += `<path d="M${f1(cx + Math.cos(a) * d1)},${f1(cy + Math.sin(a) * d1)} L${f1(cx + Math.cos(a) * d2)},${f1(cy + Math.sin(a) * d2)}" stroke="#ffb02a" stroke-width="4" stroke-linecap="round"/>`; }
    ex += g + `</g>`;
  }
  await savePng(await renderSvg(br, svgDoc(1536, 192, ex, exd), 1536, 192), OUT('fx', 'explosion.png'));
  // muzzle flash strip 4 x 128 (flash points right, from x=24)
  let mf = '', mfd = '';
  for (let i = 0; i < 4; i++) {
    const s = [.55, 1, .8, .5][i], ox = i * 128, cy = 64;
    mfd += rad(`m${i}`, [[0, '#ffffff'], [.35, '#fff2a0'], [1, '#ffb02a']]);
    const star = (n, r1, r2, rot) => { let d = ''; for (let j = 0; j < n * 2; j++) { const a = j / (n * 2) * 6.28 + rot, rr = j % 2 ? r2 : r1; d += `${j ? 'L' : 'M'}${f1(Math.cos(a) * rr)},${f1(Math.sin(a) * rr)}`; } return d + 'Z'; };
    mf += `<g transform="translate(${ox + 40},${cy}) scale(${s})"><path d="${star(7, 62, 20, 0)}" fill="#ff9a1a" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" transform="translate(14,0)"/><path d="${star(7, 44, 14, .25)}" fill="url(#m${i})" transform="translate(14,0)"/><circle cx="14" cy="0" r="12" fill="#fff"/></g>`;
  }
  await savePng(await renderSvg(br, svgDoc(512, 128, mf, mfd), 512, 128), OUT('fx', 'muzzle.png'));
  // coin 128
  const coin = svgDoc(128, 128, `<circle cx="64" cy="64" r="54" fill="url(#cn)" stroke="${OL}" stroke-width="5"/><circle cx="64" cy="64" r="40" fill="none" stroke="#c98a10" stroke-width="5"/><path d="M64,40 L72,57 L90,59 L77,71 L81,89 L64,80 L47,89 L51,71 L38,59 L56,57Z" fill="#fff0a0" stroke="#b8760a" stroke-width="3" stroke-linejoin="round"/><path d="M26,50 Q34,26 58,18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>`, lin('cn', [[0, '#ffe36a'], [.5, '#f6b91c'], [1, '#d98a0c']], 0, 0, 1, 1));
  await savePng(await renderSvg(br, coin, 128, 128), OUT('fx', 'coin.png'));
  // gem 128 (blue-violet faceted)
  const gem = svgDoc(128, 128, `<path d="M32,24 H96 L116,52 L64,116 L12,52Z" fill="url(#gm)" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><path d="M12,52 H116 M32,24 L50,52 L64,24 L78,52 L96,24 M50,52 L64,116 L78,52" fill="none" stroke="${OL}" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/><path d="M34,30 L50,50 L30,50Z" fill="#fff" opacity=".6"/><path d="M64,28 L76,48 L52,48Z" fill="#fff" opacity=".35"/>`, lin('gm', [[0, '#9be8ff'], [.5, '#4a8cf0'], [1, '#7a46d8']], 0, 0, 1, 1));
  await savePng(await renderSvg(br, gem, 128, 128), OUT('fx', 'gem.png'));
  console.log('fx done');
}
