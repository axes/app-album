# UI-02 — Tailwind 4 + daisyUI 5 Theme Foundation

**Proyecto:** App Álbum
**Rama:** `chore/ui-foundation-daisyui5`
**Fase:** UI-02 — cimientos técnicos (implementación)
**Plan de referencia:** `docs/UI_UX_PHASE1_PLAN.md` (UI-01, aprobado)
**Estado:** `READY_FOR_UI_UX_PHASE2_REVIEW`

La implementación y los gates automáticos están completos. La QA visual manual sigue
pendiente y debe realizarse antes de aprobar el cierre visual o iniciar UI-03.

---

## 1. Alcance ejecutado

Se migró la infraestructura de estilos de Tailwind CSS 3.4 a Tailwind CSS 4 con
configuración CSS-first, se instaló daisyUI 5 con **sólo dos temas custom**
(`light` y `dark`), se introdujeron los tokens `--album-*` / `--sticker-*`, los
aliases de compatibilidad y el mapeo a daisyUI.

**No se hizo:**

- no se migró ningún componente a clases daisyUI (`btn`, `card`, `input`, …);
- no se tocó lógica, rutas, autenticación, Server Actions, base de datos ni navegación;
- no se modificó `ThemeToggle`, `THEME_STORAGE_KEY`, `localStorage`,
  `prefers-color-scheme`, el script anti-flash, la clase `dark`, `data-theme`,
  `suppressHydrationWarning` ni `color-scheme`;
- no se añadió Motion ni ninguna librería de animación;
- no se creó ningún primitive en `src/components/ui/`.

---

## 2. Versiones

| Paquete | Antes | Después | Notas |
|---|---|---|---|
| `tailwindcss` | `^3.4.17` (3.4.19 instalado) | `4.3.3` (fijado, sin `^`) | actualización mayor |
| `@tailwindcss/postcss` | — | `4.3.3` (fijado) | sustituye al plugin `tailwindcss` |
| `daisyui` | — | `5.7.47` (fijado) | sólo temas custom `light`/`dark` |
| `autoprefixer` | `^10.4.20` | **eliminado** | Lightning CSS ya prefija |
| `postcss` | `^8.5.1` | `^8.5.1` (sin cambios) | peer de `@tailwindcss/postcss` |
| `next` | `15.5.26` | `15.5.26` | sin cambios |
| `react` / `react-dom` | `19.3.0` | `19.3.0` | sin cambios |
| `vitest` | `2.1.9` | `2.1.9` | sin cambios |

**Piso de navegador asumido (requisito de Tailwind 4):** Safari 16.4+,
Chrome 111+, Firefox 128+.

---

## 3. Cambios por archivo

