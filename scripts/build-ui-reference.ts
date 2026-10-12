import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  colorTokens,
  cssNameByColorToken,
  motionTokens,
  projectMeta,
  proposalColorTokens,
  proposalRadiusTokens,
  proposalShadowTokens,
  radiusTokens,
  semanticColorKeys,
  shadowTokens,
  spacingTokens,
  typographyTokens,
  type SemanticColorTokens,
  type ThemeName,
} from "./ui-tokens.ts";
import { assertMinRatio, buildProposalContrastPairs } from "./contrast.ts";
import { buildProductiveTokensCss } from "./build-ui-tokens-css.ts";
import { buildZip, type ZipEntry } from "./zip-store.ts";

export const OUT_DIR = resolve(process.cwd(), "artifacts", "ui-reference");
export const PACKAGE_FILENAME = "app-album-design-reference.zip";
export type PackageFile = { name: string; contents: string };

const themes: ThemeName[] = ["light", "dark"];
const foil = new Set([1, 8, 16, 24]);
const duplicate = new Set([3, 7, 18]);
const missing = new Set([5, 9, 12, 14, 16, 19, 22, 24]);

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

function serializeColors(tokens: SemanticColorTokens, theme: ThemeName): Record<string, string> {
  return Object.fromEntries(semanticColorKeys.map((key) => [key, tokens[key][theme]]));
}

function colorDeclarations(tokens: SemanticColorTokens, theme: ThemeName, prefix = "album"): string {
  return semanticColorKeys
    .map((key) => `  --${prefix}-${cssNameByColorToken[key]}: ${tokens[key][theme]};`)
    .join("\n");
}

function pairDeclarations(
  values: Readonly<Record<string, Readonly<Record<ThemeName, string>>>>,
  theme: ThemeName,
  prefix: string,
): string {
  return Object.entries(values)
    .map(([key, pair]) => `  --${prefix ? `${prefix}-` : ""}${kebab(key)}: ${pair[theme]};`)
    .join("\n");
}

export function buildUiTokensCss(): string {
  const baseTheme = (theme: ThemeName) => `${colorDeclarations(colorTokens, theme)}\n${pairDeclarations(shadowTokens, theme, "")}`;
  const proposalTheme = (theme: ThemeName) => `${colorDeclarations(proposalColorTokens, theme, "album-proposal")}\n${pairDeclarations(proposalShadowTokens, theme, "album-proposal")}`;
  const dimensions = Object.entries(proposalRadiusTokens)
    .map(([key, value]) => `  --radius-proposal-${kebab(key).replace(/^radius-/, "")}: ${value};`)
    .join("\n");
  return `/* Generated from scripts/ui-tokens.ts. Do not maintain a palette here. */
@layer tokens {
:root,[data-theme="light"] {
  color-scheme: light;
${baseTheme("light")}
${proposalTheme("light")}
${dimensions}
  --motion-fast: ${motionTokens.motionFast};
  --motion-normal: ${motionTokens.motionNormal};
  --motion-spin: ${motionTokens.motionSpin};
  --motion-ease: ${motionTokens.easeStandard};
  --font-display: ${typographyTokens.fontDisplay};
  --font-body: ${typographyTokens.fontBody};
}
[data-theme="dark"],.dark {
  color-scheme: dark;
${baseTheme("dark")}
${proposalTheme("dark")}
}
}
`;
}

