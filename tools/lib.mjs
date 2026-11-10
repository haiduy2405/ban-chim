// Shared helpers: Playwright SVG rasterizer + colour utils
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const req = n => { try { return require(n); } catch { return createRequire('/usr/lib/node_modules/')(n); } };
const { chromium } = req('playwright');
const sharp = req('sharp');
export { sharp };
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = (...p) => path.join(ROOT, 'assets', ...p);
export const OL = '#3b2417'; // single outline colour for the whole set
export async function withBrowser(fn) { const b = await chromium.launch(); try { return await fn(b); } finally { await b.close(); } }
export async function renderSvg(browser, svg, w, h, scale = 1) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`);
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await ctx.close();
  return buf;
}
export const svgDoc = (w, h, inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block"><defs>${defs}</defs>${inner}</svg>`;
export function hex2rgb(c) { c = c.replace('#', ''); if (c.length === 3) c = [...c].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); }
export const rgb2hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#000000', t);
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
export const rad = (id, stops, cx = .5, cy = .5, r = .5, fx, fy) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
export async function savePng(buf, file) { fs.mkdirSync(path.dirname(file), { recursive: true }); await sharp(buf).png({ compressionLevel: 9 }).toFile(file); }
export async function saveWebp(buf, file, q = 82, lossless = false) { fs.mkdirSync(path.dirname(file), { recursive: true }); await sharp(buf).webp(lossless ? { lossless: true } : { quality: q, alphaQuality: 100, effort: 5 }).toFile(file); }