| Archivo | Cambio |
|---|---|
| `package.json` | `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, `daisyui@5.7.47` fijados; `autoprefixer` retirado |
| `package-lock.json` | regenerado por `npm install` |
| `postcss.config.mjs` | `tailwindcss` + `autoprefixer` → `@tailwindcss/postcss` |
| `tailwind.config.ts` | **eliminado** (configuración CSS-first; ya no se carga) |
| `src/app/globals.css` | reescrito: `@import "tailwindcss"`, `@plugin "daisyui"`, dos temas custom, `@theme static`, tokens `--album-*`/`--sticker-*`, base y reduced-motion |
| `docs/UI_UX_PHASE2_IMPLEMENTATION.md` | este documento (nuevo) |

Total: **6 archivos** (5 modificados/eliminados + 1 nuevo). `docs/UI_UX_PHASE1_PLAN.md`
se conserva sin rastrear.

---

## 4. Arquitectura de tokens

### 4.1 Fuente única por tema

- `--album-*` es la **fuente canónica** de la paleta de producto y se declara
  **una sola vez por selector de tema**: `:root` / `[data-theme="light"]` para
  claro y `[data-theme="dark"]` / `.dark` para oscuro.
- Los tokens `--color-*` de daisyUI **referencian** `var(--album-*)` en lugar de
  repetir los hex (mapeo en §6). Sólo los roles que no existen en la paleta de
  producto (`neutral`, `info` y los `*-content` de `success`/`warning`/`error`)
  conservan un valor literal, declarado una única vez.
- Los nombres antiguos (`--background`, `--surface`, …) siguen existiendo como
  **variables CSS reales** que apuntan a los tokens canónicos (§5), además de
  los aliases de utilidades Tailwind. Así no hay dos paletas paralelas: hay una
  paleta y dos formas de referenciarla.

### 4.2 Tokens `--album-*`

| Token | Light | Dark |
|---|---|---|
| `--album-primary` | `#ea580c` | `#f97316` |
| `--album-primary-content` | `#ffffff` | `#ffffff` |
| `--album-secondary` | `#475569` | `#94a3b8` |
| `--album-secondary-content` | `#ffffff` | `#0f172a` |
| `--album-accent` | `#0e7490` | `#22d3ee` |
| `--album-accent-content` | `#ffffff` | `#0f172a` |
| `--album-background` | `#f8fafc` | `#0f172a` |
| `--album-surface` | `#ffffff` | `#1e293b` |
| `--album-surface-soft` | `#f1f5f9` | `#0b1120` |
| `--album-border` | `#e2e8f0` | `#334155` |
| `--album-input` | `#ffffff` | `#1e293b` |
| `--album-input-border` | `#cbd5e1` | `#475569` |
| `--album-text` | `#0f172a` | `#f8fafc` |
| `--album-text-muted` | `#64748b` | `#94a3b8` |
| `--album-focus` | `#0891b2` | `#06b6d4` |
| `--album-success` | `#10b981` | `#34d399` |
| `--album-warning` | `#b45309` | `#fbbf24` |
| `--album-danger` | `#ef4444` | `#f87171` |

Todos los valores preexistentes se conservan **exactamente**. `--album-focus`
sigue existiendo y ahora también se usa en la regla global `:focus-visible`.

### 4.3 Tokens de dominio de láminas

| Token | Valor | Razón |
|---|---|---|
| `--sticker-owned` | `var(--album-success)` | obtenida = éxito |
| `--sticker-missing` | `var(--album-text-muted)` | neutral distinguible, no depende sólo del color |
| `--sticker-duplicate` | `var(--album-primary)` | repetida = color de marca |

Se resuelven de forma perezosa contra el tema activo, así que no hay que
redeclararlos en `.dark`.

### 4.4 Radios, transiciones y easing

| Token | Valor | Equivalencia |
|---|---|---|
| `--radius-control` | `0.375rem` | `--radius-field` / `--radius-selector` de daisyUI |
| `--radius-card` | `0.5rem` | `--radius-box` de daisyUI |
| `--transition-fast` | `150ms` | — |
| `--transition-normal` | `200ms` | — |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | — |

`--radius-control` y `--radius-card` viven en `@theme static`, por lo que además
generan las utilidades `rounded-control` y `rounded-card` cuando se usen.

---

## 5. Aliases de compatibilidad

La compatibilidad se resuelve en **dos capas**, ambas apuntando a los tokens
canónicos `--album-*` (nunca al revés, así que no hay ciclos de variables):

1. **Variables CSS reales** (`:root` / `[data-theme="light"]` y
   `[data-theme="dark"]` / `.dark`). Cualquier CSS escrito a mano o snippet de
   terceros que todavía lea `var(--surface)` sigue funcionando:

   | Variable antigua | Apunta a |
   |---|---|
   | `--background` | `var(--album-background)` |
   | `--surface` | `var(--album-surface)` |
   | `--surface-muted` | `var(--album-surface-soft)` |
   | `--text` | `var(--album-text)` |
   | `--muted` | `var(--album-text-muted)` |
   | `--border` | `var(--album-border)` |
   | `--input` | `var(--album-input)` |
   | `--input-border` | `var(--album-input-border)` |
   | `--primary` | `var(--album-primary)` |
   | `--primary-text` | `var(--album-primary-content)` |
   | `--focus` | `var(--album-focus)` |
   | `--success` | `var(--album-success)` |
   | `--danger` | `var(--album-danger)` |