export function buildDesignTokensJson(): string {
  const payload = {
    name: projectMeta.name,
    description: projectMeta.description,
    color: {
      current: Object.fromEntries(themes.map((theme) => [theme, serializeColors(colorTokens, theme)])),
      proposed: Object.fromEntries(themes.map((theme) => [theme, serializeColors(proposalColorTokens, theme)])),
    },
    radius: radiusTokens,
    radiusProposal: proposalRadiusTokens,
    shadow: shadowTokens,
    shadowProposal: proposalShadowTokens,
    motion: motionTokens,
    typography: typographyTokens,
    spacing: spacingTokens,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function swatches(): string {
  return themes.map((theme) => `<h3>${theme === "light" ? "Claro" : "Oscuro"}</h3><div class="swatches">${semanticColorKeys.map((key) => `<article class="swatch"><i style="background:var(--album-proposal-${cssNameByColorToken[key]})"></i><b>${key}</b><code>${proposalColorTokens[key][theme]}</code></article>`).join("")}</div>`).join("");
}

function stickers(): string {
  return Array.from({ length: 24 }, (_, index) => index + 1).map((number) => {
    const classes = ["slot", missing.has(number) ? "" : "on", foil.has(number) ? "foil" : "", duplicate.has(number) ? "duplicate" : ""].filter(Boolean).join(" ");
    const state = missing.has(number) ? "me falta" : duplicate.has(number) ? "repetida" : "pegada";
    return `<button type="button" class="${classes}" data-sticker="${number}" aria-label="Lámina ${number}${foil.has(number) ? " especial" : ""}, ${state}">${number}${duplicate.has(number) ? '<span class="count">×2</span>' : ""}</button>`;
  }).join("");
}

function ring(percent: number, compact = false): string {
  return `<div class="ring${compact ? " compact" : ""}"><svg viewBox="0 0 64 64" role="progressbar" aria-label="${percent}% completado" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><circle class="track" cx="32" cy="32" r="26"/><circle class="value${percent === 100 ? " complete" : ""}" cx="32" cy="32" r="26" style="stroke-dashoffset:${163.4 * (1 - percent / 100)}"/></svg><b>${percent}%</b></div>`;
}

function identityPlaceholder(label = ""): string {
  return `<span class="identity-placeholder" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}></span>`;
}

function statusIcon(type: "ok" | "warning" | "error"): string {
  if (type === "warning") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 22 20.5H2Z" fill="currentColor"/><path d="M12 9v5m0 3.2v.1" fill="none" stroke="var(--album-surface)" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const path = type === "ok" ? "m7.5 12.5 3 3 6-6.5" : "m8.5 8.5 7 7m0-7-7 7";
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="${path}" fill="none" stroke="var(--album-surface)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function navIcon(index: number): string {
  const paths = [
    `<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M13 4h4a3 3 0 0 1 3 3v4"/>`,
    `<circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/>`,
    `<path d="M7 7h12l-3-3m1 13H5l3 3"/>`,
    `<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>`,
  ];
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[index]}</svg>`;
}

function proposalShowcase(): string {
  const albums = [["Mundial 2026",63,"151 de 240 láminas","activo"],["Maravillas",30,"36 de 120 láminas","borrador"],["Cocina local",100,"72 de 72 láminas","completo"]] as const;
  return `<div class="dev-ui-proposal" data-showcase="proposal">
<header class="top"><div class="brand">${identityPlaceholder("Placeholder de identidad App Álbum")}<div><h1>App Álbum — Propuesta de diseño</h1><p>Paleta alineada al logo, tipografía editorial, componentes de láminas y accesibilidad AA.</p></div></div><div class="controls"><div class="direction-toggle seg" role="group" aria-label="Dirección visual"><button data-direction-value="current" aria-pressed="true">Referencia actual</button><button data-direction-value="proposal" aria-pressed="false">Propuesta marca</button></div><div class="theme-toggle seg" role="group" aria-label="Tema"><button data-theme-value="light" aria-pressed="true">Claro</button><button data-theme-value="dark" aria-pressed="false">Oscuro</button></div></div></header>
<section><h2>Qué cambia respecto a la referencia</h2><div class="card"><ul><li><b>Identidad:</b> violeta de marca + naranja sticker.</li><li><b>Arquitectura:</b> una fuente semántica para current/proposed.</li><li><b>Táctil:</b> botones y campos de 44 px.</li><li><b>Producto:</b> láminas, filtros, progreso y navegación móvil.</li></ul></div></section>
<section><h2>Paleta</h2><p class="hint"><span>NUEVO</span> Swatches pintados con variables; valores derivados de la fuente.</p>${swatches()}</section>
<section><h2>Tipografía</h2><div class="card type"><div><small>DISPLAY</small><strong>Tu colección, completa.</strong></div><div><small>TÍTULO</small><h3>Mundial 2026 · 12 páginas</h3></div><div><small>SUBTÍTULO</small><p>Marca las láminas que ya pegaste.</p></div><div><small>CUERPO</small><p>Toca una lámina para cambiar su estado.</p></div></div></section>
<section><h2>Radios y sombras</h2><div class="card row"><i class="shape control">control</i><i class="shape card-shape">tarjeta</i><i class="shape sticker-shape">lámina</i><i class="shape pill">píldora</i><i class="shape shadow sm">sm</i><i class="shape shadow md">md</i><i class="shape shadow lg">lg</i></div></section>
<section><h2>Botones y campos</h2><div class="card stack"><div class="row"><button class="btn primary">Agregar lámina</button><button class="btn accent">Intercambiar</button><button class="btn secondary">Secundario</button><button class="btn ghost">Ghost</button><button class="btn danger">Eliminar</button><button class="btn primary" disabled>Deshabilitado</button><button class="btn primary loading">Guardando</button></div><div class="fields"><label>Nombre del álbum<input placeholder="Ej. Mundial 2026"><small>Puedes cambiarlo después.</small></label><label>Tipo<select><option>Fútbol</option></select></label><label class="bad">Total de láminas<input value="abc" aria-invalid="true"><small>Ingresa un número.</small></label></div></div></section>
<section><h2>Mensajes y badges</h2><div class="two"><div class="card alerts"><div class="alert ok">${statusIcon("ok")}<span>Lámina 14 agregada al álbum.</span></div><div class="alert warning">${statusIcon("warning")}<span>Tienes 6 láminas repetidas.</span></div><div class="alert error">${statusIcon("error")}<span>No se pudo guardar.</span></div></div><div class="card row"><span class="badge">neutral</span><span class="badge primary">activo</span><span class="badge accent">especial</span><span class="badge success">completo</span><span class="badge warning">pendiente</span><span class="badge danger">error</span></div></div></section>
<section><h2>Componentes del álbum</h2><div class="two album-layout"><div class="card"><div class="album-head">${ring(67)}<div><h3>Mundial 2026</h3><small>Página 1 · 24 láminas</small></div></div><div class="stats"><div><b>16</b><small>Pegadas</small></div><div><b>8</b><small>Me faltan</small></div><div><b>3</b><small>Repetidas</small></div></div><div class="seg filters" role="group" aria-label="Filtro"><button aria-pressed="true">Todas</button><button aria-pressed="false">Me faltan</button><button aria-pressed="false">Repetidas</button></div><div class="slots">${stickers()}</div></div><aside class="side"><div class="card"><b>Mis álbumes</b>${albums.map(([name,percent,detail,status]) => `<div class="album-row">${ring(percent,true)}<div><b>${name}</b><small>${detail}</small></div><span class="badge ${percent === 100 ? "success" : status === "activo" ? "primary" : ""}">${status}</span></div>`).join("")}</div><div class="card"><b>Progreso del álbum <span>62%</span></b><div class="bar"><i style="width:62%"></i></div><b>Completo <span>100%</span></b><div class="bar complete"><i style="width:100%"></i></div></div></aside></div></section>
<section><h2>Estado vacío y navegación móvil</h2><div class="two"><div class="empty">${identityPlaceholder()}<h3>Aún no tienes láminas</h3><p>Crea tu primer álbum y empieza a marcar las que ya pegaste.</p><button class="btn primary">Crear álbum</button></div><div class="nav-wrap"><nav class="nav" aria-label="Navegación inferior">${["Álbum", "Me faltan", "Cambios", "Perfil"].map((item, index) => `<a href="#"${index === 0 ? ' aria-current="page"' : ""}>${navIcon(index)}<span>${item}</span></a>`).join("")}</nav></div></div></section>
<section><h2>Movimiento</h2><div class="card"><ul><li>Color y borde: 150 ms; progreso y lámina: 200 ms.</li><li>Pop de lámina y spinner respetan reduced motion.</li></ul></div></section>
</div>`;
}

function buildIndexHtml(css: string): string {
  const proposalMapping = semanticColorKeys.map((key) => `--album-${cssNameByColorToken[key]}:var(--album-proposal-${cssNameByColorToken[key]});`).join("");
  return `<!doctype html><html lang="es" data-theme="light" data-direction="proposal"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>App Álbum — Propuesta de diseño</title><link rel="stylesheet" href="./ui-tokens.css"><style>
${css}
*{box-sizing:border-box}html[data-direction="proposal"]{${proposalMapping}--radius-control:var(--radius-proposal-control);--radius-card:var(--radius-proposal-card);--radius-sticker:var(--radius-proposal-sticker);--radius-pill:var(--radius-proposal-pill);--shadow-sm:var(--album-proposal-shadow-sm);--shadow-md:var(--album-proposal-shadow-md);--shadow-lg:var(--album-proposal-shadow-lg)}body{margin:0;font-family:var(--font-body);font-size:${typographyTokens.bodySize};line-height:1.5;background:var(--album-background);color:var(--album-text);transition:background var(--motion-fast) var(--motion-ease),color var(--motion-fast) var(--motion-ease)}#dev-ui{max-width:1100px;margin:auto;padding:2rem 1.25rem 4rem}h1,h2,h3{font-family:var(--font-display)}h1{font-size:${typographyTokens.displaySize};line-height:1.15;font-weight:700;margin:0}.top,.brand,.controls,.row,.album-head,.album-row{display:flex;align-items:center;gap:1rem}.top{justify-content:space-between;flex-wrap:wrap}.brand p{margin:.25rem 0 0;color:var(--album-text-muted)}.identity-placeholder{display:block;width:48px;aspect-ratio:1;flex:none;border:1px solid var(--album-border);border-radius:var(--radius-control);background:var(--album-primary)}.seg{display:inline-flex;padding:.25rem;gap:.25rem;background:var(--album-surface-soft);border:1px solid var(--album-border);border-radius:var(--radius-pill)}.seg button{border:0;background:transparent;color:var(--album-text-muted);min-height:40px;padding:0 1rem;border-radius:var(--radius-pill);font-weight:600}.seg button[aria-pressed="true"]{background:var(--album-primary);color:var(--album-primary-content)}section{margin-top:3rem}.card{background:var(--album-surface);border:1px solid var(--album-border);border-radius:var(--radius-card);padding:1.25rem;box-shadow:var(--shadow-sm)}.hint{color:var(--album-text-muted)}.hint span{color:var(--album-accent);font-weight:700}.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:.75rem}.swatch{border:1px solid var(--album-border);border-radius:var(--radius-control);overflow:hidden;background:var(--album-surface)}.swatch i{display:block;height:56px;border-bottom:1px solid var(--album-border)}.swatch b,.swatch code{display:block;padding:.35rem .625rem}.swatch code{color:var(--album-text-muted)}.type>div{display:flex;gap:1rem;align-items:baseline;padding:.625rem 0;border-bottom:1px dashed var(--album-border)}.type small{width:7rem;color:var(--album-text-muted)}.type strong{font-size:${typographyTokens.displaySize};font-weight:700}.type h3{font-size:${typographyTokens.titleSize};font-weight:600}.type p{font-size:${typographyTokens.subtitleSize}}.shape{width:96px;height:72px;display:flex;align-items:center;justify-content:center;background:var(--album-primary);color:var(--album-primary-content);font-style:normal}.control{border-radius:var(--radius-control)}.card-shape{border-radius:var(--radius-card)}.sticker-shape{border-radius:var(--radius-sticker)}.pill{border-radius:var(--radius-pill)}.shadow{background:var(--album-surface);color:var(--album-text);border-radius:var(--radius-control)}.shadow.sm{box-shadow:var(--shadow-sm)}.shadow.md{box-shadow:var(--shadow-md)}.shadow.lg{box-shadow:var(--shadow-lg)}.stack,.side,.alerts{display:flex;flex-direction:column;gap:1rem}.row{flex-wrap:wrap}.btn{min-height:44px;padding:0 1.25rem;border-radius:var(--radius-control);border:1.5px solid transparent;font:600 ${typographyTokens.bodySize} var(--font-body);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;transition:filter var(--motion-fast) var(--motion-ease),transform var(--motion-fast) var(--motion-ease)}.btn:hover{filter:brightness(1.08)}.btn:active{transform:scale(.97)}.btn:disabled{opacity:.45;cursor:not-allowed;filter:none;transform:none}.btn.primary{background:var(--album-primary);color:var(--album-primary-content)}.btn.accent{background:var(--album-accent);color:var(--album-accent-content)}.btn.secondary{background:var(--album-surface);color:var(--album-text);border-color:var(--album-input-border)}.btn.ghost{background:transparent;color:var(--album-primary)}.btn.danger{background:var(--album-danger);color:var(--album-danger-content)}.badge.primary{background:var(--album-primary);color:var(--album-primary-content);border-color:transparent}.badge.accent{background:var(--album-accent);color:var(--album-accent-content);border-color:transparent}.badge.success{background:var(--album-success);color:var(--album-success-content);border-color:transparent}.badge.warning{background:var(--album-warning);color:var(--album-warning-content);border-color:transparent}.badge.danger{background:var(--album-danger);color:var(--album-danger-content);border-color:transparent}.loading:before{content:"";width:1rem;height:1rem;border:2px solid currentColor;border-right-color:transparent;border-radius:var(--radius-pill);animation:rot var(--motion-spin) linear infinite}.fields,.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}.fields label{display:flex;flex-direction:column;gap:.375rem;font-weight:600}.fields input,.fields select{min-height:44px;border:1.5px solid var(--album-input-border);border-radius:var(--radius-control);background:var(--album-input);color:var(--album-text);padding:0 .875rem;font:inherit;transition:box-shadow var(--motion-fast) var(--motion-ease),border-color var(--motion-fast) var(--motion-ease)}.fields input:focus-visible,.fields select:focus-visible{outline:0;border-color:var(--album-focus);box-shadow:0 0 0 4px color-mix(in srgb,var(--album-focus) 30%,transparent)}.bad input{border-color:var(--album-danger)}.bad small{color:var(--album-danger)}.alert{--alert-color:var(--album-success);display:flex;gap:.75rem;align-items:flex-start;padding:.875rem 1rem;border:1px solid color-mix(in srgb,var(--alert-color) 45%,transparent);background:color-mix(in srgb,var(--alert-color) 10%,var(--album-surface));border-radius:var(--radius-control);font-size:.875rem}.alert svg{width:1.25rem;height:1.25rem;color:var(--alert-color);flex:none}.alert.warning{--alert-color:var(--album-warning);color:var(--album-text)}.alert.error{--alert-color:var(--album-danger)}.badge{padding:.1875rem .625rem;border-radius:var(--radius-pill);border:1px solid var(--album-border);font-size:.75rem}.album-layout{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}.ring{position:relative;width:64px;height:64px}.ring.compact{width:48px;height:48px}.ring svg{width:100%;height:100%;transform:rotate(-90deg)}.ring circle{fill:none;stroke-width:7}.ring .track{stroke:var(--album-surface-soft)}.ring .value{stroke:var(--album-primary);stroke-linecap:round;stroke-dasharray:163.4}.ring .complete{stroke:var(--album-success)}.ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem}.stats{display:flex;gap:1.5rem;margin:1rem 0}.stats b,.stats small,.album-row small{display:block}.filters{margin-bottom:1rem}.slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:.625rem}.slot{position:relative;aspect-ratio:3/4;border-radius:var(--radius-sticker);border:2px dashed var(--album-input-border);background:var(--album-surface-soft);color:var(--album-text-muted);font-weight:700}.slot.on{border-color:transparent;background:linear-gradient(150deg,var(--album-sticker-owned),var(--album-sticker-owned-end));color:var(--album-primary-content);box-shadow:var(--shadow-md);animation:pop var(--motion-normal) var(--motion-ease)}.slot.foil{border-color:var(--album-accent)}.slot.foil.on{background:linear-gradient(150deg,var(--album-sticker-special),var(--album-sticker-special-end));color:var(--album-accent-content)}.slot.foil.on:after{content:"";position:absolute;left:0;bottom:0;width:34%;aspect-ratio:1;background:linear-gradient(45deg,var(--album-sticker-fold) 50%,transparent 50%);opacity:.9;clip-path:polygon(0 0,100% 100%,0 100%)}.count{position:absolute;top:.3rem;right:.3rem;background:var(--album-surface);color:var(--album-text);border-radius:var(--radius-pill);padding:.2rem}.album-row+.album-row{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--album-border)}.album-row>div:not(.ring){flex:1}.bar{height:.625rem;border-radius:var(--radius-pill);background:var(--album-surface-soft);overflow:hidden;margin:.5rem 0 1rem}.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--album-primary),var(--album-accent))}.bar.complete i{background:var(--album-success)}.card>b span{float:right}.empty{border:2px dashed var(--album-border);border-radius:var(--radius-card);padding:2.5rem;text-align:center}.empty .identity-placeholder{width:56px;margin:0 auto}.nav-wrap{display:flex;align-items:center}.nav{width:100%;max-width:360px;margin:auto;display:grid;grid-template-columns:repeat(4,1fr);background:var(--album-surface);border:1px solid var(--album-border);border-radius:1.5rem;padding:.5rem;box-shadow:var(--shadow-lg)}.nav a{display:flex;flex-direction:column;align-items:center;gap:.125rem;color:var(--album-text-muted);text-decoration:none;padding:.5rem;min-height:48px;font-size:.6875rem;font-weight:600}.nav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.nav a[aria-current]{background:var(--album-surface-soft);color:var(--album-primary);border-radius:var(--radius-control)}@keyframes pop{0%{transform:scale(.92)}60%{transform:scale(1.05)}100%{transform:scale(1)}}@keyframes rot{to{transform:rotate(360deg)}}@media(max-width:640px){#dev-ui{padding:1.5rem 1rem}.slots{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
</style></head><body><main id="dev-ui">${proposalShowcase()}</main><script>(function(){var root=document.documentElement,slots=document.querySelector('.slots'),filter='all',states={1:1,2:1,3:2,4:1,5:0,6:1,7:2,8:1,9:0,10:1,11:1,12:0,13:1,14:0,15:1,16:0,17:1,18:2,19:0,20:1,21:1,22:0,23:1,24:0};function bind(selector,attribute,storage,apply){document.querySelectorAll(selector).forEach(function(button){button.addEventListener('click',function(){apply(button.getAttribute(attribute))})});try{apply(localStorage.getItem(storage))}catch(error){apply(null)}}bind('.theme-toggle button','data-theme-value','app-album-theme',function(theme){var safe=theme==='dark'?'dark':'light';root.setAttribute('data-theme',safe);root.classList.toggle('dark',safe==='dark');document.querySelectorAll('.theme-toggle button').forEach(function(button){button.setAttribute('aria-pressed',button.getAttribute('data-theme-value')===safe?'true':'false')});try{localStorage.setItem('app-album-theme',safe)}catch(error){}});bind('.direction-toggle button','data-direction-value','app-album-direction',function(direction){var safe=direction==='current'?'current':'proposal';root.setAttribute('data-direction',safe);document.querySelectorAll('.direction-toggle button').forEach(function(button){button.setAttribute('aria-pressed',button.getAttribute('data-direction-value')===safe?'true':'false')});try{localStorage.setItem('app-album-direction',safe)}catch(error){}});function draw(){var owned=0,missing=0,repeated=0;slots.querySelectorAll('.slot').forEach(function(button){var number=Number(button.dataset.sticker),state=states[number];button.classList.toggle('on',state>0);button.classList.toggle('duplicate',state===2);button.querySelector('.count')?.remove();if(state===2)button.insertAdjacentHTML('beforeend','<span class="count">×2</span>');button.setAttribute('aria-label','Lámina '+number+(button.classList.contains('foil')?' especial':'')+', '+(['me falta','pegada','repetida'][state]));button.hidden=(filter==='miss'&&state!==0)||(filter==='rep'&&state!==2);if(state>0)owned++;else missing++;if(state===2)repeated++});var percent=Math.round(owned/24*100),stats=document.querySelectorAll('.stats b'),ring=document.querySelector('.album-head .ring');stats[0].textContent=owned;stats[1].textContent=missing;stats[2].textContent=repeated;ring.querySelector('b').textContent=percent+'%';ring.querySelector('.value').style.strokeDashoffset=163.4*(1-owned/24);ring.querySelector('svg').setAttribute('aria-valuenow',String(percent));ring.querySelector('svg').setAttribute('aria-label',percent+'% completado')}slots.addEventListener('click',function(event){var button=event.target.closest('.slot');if(!button)return;var number=Number(button.dataset.sticker);states[number]=(states[number]+1)%3;draw()});document.querySelector('.filters').addEventListener('click',function(event){var button=event.target.closest('button');if(!button)return;filter=button.textContent==='Me faltan'?'miss':button.textContent==='Repetidas'?'rep':'all';this.querySelectorAll('button').forEach(function(item){item.setAttribute('aria-pressed',item===button?'true':'false')});draw()});draw()})();</script></body></html>\n`;
}

function buildReadme(): string {
  return `# App Álbum — Design Reference (UI-04A.3)\n\nPaquete portable y autocontenido. Abre \`index.html\` mediante \`file://\`.\n\n## Fuente única\n\nLos cuatro archivos se generan desde \`scripts/ui-tokens.ts\`. Current y proposed comparten la misma interfaz semántica; \`build-ui-reference.ts\` no conserva otra paleta.\n\n## Contenido\n\n- \`index.html\`: referencia visual light/dark y current/proposed.\n- \`ui-tokens.css\`: variables generadas.\n- \`design-tokens.json\`: tokens estructurados.\n- \`README.md\`: este documento.\n\nNo contiene runtime Next, CDN, fuentes remotas, secretos ni datos reales. La propuesta sigue aislada y no modifica producto.\n\nLa pila tipográfica es \`"Poppins", ui-rounded, "Trebuchet MS", system-ui, sans-serif\`; el portable puede diferir si Poppins no está instalada, porque no se incrusta como base64/woff2 ni se descarga.\n\nLa identidad definitiva queda fuera de UI-04A.3. Header y empty state reutilizan un placeholder cuadrado simple, con radio y colores obtenidos exclusivamente desde tokens. El resto de los colores, incluidos gradientes y pliegues de láminas, se genera desde \`scripts/ui-tokens.ts\`.\n`;
}

export function buildReferencePackage(): PackageFile[] {
  assertMinRatio(buildProposalContrastPairs());
  const css = buildUiTokensCss();
  return [
    { name: "index.html", contents: buildIndexHtml(css) },
    { name: "ui-tokens.css", contents: css },
    { name: "design-tokens.json", contents: buildDesignTokensJson() },
    { name: "README.md", contents: buildReadme() },
  ];
}

export function buildReferenceZip(): Buffer {
  const entries: ZipEntry[] = buildReferencePackage().map((file) => ({ name: file.name, data: Buffer.from(file.contents, "utf8") }));
  return buildZip(entries);
}

function writeProductiveTokens(): void {
  const productivePath = resolve(process.cwd(), "src/styles/tokens.css");
  mkdirSync(dirname(productivePath), { recursive: true });
  writeFileSync(productivePath, buildProductiveTokensCss(), "utf8");
}

function writePackage(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const file of buildReferencePackage()) writeFileSync(join(OUT_DIR, file.name), file.contents, "utf8");
  writeProductiveTokens();
}

function isMain(): boolean {
  try { return Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]); }
  catch { return false; }
}

if (isMain()) {
  writePackage();
  process.stdout.write(`Wrote design reference to ${OUT_DIR}\n`);
  process.stdout.write(`Wrote productive tokens to ${resolve(process.cwd(), "src/styles/tokens.css")}\n`);
}
