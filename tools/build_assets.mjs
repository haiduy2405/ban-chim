// Regenerate all sprite assets:  node tools/build_assets.mjs [birds|bg|guns|fx ...]
import { withBrowser } from './lib.mjs';
const want = process.argv.slice(2);
const all = want.length === 0;
await withBrowser(async br => {
  if (all || want.includes('birds')) await (await import('./birds.mjs')).buildBirds(br);
  if (all || want.includes('guns')) await (await import('./guns.mjs')).buildGuns(br);
  if (all || want.includes('fx')) await (await import('./fx.mjs')).buildFx(br);
  if (all || want.includes('bg')) await (await import('./bg.mjs')).buildBg(br);
});