2. **Aliases de utilidades Tailwind** (`@theme static`), que es lo que consumen
   los componentes actuales:

   | Utilidad existente | Resuelve a |
   |---|---|
   | `bg-background` | `var(--album-background)` |
   | `bg-surface` | `var(--album-surface)` |
   | `bg-surface-muted` | `var(--album-surface-soft)` |
   | `text-content` | `var(--album-text)` |
   | `text-muted` | `var(--album-text-muted)` |
   | `border-border` | `var(--album-border)` |
   | `bg-input` | `var(--album-input)` |
   | `border-input-border` | `var(--album-input-border)` |
   | `text-primary-text` | `var(--album-primary-content)` |
   | `text-danger` | `var(--album-danger)` |
   | `bg-primary` / `text-primary` / `border-primary` | `var(--color-primary)` (daisyUI) |
   | `bg-success` / `text-success` / `border-success` | `var(--color-success)` (daisyUI) |
   | `border-danger` | `var(--color-danger)` → `var(--album-danger)` |

Aliases nuevos añadidos (disponibles para fases siguientes, sin consumidores
todavía): `bg-secondary`, `text-accent`, `bg-warning`, `bg-sticker-owned`,
`bg-sticker-missing`, `bg-sticker-duplicate`, `rounded-card`, `rounded-control`,
`ease-standard`.

`primary`, `secondary`, `accent`, `success` y `warning` **no** se redeclaran en
`@theme`: daisyUI ya los registra como colores de Tailwind con los valores
configurados, evitando una segunda fuente de verdad.

**Colisión conocida de `--border`:** daisyUI usa `--border` como *ancho* de
borde (`1px`) dentro de `@layer base`, mientras que el alias heredado `--border`
es un *color*. Como los aliases son CSS sin capa, ganan sobre el valor de
daisyUI. Ningún componente usa hoy clases de daisyUI (`.input`, `.select`,
`.table`, …), y la utilidad `.border` de Tailwind fija `1px` en duro, así que
ninguna utilidad en uso se ve afectada; queda documentado como riesgo (§11).

---

## 6. Mapeo a daisyUI 5

Cada token de daisyUI se declara **referenciando** el token canónico, de modo
que el hex vive una sola vez (en el bloque `--album-*` del tema):

| App Álbum (canónico) | daisyUI 5 | Declaración en el tema | Light | Dark |
|---|---|---|---|---|
| `--album-surface` | `--color-base-100` | `var(--album-surface)` | `#ffffff` | `#1e293b` |
| `--album-background` | `--color-base-200` | `var(--album-background)` | `#f8fafc` | `#0f172a` |
| `--album-border` | `--color-base-300` | `var(--album-border)` | `#e2e8f0` | `#334155` |
| `--album-text` | `--color-base-content` | `var(--album-text)` | `#0f172a` | `#f8fafc` |
| `--album-primary` | `--color-primary` | `var(--album-primary)` | `#ea580c` | `#f97316` |
| `--album-primary-content` | `--color-primary-content` | `var(--album-primary-content)` | `#ffffff` | `#ffffff` |
| `--album-secondary` | `--color-secondary` | `var(--album-secondary)` | `#475569` | `#94a3b8` |
| `--album-secondary-content` | `--color-secondary-content` | `var(--album-secondary-content)` | `#ffffff` | `#0f172a` |
| `--album-accent` | `--color-accent` | `var(--album-accent)` | `#0e7490` | `#22d3ee` |
| `--album-accent-content` | `--color-accent-content` | `var(--album-accent-content)` | `#ffffff` | `#0f172a` |
| `--album-success` | `--color-success` | `var(--album-success)` | `#10b981` | `#34d399` |
| `--album-warning` | `--color-warning` | `var(--album-warning)` | `#b45309` | `#fbbf24` |
| `--album-danger` | `--color-error` | `var(--album-danger)` | `#ef4444` | `#f87171` |
| `--radius-control` | `--radius-field`, `--radius-selector` | `var(--radius-control)` | `0.375rem` | `0.375rem` |
| `--radius-card` | `--radius-box` | `var(--radius-card)` | `0.5rem` | `0.5rem` |

