# Bắn Chim – sprite assets (step 1)

All art is original, hand-authored SVG (one outline colour `#3b2417`, ~2.6px at 256-cell scale, soft gradients) rasterised with Playwright/Chromium and encoded with sharp. Nothing here is wired into `index.html` yet.

## Regenerate
```
node tools/build_assets.mjs            # everything (or: birds | bg | guns | fx)
node tools/validate_assets.mjs         # dims / alpha / frame counts / tile seams / size budget
node tools/make_preview.mjs            # assets/preview.html + preview.png
```
Needs `playwright` (Chromium) and `sharp` resolvable from node (global install is found automatically).

## Files
- `birds/<type>.webp` – horizontal strip, 7 cells: frames 0-5 = wing-flap loop, cell 6 = dying (X eyes, limp wings). Birds face RIGHT. Types: normal fast gold civ dodge crate swoop heavy bat boss1 boss2. `birds/manifest.json` = `{type:{file,frames:6,dead:1,cellW,cellH,r,fps}}`.
  Normal cell 256x192 (r=48); bosses 512x384 (r=96).
- `bg/<theme>_<sky|far|mid|near>.webp` – 1920x1080. Themes: rung bien samac suong tuyet bao dem. `sky` opaque/static (sun/moon/stars baked in; bao has none). `far`/`mid`/`near` transparent, tile horizontally (ridge ~62-68% / ~75% / ground from ~87%, trees rooted ~90%); band 10-60% height left empty. `bg/manifest.json` lists every file.
- `guns/<name>.png` – 512x256 transparent, side view, muzzle right: pistol rifle smg shotgun sniper launcher.
- `fx/` – `cloud1-3.png` 512x256, `feather1-2.png` 96x96, `egg.png` 64x80, `explosion.png` 8x192² strip, `muzzle.png` 4x128² strip (flash grows to the right of x≈40), `coin.png`, `gem.png` 128².
- `preview.html` / `preview.png` – contact sheet.

## Geometry contract (birds)
With r = 48 (normal) or 96 (boss), cell centre c=(cellW/2, cellH/2):
- body ellipse centred at c, half-width 1.1r, half-height 0.72r
- head circle centre (c.x+0.95r, c.y-0.38r), radius 0.45r
- tail to ≈ c.x-1.7r, beak tip ≈ c.x+1.75r (bat has a short snout ≈ +1.6r instead of a beak)
Body/head are identical in every frame and every type; only wings (and a few px of tail/crate sway) move. Wings stay inside the cell.
