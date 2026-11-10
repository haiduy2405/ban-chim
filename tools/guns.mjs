// Guns 512x256, side view facing right, muzzle on the right. Rarity-neutral steel + wood.
import { OL, OUT, renderSvg, svgDoc, savePng, lin } from './lib.mjs';
const S = `stroke="${OL}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const defs = lin('st', [[0, '#b9c2cc'], [.45, '#7d8895'], [1, '#4a5461']]) + lin('sd', [[0, '#6c7683'], [1, '#3a424d']]) + lin('wd', [[0, '#c98b4e'], [.5, '#a2672f'], [1, '#6e4220']]) + lin('bk', [[0, '#59616d'], [1, '#2e343d']]) + lin('gr', [[0, '#7a8a52'], [1, '#4c5a30']]);
const steel = d => `<path d="${d}" fill="url(#st)" ${S}/>`, dark = d => `<path d="${d}" fill="url(#sd)" ${S}/>`, wood = d => `<path d="${d}" fill="url(#wd)" ${S}/>`, blk = d => `<path d="${d}" fill="url(#bk)" ${S}/>`;
const hl = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const rect = (x, y, w, h, r, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${S}/>`;
const G = {
  pistol: () => `${blk('M150,176 L196,176 L214,238 Q216,246 206,246 L172,246 Q160,246 158,238Z')}
    ${rect(120, 98, 290, 52, 12, 'url(#st)')}${hl('M136,110 H392')}${rect(376, 108, 40, 32, 6, 'url(#sd)')}
    ${rect(150, 150, 90, 22, 8, 'url(#sd)')}<path d="M232,152 Q252,196 280,160" fill="none" ${S}/>${steel('M266,150 L286,150 L286,170 L270,170Z')}
    <path d="M180,196 h22 M178,214 h26" stroke="${OL}" stroke-opacity=".5" stroke-width="3"/><rect x="172" y="88" width="14" height="14" rx="3" fill="#d8dde3" ${S}/><rect x="344" y="88" width="10" height="12" rx="3" fill="#d8dde3" ${S}/>`,
  rifle: () => `${wood('M30,150 Q70,128 150,134 L220,138 L220,176 L120,186 Q60,200 36,196Q22,180 30,150Z')}
    ${rect(200, 120, 150, 40, 8, 'url(#st)')}${hl('M214,130 H340')}${rect(340, 128, 150, 16, 6, 'url(#sd)')}${rect(468, 122, 22, 28, 5, 'url(#st)')}
    ${wood('M300,146 L408,146 L408,168 Q350,176 300,166Z')}
    ${rect(236, 100, 100, 26, 10, 'url(#sd)')}<circle cx="236" cy="113" r="14" fill="url(#st)" ${S}/><circle cx="336" cy="113" r="12" fill="url(#st)" ${S}/>${hl('M248,106 H324')}
    <path d="M222,160 Q246,196 270,160" fill="none" ${S}/><path d="M232,138 h40 M250,138 v-14" ${S} stroke-width="4"/><circle cx="272" cy="126" r="7" fill="url(#st)" ${S}/>`,
  smg: () => `${rect(170, 100, 250, 56, 10, 'url(#sd)')}${hl('M186,112 H400')}${rect(400, 110, 70, 28, 6, 'url(#st)')}${rect(462, 104, 24, 40, 6, 'url(#sd)')}
    <path d="M170,112 L90,112 L90,126 L64,126 L64,150 L170,150" fill="url(#bk)" ${S}/><path d="M64,126 v24 M78,126 v24" stroke="${OL}" stroke-opacity=".5" stroke-width="3"/>
    ${blk('M268,156 L316,156 L330,236 Q331,246 320,246 L286,246 Q274,246 272,236Z')}<path d="M280,182 h38 M282,206 h38" stroke="${OL}" stroke-opacity=".5" stroke-width="3"/>
    ${blk('M190,156 L228,156 L220,214 Q218,222 208,222 L192,222 Q184,222 186,212Z')}<path d="M232,158 Q246,196 262,158" fill="none" ${S}/>
    ${rect(300, 88, 60, 14, 5, 'url(#st)')}${rect(206, 90, 18, 12, 3, 'url(#st)')}<path d="M360,112 h26 M360,126 h26" stroke="${OL}" stroke-opacity=".55" stroke-width="3"/>`,
  shotgun: () => `${wood('M26,146 Q70,126 160,134 L230,138 L230,176 L130,188 Q64,204 34,196Q18,176 26,146Z')}
    ${rect(220, 124, 110, 40, 8, 'url(#st)')}${hl('M234,134 H318')}
    ${rect(330, 124, 160, 16, 6, 'url(#st)')}${rect(330, 142, 160, 16, 6, 'url(#sd)')}${rect(468, 120, 24, 42, 5, 'url(#st)')}${hl('M340,130 H470')}
    ${wood('M320,160 L430,160 L430,184 Q372,194 320,184Z')}<path d="M334,164 v16 M352,164 v16" stroke="${OL}" stroke-opacity=".5" stroke-width="3"/>
    <path d="M234,162 Q258,200 282,162" fill="none" ${S}/><circle cx="470" cy="116" r="7" fill="#e8c14a" ${S}/><path d="M336,160 h-14" ${S}/>`,
  sniper: () => `${blk('M24,140 Q40,124 110,128 L200,134 L200,170 L100,180 L60,192 Q32,196 24,178Z')}${wood('M60,150 Q100,140 160,146 L160,166 L70,176Z')}
    ${rect(190, 122, 130, 38, 8, 'url(#sd)')}${hl('M204,132 H308')}${rect(318, 134, 170, 12, 5, 'url(#st)')}${rect(456, 126, 28, 28, 5, 'url(#sd)')}<path d="M472,128 v-8 M478,128 v-8" stroke="${OL}" stroke-width="3"/>
    ${rect(206, 84, 150, 34, 14, 'url(#sd)')}<rect x="190" y="82" width="26" height="38" rx="8" fill="url(#st)" ${S}/><rect x="344" y="80" width="34" height="42" rx="10" fill="url(#st)" ${S}/><circle cx="361" cy="101" r="12" fill="#6ab8e8" ${S}/><circle cx="357" cy="97" r="4" fill="#fff" opacity=".8"/>${hl('M226,92 H330')}
    <path d="M244,118 v10 M320,118 v10" ${S}/><path d="M236,160 Q256,196 276,160" fill="none" ${S}/>
    <path d="M400,150 L370,226 M400,150 L428,226" fill="none" ${S} stroke-width="6"/><path d="M360,226 h20 M418,226 h20" ${S} stroke-width="7"/>`,
  launcher: () => `${wood('M24,150 Q60,134 130,140 L200,146 L200,178 L110,188 Q56,200 30,194Q16,176 24,150Z')}
    ${rect(180, 96, 250, 74, 24, 'url(#gr)')}${hl('M200,112 H410')}${rect(420, 88, 76, 90, 18, 'url(#sd)')}<ellipse cx="496" cy="133" rx="12" ry="40" fill="#1e2228" ${S}/>
    <circle cx="256" cy="133" r="32" fill="url(#st)" ${S}/><circle cx="256" cy="133" r="12" fill="url(#sd)" ${S}/><path d="M256,101 v64 M224,133 h64" stroke="${OL}" stroke-opacity=".5" stroke-width="3"/>
    ${rect(300, 108, 12, 50, 4, 'url(#st)')}${rect(340, 108, 12, 50, 4, 'url(#st)')}${rect(380, 108, 12, 50, 4, 'url(#st)')}
    ${blk('M300,170 L338,170 L330,222 Q328,232 316,232 L304,232 Q296,232 298,222Z')}<path d="M346,172 Q362,206 378,172" fill="none" ${S}/>
    <rect x="248" y="76" width="16" height="22" rx="3" fill="#d8dde3" ${S}/><rect x="404" y="78" width="12" height="16" rx="3" fill="#d8dde3" ${S}/>`,
};
export async function buildGuns(browser) {
  for (const [name, fn] of Object.entries(G)) {
    const buf = await renderSvg(browser, svgDoc(512, 256, fn(), defs), 512, 256, 1);
    await savePng(buf, OUT('guns', `${name}.png`));
    console.log('gun', name);
  }
}