Roles **exclusivos de daisyUI** (no existen en la paleta de producto y por eso
se declaran una única vez con valor literal): `--color-neutral`,
`--color-neutral-content`, `--color-info`, `--color-info-content`,
`--color-success-content`, `--color-warning-content` y `--color-error-content`.
`--album-focus` **no** se mapea a `--color-info`: son colores distintos
(`#0891b2`/`#06b6d4` frente a `#0369a1`/`#38bdf8`).

Configuración de densidad y aspecto:

```css
--size-selector: 0.25rem;
--size-field: 0.25rem;
--border: 1px;
--depth: 0;   /* sin sombras: el proyecto no usa shadow-* */
--noise: 0;   /* sin textura */
```

Sólo se habilitan dos temas: `themes: light --default, dark;`. `dark` **no** usa
`--prefersdark`, de modo que daisyUI nunca aplica el tema oscuro por media query:
el único disparador es `[data-theme="dark"]`, que ya escriben el script anti-flash
y `ThemeToggle`. Con JavaScript deshabilitado el resultado es idéntico al anterior
(página en claro), porque la clase `.dark` siempre la añadió el script.

---

## 7. Elección de `secondary`, `accent` y `warning`

Criterio: conservadores, armónicos con la paleta existente (naranja + cian de
foco) y con contraste verificado sobre su propio `*-content`.

| Rol | Light | Contraste | Dark | Contraste | Justificación |
|---|---|---|---|---|---|
| `secondary` | `#475569` (slate-600) | 7.58:1 con `#ffffff` | `#94a3b8` (slate-400) | 6.96:1 con `#0f172a` | acción/identidad secundaria neutra; no compite con el naranja |
| `accent` | `#0e7490` (cyan-700) | 5.36:1 con `#ffffff` | `#22d3ee` (cyan-400) | 9.88:1 con `#0f172a` | acento lúdico contenido, derivado del cian de foco ya presente |
| `warning` | `#b45309` (amber-700) | 5.02:1 con `#ffffff` | `#fbbf24` (amber-400) | 10.69:1 con `#0f172a` | ámbar clásico de advertencia, legible en ambos temas |

Contraste del resto de colores semánticos nuevos (sobre su `*-content`):

| Color | Light | Dark |
|---|---|---|
| `neutral` | `#334155` / `#ffffff` → 10.35:1 | `#475569` / `#f8fafc` → 7.24:1 |
| `info` | `#0369a1` / `#ffffff` → 5.93:1 | `#38bdf8` / `#0f172a` → 8.33:1 |
| `success` | `#10b981` / `#0f172a` → 7.04:1 | `#34d399` / `#0f172a` → 9.29:1 |
| `error` | `#ef4444` / `#ffffff` → 3.76:1 | `#f87171` / `#0f172a` → 6.45:1 |

**Limitaciones heredadas (no introducidas en UI-02, no corregidas aquí):**

- `--album-primary-content` es `#ffffff` en ambos temas (contrato actual de
  `--primary-text`): 3.56:1 en light y 2.80:1 en dark sobre el naranja.
- `text-primary` sobre superficie: 3.56:1 (light) / 5.22:1 (dark).
- `text-success` sobre superficie: 2.54:1 (light) / 7.61:1 (dark).
- `text-danger` sobre superficie: 3.76:1 (light) / 5.29:1 (dark).

Corregirlos cambiaría la paleta actual, lo que queda fuera del alcance de UI-02.

---

## 8. Diferencias Tailwind 3 → 4 y cómo se trataron

| Diferencia | Impacto real en este repo | Tratamiento |
|---|---|---|
| `@tailwind base/components/utilities` → `@import "tailwindcss"` | obligatorio | migrado |
| Plugin PostCSS `tailwindcss` + `autoprefixer` → `@tailwindcss/postcss` | obligatorio | migrado; `autoprefixer` retirado |
| `tailwind.config.ts` deja de cargarse | la config quedaba muerta | archivo eliminado; `content` replicado con `source(none)` + `@source "../**/*.{ts,tsx}"` |
| Color por defecto de `border` pasa de `gray-200` a `currentColor` | **auditado**: los 56 usos de `border` desnudo van siempre acompañados de `border-border` / `border-success` / `border-danger` / `border-primary` | sin cambio visual; no se añadió shim de compatibilidad |
| `rounded` sigue siendo `0.25rem` | 76 usos intactos | verificado en el CSS compilado: `.rounded{border-radius:.25rem}` |
| Renombres (`shadow-sm`→`shadow-xs`, `outline-none`→`outline-hidden`, `ring`→`ring-3`, `flex-shrink-*`→`shrink-*`, `overflow-ellipsis`→`text-ellipsis`, …) | **ninguno usado** (grep sobre `src/`) | sin acción |
| Modificadores de opacidad sobre colores CSS-variable | **ninguno usado** | sin acción; se mantiene la prohibición |
| `dark:` pasa a `prefers-color-scheme` por defecto | rompería el contrato de clase | re-vinculado con `@custom-variant dark (&:where(.dark, .dark *))` |
| `@theme` descarta variables no usadas | `--ease-standard` y `--color-sticker-*` desaparecían del CSS | se usa `@theme static` para emitir siempre todos los tokens |
| `hover:` sólo se aplica en dispositivos con hover | en táctil desaparece el hover “pegajoso” | mejora de comportamiento; sin regresión en escritorio |
| Paleta `neutral-*` expresada en `oklch` | `text-neutral-600`, `bg-neutral-900`, `border-neutral-300` de `src/app/page.tsx` siguen existiendo | visualmente equivalentes |
| `--default-transition-duration` | sigue siendo `150ms` | sin cambio |
| daisyUI emite sus temas built-in `light`/`dark` antes de los custom | los custom ganan por orden de fuente (misma especificidad) | verificado en el CSS compilado |
| Los temas custom de daisyUI repetían los hex de la paleta | dos fuentes de verdad para el mismo color | los `--color-*` ahora referencian `var(--album-*)`; el hex vive una sola vez por tema |
| `--border` es a la vez alias heredado (color) y token de ancho de daisyUI | los aliases sin capa ganan sobre `@layer base` | ningún componente usa clases daisyUI y `.border` de Tailwind fija `1px`; documentado como riesgo (§11) |
| daisyUI añade `:root { background-color: var(--page-scroll-bg, var(--root-bg)) }` y `scrollbar-color` | afecta sólo al área de overscroll y al tinte de la barra de scroll | aceptado y documentado |
| Piso de navegador | Safari 16.4+ / Chrome 111+ / Firefox 128+ | aprobado como requisito técnico de daisyUI 5 |

---

## 9. Reduced motion

Se añadió una política global mínima:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Por qué se consideró seguro:** el repositorio sólo declara dos transiciones
(`transition` y `transition-transform`), ambas decorativas, y ninguna animación.
Ningún indicador funcional (progreso, pending, estados de lámina) depende de
movimiento: el progreso se pinta con `style={{ width }}` y los estados pending son
cambios de texto/opacidad. La regla es reversible y está aislada al final del
archivo.

---

## 10. Contratos preservados (verificado)

| Contrato | Estado |
|---|---|
| `THEME_STORAGE_KEY = "app-album-theme"` | intacto (`src/lib/theme.ts` sin cambios) |
| `localStorage` con precedencia sobre el sistema | intacto |
| `prefers-color-scheme: dark` como fallback | intacto |
| Script anti-flash en `<head>` | intacto; presente en el HTML prerenderizado |
| `classList.toggle('dark', …)` | intacto; cubierto por `src/lib/theme.test.ts` |
| `document.documentElement.dataset.theme` | intacto |
| `suppressHydrationWarning` en `<html>` | intacto |
| `color-scheme: light` / `dark` | intacto (`:root` y `.dark`) |
| Clase `dark` como selector de tema oscuro | intacta |
| `ThemeToggle` (texto, `aria-label`, `aria-pressed`, `title`) | intacto |
| `src/app/layout.tsx` | sin cambios |

---

## 11. Riesgos

| Riesgo | Impacto | Mitigación aplicada / pendiente |
|---|---|---|
| Tailwind 4 es actualización mayor | regresiones visuales sutiles | diff revisado, CSS compilado inspeccionado, QA visual manual pendiente |
| daisyUI impone estilos base/componentes | cambios de altura, radio o foco | `--depth: 0`, `--noise: 0`, radios compactos; ningún componente usa clases daisyUI todavía |
| Dos sistemas de tokens (`--album-*` y `--color-*`) | drift | `--album-*` es canónico; los `--color-*` **referencian** `var(--album-*)`, así que no pueden desincronizarse |
| `--color-primary`/`success`/`secondary`/`accent`/`warning` vienen de daisyUI, no de `@theme` | dependencia implícita | documentado; los valores están fijados en los bloques de tema |
| `--border` alias (color) pisa el `--border` de daisyUI (ancho) | clases de componente daisyUI (`.input`, `.select`, `.table`, …) leerían un color como ancho | hoy ninguna clase daisyUI se usa y `.border` de Tailwind fija `1px`; revisar si una fase futura adopta componentes daisyUI |
| Piso de navegador moderno | usuarios con navegador antiguo pierden estilos | aprobado como requisito; sin polyfills |
| `@theme static` emite variables no usadas | CSS ligeramente mayor (~180 B) | aceptado a cambio de tokens siempre disponibles |
| Regla global de reduced motion | podría neutralizar una animación funcional futura | hoy no existe ninguna; revisar al añadir animaciones |
| `npm run <script>` no resuelve binarios en este entorno | lint/test/build fallan con “not found” | incidencia **preexistente del entorno** (npm 11.18.0 no inyecta `node_modules/.bin` en `PATH`); se ejecutó con `PATH` explícito |
| `next build` exige `AUTH_SECRET` válido | build falla al recolectar datos de página | **preexistente y ajeno a UI-02**; se validó el build inyectando variables de entorno de prueba |

---

## 12. Resultados de validación

Ejecutado en `chore/ui-foundation-daisyui5`, Node `v24.13.0`, npm `11.18.0`.

| Comando | Resultado |
|---|---|
| `npm run lint` (`eslint .`) | ✅ pasa, 0 problemas |
| `npm run test` (`vitest run`) | ✅ 27 archivos pasan, 2 omitidos · 174 tests pasan, 35 omitidos |
| `npm run build` (`next build`) | ✅ compila y genera las 14 rutas (con `AUTH_SECRET`/`DATABASE_URL` de prueba) |
| `git diff --check` | ✅ limpio, sin errores de whitespace |
| Inspección del CSS compilado | ✅ aliases `--*` reales, `--color-*` referenciando `var(--album-*)`, sin ciclos de variables |
| Smoke runtime (`next start` + `curl`) | ✅ `/` 200, `/login` 200, `/register` 200, CSS 200 (59 216 B) |

**Notas honestas:**

1. `npm run build` **sin** variables de entorno válidas falla con
   `Invalid server environment variables: AUTH_SECRET` al recolectar datos de
   `/api/health`. Es un fallo **preexistente** de configuración de entorno
   (`src/lib/env.ts` exige `AUTH_SECRET` de ≥32 caracteres), no relacionado con
   Tailwind ni con daisyUI. Se verificó que el build completo pasa inyectando
   `AUTH_SECRET` y `DATABASE_URL` de prueba.
2. En este entorno `npm run <script>` no encuentra los binarios locales
   (`sh: 1: next: not found`, `sh: 1: eslint: not found`) aunque los symlinks de
   `node_modules/.bin` existen y son ejecutables. Es una particularidad del
   entorno, no del repositorio; los comandos se ejecutaron con
   `PATH="$PWD/node_modules/.bin:$PATH"`.
3. La compilación de Tailwind/daisyUI se confirmó además inspeccionando el CSS
   emitido: `--album-*`, `--sticker-*`, `--radius-*`, `--ease-standard`,
   `--transition-*`, los aliases reales `--background`/`--surface`/…/`--danger`,
   los aliases de utilidad `--color-*`, los temas `[data-theme=light]` /
   `[data-theme=dark]` (y `.dark`) con los valores propios, los `--color-*` de
   daisyUI referenciando `var(--album-*)`, la ausencia de ciclos de variables y
   la ausencia total de bloques `@media (prefers-color-scheme: dark)` que
   pudieran pisar `data-theme`.

---

## 13. Checklist QA

### Automático

- [x] `npm run lint` sin errores
- [x] `npm run test` sin fallos
- [x] `npm run build` correcto
- [x] `git diff --check` limpio
- [x] Sólo los temas `light` y `dark` están habilitados
- [x] Sin bloques `prefers-color-scheme` que alteren `data-theme`
- [x] `--album-*`, `--sticker-*`, radios, transiciones y easing presentes en el CSS compilado
- [x] Aliases CSS reales (`--background`, `--surface`, …, `--danger`) presentes y apuntando a `--album-*`
- [x] `--color-*` de daisyUI referencian `var(--album-*)` (sin hex duplicado en los temas)
- [x] Sin ciclos de variables CSS
- [x] Aliases antiguos (`bg-surface`, `text-content`, `border-border`, …) presentes en el CSS compilado
- [x] `rounded` sigue siendo `0.25rem`
- [x] Script anti-flash presente en el HTML prerenderizado
- [x] Sin `dark:` en componentes, sin modificadores de opacidad sobre variables CSS

### Manual (pendiente de ejecución)

No se ejecutó en este entorno porque no hay navegador gráfico ni Chromium/Firefox,
Playwright o Puppeteer instalados. Las rutas autenticadas y con datos también requieren
un entorno QA preparado. No se instalaron dependencias adicionales ni se utilizaron
datos productivos para simular esta validación.

- [ ] `/` en 375 px, 768 px y escritorio, light y dark
- [ ] `/login` y `/register` en los tres anchos, light y dark
- [ ] `/app` y `/app/albums` (grillas 2/3 columnas, cards, empty states)
- [ ] Detalle de colección `/app/albums/[userAlbumId]` (mosaico, lista, `+`/`−`, `<details>`)
- [ ] Admin de álbum `/admin/albums/[id]` (tabla de láminas, cards desplegables, badges)
- [ ] `/admin/users` (tabla y acciones)
- [ ] `/share/[token]` (vista pública)
- [ ] Sin flash de tema incorrecto al recargar con preferencia guardada
- [ ] Sin warnings de hidratación en consola
- [ ] Foco visible (`:focus-visible`) en ambos temas
- [ ] Controles nativos (select, checkbox, scrollbar) coherentes con `color-scheme`
- [ ] `prefers-reduced-motion: reduce` activo en el sistema: sin transiciones perceptibles

---

## 14. Fuera de alcance / siguientes pasos

- **Precondición obligatoria de UI-03:** resolver la colisión entre el alias heredado
  `--border` (color) y el token `--border` de daisyUI (ancho) antes de incorporar
  cualquier clase de componente daisyUI que lo consuma.
- Migración de componentes a primitives locales que encapsulen daisyUI
  (Button, Field, Badge, Alert, Card) — Etapa 2 del plan UI-01.
- Retirada de los aliases antiguos cuando no queden consumidores.
- Corrección de contraste de `--album-primary-content` y de los textos
  semánticos sobre superficie (requiere decisión de producto).
- `loading.tsx`, skeletons, lazy loading de portadas y microinteracciones.
