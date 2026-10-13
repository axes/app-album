# UI Style Guide — App Álbum

Guía práctica del sistema visual vigente. La referencia ejecutable es `/dev/ui`; sólo está disponible en desarrollo y Vercel Preview.

## Principios

- Interfaz compacta, moderna, clara y agradable, sin saturación.
- Mobile-first, con light/dark coherentes y tokens semánticos compartidos.
- Accesibilidad por defecto: HTML semántico, nombres accesibles, foco visible y reduced motion.
- Microinteracciones suaves de 150–200 ms, sin dependencias de animación.
- Primitives reutilizables en `src/components/ui/`; las páginas no crean una biblioteca visual paralela.

## Estado de esta guía

### Implementado actualmente

- Tokens `--album-*`, temas light/dark, radios semánticos y motion global en `globals.css`.
- Primitives `Button`, `Field`, `InlineMessage`, `PageHeader`, `EmptyState`, `Badge`, `Progress`, `SurfaceCard`, `AppShell` y `ThemeToggle`.
- Referencia `/dev/ui` con foundations, componentes, tabla, motion, portadas/placeholders y responsive.
- Protección server-side fail-closed de `/dev/ui`.

### Recomendado

- Reutilizar tokens y primitives antes de añadir estilos locales.
- Mantener portadas en proporción 3:4, `object-cover`, `rounded-card` y `alt` descriptivo cuando exista una imagen real.
- Usar overlays sólidos sólo cuando aporten información legible.

### Futuro / fuera de UI-04A

- Rediseño de rutas productivas, AlbumCard, tablas administrativas, editor y sharing.
- Cambios a la paleta global definitiva o nuevas variantes de dominio.
- Tokens específicos de sombras si se demuestra una necesidad transversal.

## Tokens

Los tokens `--album-*` definidos en `src/app/globals.css` son la única fuente de verdad de color. DaisyUI y Tailwind apuntan a ellos.

| Grupo | Tokens / utilidades implementadas |
| --- | --- |
| Superficies | `background`, `surface`, `surface-muted` |
| Texto | `content`, `muted` |
| Acción | `primary`, `secondary`, `accent` |
| Estado | `success`, `warning`, `danger`, `info` |
| Estructura | `border`, `input`, `input-border` |
| Interacción | `--album-focus` mediante `:focus-visible` |

Está prohibido hardcodear una paleta paralela o aplicar modificadores como `bg-primary/10` sobre colores CSS-variable. Se usa un token sólido alternativo.

## Tipografía

Implementado en `/dev/ui`:

- display/page title: `text-2xl font-semibold`;
- section title: `text-xl` o `text-base font-semibold`;
- subtitle y texto secundario: `text-muted`;
- body: `text-sm text-content`;
- label: `text-sm font-medium`;
- caption: `text-xs text-muted`;
- link: `text-primary underline`, con hover semántico.

No se introduce una fuente nueva en esta fase.

## Spacing

La referencia principal muestra `1`, `2`, `3`, `4`, `6` y `8` con la escala nativa de Tailwind. Los espaciados `10/12` no forman parte de la referencia principal actual porque no existe uso real relevante en `src`.

- Secciones: `gap-8`.
- Cards: `gap-3`/`gap-4`, normalmente `p-4`.
- Controles: `px-3`/`px-4`.
- Página interna: `px-4 sm:px-6 lg:px-8` y `py-6 sm:py-8`.

## Radius y shadows

La referencia muestra `rounded-sm`, `rounded-md`, `rounded-lg` y `rounded-full`. Los primitives usan además aliases semánticos existentes:

- `rounded-control` para campos, botones y badges;
- `rounded-card` para superficies y portadas.

Sombras disponibles para referencia: `shadow-none`, `shadow-sm`, `shadow-md`, `shadow-lg`. Los primitives base permanecen planos salvo necesidad demostrada.

## Motion y foco

- `--transition-fast` (150 ms), `--transition-normal` (200 ms) y `--ease-standard`.
- `animate-enter` es decorativa.
- `prefers-reduced-motion` neutraliza animaciones/transiciones; el skeleton local también se detiene.
- El foco usa `--album-focus`; nunca depende sólo de color de relleno.

## Tratamiento de imágenes

Implementado en `/dev/ui` sin assets externos:

- proporción recomendada `aspect-[3/4]`;
- contenido equivalente a portada con `object-cover`;
- `rounded-card` y `overflow-hidden`;
- placeholder sin imagen con borde dashed;
- skeleton local que respeta reduced motion;
- overlay opcional sólido y legible.

En producto, toda imagen informativa debe tener `alt`; los placeholders decorativos no deben agregar ruido al árbol accesible.

## Componentes

| Primitive | Propósito y variantes reales | Uso recomendado / anti-pattern |
| --- | --- | --- |
| `Button` | `primary`, `secondary`, `danger`, `ghost`, `link`; `sm`/`md`; disabled y `asChild` | Acción real. No simular botones con `div`. No ofrece loading propio actualmente. |
| `Field` | Unión `input`, `select`, `textarea`; acepta atributos nativos como `password`, `required`, disabled | Usar `label` y `name`. No separar mensajes de su asociación ARIA. |
| `InlineMessage` | `info`, `success`, `warning`, `error`, `pending` | Feedback contextual; no reemplaza validación del campo. |
| `PageHeader` | título, descripción, metadata, acciones | Una cabecera principal por página. |
| `EmptyState` | título; descripción, acción e icon opcionales | Permite simple, con acción o con placeholder visual sin crear otro primitive. |
| `Badge` | `neutral`, `primary`, `secondary`, `accent`, `success`, `warning`, `danger`, `info` | Etiqueta corta no interactiva. |
| `Progress` | determinado; variantes de estado; `label: string` obligatorio | Siempre entrega nombre accesible y valor numérico. No usar sin contexto. |
| `SurfaceCard` | superficie con título `h2`, descripción y acciones opcionales | Agrupar contenido; evitar anidación innecesaria. |
| `ThemeToggle` | selector client-side light/dark persistido | Reutilizar en shells o referencias. |
| `AppShell` | shell compartido; importa `logoutAction` y condiciona navegación/controles según `user` | No se usa en `/dev/ui` para evitar acoplar la referencia a logout/auth. No es un wrapper puramente agnóstico. |

## Interaction rules

- **Hover:** cambio semántico sólido; las filas de referencia usan `hover:bg-surface-muted`.
- **Focus:** visible mediante el token `--album-focus`.
- **Disabled:** conserva legibilidad y comunica indisponibilidad.
- **Loading:** `InlineMessage pending` o skeleton; `Button` no implementa loading propio.
- **Error/success:** usar primitives y roles semánticos; no depender sólo del color.
- **Reduced motion:** ninguna información debe depender de la animación.

## Responsive

`/dev/ui` usa un `<main>` centrado, `max-w-6xl`, padding móvil y spacing vertical consistente. Las rejillas parten de una columna y crecen con `sm`/`lg`; las tablas anchas usan `overflow-x-auto`. QA recomendado: 375 px, 768 px y desktop.

## Protección de `/dev/ui`

Se permite únicamente cuando:

- `process.env.NODE_ENV === "development"`, o
- `process.env.VERCEL_ENV === "preview"` (variable automática de Vercel).

Cualquier otro contexto ejecuta `notFound()`. La ruta es dinámica y declara `noindex, nofollow`; no usa middleware ni autenticación nueva.

## Estándar reutilizable

Patrón recomendado para App Álbum y futuros proyectos:

1. `src/components/ui/` — primitives reales, accesibles y reutilizables.
2. `docs/UI_STYLE_GUIDE.md` — contrato breve y actualizado.
3. `/dev/ui` — referencia viva protegida por entorno.

Los tests son contractuales, sin snapshots frágiles. Los gates son lint, suite, build, `git diff --check` y revisión del estado Git.


## UI-04A.2 — Dirección visual propuesta (experimental)

> **Borrador para evaluación visual — no propagado a producto.** Esta sección y
> los showcases de `/dev/ui` no cambian `src/app/globals.css`, `/app`, `/admin`,
> `/share` ni los componentes productivos. La referencia permite alternar entre
> **Referencia actual** y **Propuesta marca**; `ThemeToggle` sigue siendo
> independiente.

### Rationale

La propuesta reemplaza el naranja/cian genérico de la referencia actual por una
identidad más propia de App Álbum: **violeta de marca** para estructura y acción,
y **naranja sticker** para el lenguaje coleccionable. Los fondos dark usan un
matiz violeta cálido en lugar de un azul-pizarra dominante.

| Token | Actual light / dark | Propuesta light / dark |
| --- | --- | --- |
| primary | `#c2410c` / `#f97316` | `#7c3aed` / `#a78bfa` |
| accent | `#0e7490` / `#22d3ee` | `#f97316` / `#fb923c` |
| background | `#f8fafc` / `#0f172a` | `#faf7ff` / `#1a1424` |
| surface | `#ffffff` / `#1e293b` | `#ffffff` / `#221a30` |
| surface-soft | `#f1f5f9` / `#0b1120` | `#f3edff` / `#2a2138` |
| text | `#0f172a` / `#f8fafc` | `#1a1424` / `#f3edff` |
| text-muted | `#64748b` / `#94a3b8` | `#5b4f7a` / `#b3a8d4` |
| success | `#10b981` / `#34d399` | `#15803d` / `#4ade80` |
| warning | `#b45309` / `#fbbf24` | `#b45309` / `#fbbf24` |
| danger | `#b91c1c` / `#f87171` | `#b91c1c` / `#f87171` |
| focus | `#0891b2` / `#06b6d4` | `#7c3aed` / `#a78bfa` |

Los pares de texto se validan automáticamente a WCAG AA ≥ 4.5:1. Foco,
bordes y estados no textuales se validan a ≥ 3:1. Los estados de lámina nunca
se comunican sólo mediante color: incluyen texto y símbolo.

### Tipografía propuesta

- Headings: `"Poppins", ui-rounded, "Trebuchet MS", system-ui, sans-serif`.
- Texto corrido: fuente de sistema.
- Poppins es una preferencia local. No se descarga desde CDN, no se añade un
  binario y no se embebe base64. Si no está instalada, se usa el fallback
  redondeado/sistema; esta limitación también se documenta en el handoff.

### Forma, tactilidad y motion

- control: `12 px`;
- card: `20 px`;
- sticker: `14 px`;
- pill: `9999 px`;
- botones, fields y destinos móviles de la propuesta: mínimo `44 px`;
- color y borde: `150 ms`;
- progreso y feedback de lámina: `200 ms`;
- botón presionado: desplazamiento leve de 1 px;
- lámina pegada: micro-rebote opcional;
- `prefers-reduced-motion` neutraliza movimiento y transformaciones.

### Lenguaje de producto

`/dev/ui` y el export muestran, sólo como showcase:

- láminas `Me falta`, `Pegada`, `Repetida` y `Especial`;
- progreso de colección;
- album cards con portada, contadores, progreso y badge;
- mensajes con símbolo, texto y color;
- badges tipo píldora;
- estado vacío;
- navegación inferior móvil;
- cards e imágenes con radios más amables.

Estos ejemplos no sustituyen `StickerCollection`, `ProgressSummary`, AlbumCard
ni ninguna tabla o pantalla productiva.

### Design handoff

`npm run ui:export` genera en `artifacts/ui-reference/`:

- `index.html` portable con tema y selector actual/propuesta;
- `ui-tokens.css`, editable y sin recursos externos;
- `design-tokens.json`, con bloques `color.current` y `color.proposed`;
- `README.md` con instrucciones y delimitación experimental;
- el mismo contenido se descarga como ZIP desde `/dev/ui/download`.

No se debe usar **Guardar página como…** sobre `/dev/ui`: esa vista contiene el
runtime de Next.js. El archivo correcto para diseño es el ZIP generado por el
handoff. El equipo de diseño puede devolver `ui-tokens.css`, `index.html` y una
nota indicando qué tema y tokens cambió; la adopción productiva se realiza en
una fase posterior.


## UI-04A.3 — Match visual y tokens centralizados

> **Propuesta experimental y aislada.** UI-04A.3 no modifica
> `src/app/globals.css`, rutas productivas ni primitives. Extiende el handoff y
> el bloque `Propuesta marca` de `/dev/ui` para acercarlos a las referencias
> internas, priorizando dark.

### Arquitectura

`scripts/ui-tokens.ts` es la única fuente de colores concretos. `current.light`,
`current.dark`, `proposed.light` y `proposed.dark` comparten la misma interfaz
semántica: superficies, foregrounds, acciones, estados, foco y estados de
lámina. El generador itera esa estructura para producir `ui-tokens.css`,
`design-tokens.json` e `index.html`; no mantiene otra paleta manual.

Los nombres canónicos describen función (`foreground`, `primaryForeground`,
`surfaceSoft`, `stickerSpecial`) y no colores. Los swatches pintan con variables
y muestran como texto el valor leído desde la fuente. Hover, fondos suaves y
focus rings se derivan con `color-mix()`. Los gradientes de lámina y el pliegue
que necesitan valores exactos usan los tokens semánticos `stickerOwnedEnd`,
`stickerSpecialEnd` y `stickerFold`, también definidos en `scripts/ui-tokens.ts`.

La identidad gráfica definitiva queda fuera de UI-04A.3. Header y empty state
reutilizan un placeholder cuadrado simple, con radio y colores obtenidos
exclusivamente desde tokens. No existe una excepción de color fijo en los
consumidores ni un SVG de identidad en esta fase.

### Ajustes respecto de UI-04A.2

| Token | UI-04A.2 light / dark | UI-04A.3 light / dark |
| --- | --- | --- |
| primary | `#7c3aed` / `#a78bfa` | `#4a1fb8` / `#a78bfa` |
| accent | `#f97316` / `#fb923c` | `#d93a00` / `#ff7a3d` |
| background | `#faf7ff` / `#1a1424` | `#f7f5ff` / `#120b2e` |
| surface | `#ffffff` / `#221a30` | `#ffffff` / `#1d1347` |
| surfaceSoft | `#f3edff` / `#2a2138` | `#efebfb` / `#160e3a` |
| border | `#e5dcfb` / `#3a2f4e` | `#ddd6f3` / `#36286e` |
| foreground | `#1a1424` / `#f3edff` | `#170b4a` / `#f4f1ff` |
| focus | `#7c3aed` / `#a78bfa` | `#6d43e8` / `#c4b5fd` |

Forma y motion se centralizan como `radiusControl` (12 px), `radiusCard`
(20 px), `radiusSticker` (14 px), `radiusPill`, `shadowSm/Md/Lg`,
`motionFast` (150 ms), `motionNormal` (200 ms) y `motionSpin` (800 ms).

### Lenguaje visual cubierto

- cabecera editorial compacta y placeholder cuadrado token-driven, reutilizado
  en header y empty state;
- paleta y pares de contraste light/dark;
- escala tipográfica: display 2 rem/700, título 1.375 rem/600, subtítulo 1 rem,
  cuerpo .9375 rem, etiqueta .8125 rem/600 y leyenda .75 rem;
- botones, campos, mensajes con iconos SVG y badges píldora;
- álbum con progress ring, estadísticas, filtros y 24 láminas; la demo mantiene
  estado sólo en memoria y cicla `missing → owned → duplicate → missing` sin DB,
  persistencia ni reutilización de lógica productiva;
- láminas foil en 1, 8, 16 y 24, repetidas con `×2` y pliegue derivado;
- listado lateral de álbumes, barras de progreso, empty state y dock móvil;
- pop, spinner y reduced motion.

En el portable, `data-direction` vive en `document.documentElement`, por lo que
la propuesta controla el fondo y texto globales. En `/dev/ui` se conserva en
`<main id="dev-ui">` para no afectar el chrome de desarrollo.

La pila de títulos es `"Poppins", ui-rounded, "Trebuchet MS", system-ui,
sans-serif`. Poppins no se incrusta como base64/woff2 ni se descarga; por eso el
portable puede diferir tipográficamente cuando la fuente no está instalada.

El guard `scripts/centralization.test.ts` impide reintroducir HEX/RGB concretos
en `src/app/dev/ui/page.tsx`, `src/app/dev/ui/sticker-demo.tsx` y
`scripts/build-ui-reference.ts`, sin excepciones para identidad. Los
tests de contraste WCAG y export portable continúan siendo gates obligatorios.


## UI-05A — Adopción del design system en AppShell y navegación

> **Adopción productiva del set visual de UI-04A.3.** Esta fase migra
> `AppShell`, la navegación desktop y el dock móvil para consumir los
> mismos tokens que `/dev/ui` y el handoff. No introduce una segunda
> paleta y no modifica la lógica de auth, permisos ni DB.

### 1. Promoción de tokens productivos

`scripts/ui-tokens.ts` sigue siendo la **única fuente de verdad** de
colores. La UI-05A añade exports `productive*` que **referencian** los
`proposal*` ya existentes; no duplican HEX ni redefinen valores:

| Export productivo | Apunta a |
| --- | --- |
| `productiveColorTokens` | `proposalColorTokens` |
| `productiveRadiusTokens` | `proposalRadiusTokens` |
| `productiveShadowTokens` | `proposalShadowTokens` |
| `productiveMotionTokens` | `motionTokens` |
| `productiveTypographyTokens` | `typographyTokens` |

Estos aliases son el único punto donde se decide qué set alimenta la
UI productiva. UI-04A.3 sigue leyendo `proposal*` directamente y no se
ve afectado.

### 2. `src/styles/tokens.css` como artefacto generado

`scripts/build-ui-tokens-css.ts` (nuevo) exporta
`buildProductiveTokensCss(): string`, que produce un bloque
`:root,[data-theme="light"] { ... }` y
`[data-theme="dark"],.dark { ... }` leyendo exclusivamente de los
exports `productive*`. Declara los `--album-*` y los `--color-*`
(Tailwind) y los `--radius-control`, `--radius-card`,
`--radius-sticker`, `--radius-pill`, `--shadow-sm`, `--shadow-md`,
`--shadow-lg` y `--motion-*`.

`npm run ui:export` se extiende con un sub-paso que escribe
`src/styles/tokens.css`. La salida es legible, se considera artefacto
**versionado** y se regenera cuando cambian los `productive*`.

`src/app/globals.css` sustituye los HEX inline por
`@import "../styles/tokens.css";` al inicio del archivo. La paleta
deja de vivir duplicada en `globals.css`; pasa a vivir generada en
`tokens.css` desde `scripts/ui-tokens.ts`.

### 3. Guard de desincronización

`scripts/build-ui-tokens-css.test.ts` (nuevo) compara byte a byte
`src/styles/tokens.css` con la salida recalculada en memoria desde los
exports `productive*`. Si difiere, falla con mensaje claro. Un cambio
en `scripts/ui-tokens.ts` que olvide regenerar `src/styles/tokens.css`
rompe la suite.

### 4. AppShell editorial

`AppShell` reescrito visualmente con el mismo contrato de props
(`user?: AppShellUser | null` y `children`). Mantiene
`import { logoutAction }` y sigue siendo auth-agnóstico.

- **Header:** placeholder cuadrado (`LogoPlaceholder`) + nombre "App
  Álbum" a la izquierda; `NavLink` a la derecha con la nav principal
  (`Mis álbumes` → `/app`, `Explorar álbumes` → `/app/albums`); las
  entradas admin (`Administrar álbumes` → `/admin/albums`,
  `Administrar usuarios` → `/admin/users`) sólo se renderizan cuando
  `user.role === "admin"`. El extremo derecho aloja `ThemeToggle`,
  `username` y un logout envuelto en `<form action={logoutAction}>`
  con un `Button` consistente.
- **Mobile (<md):** el header se reduce (oculta la nav principal) y
  el `MobileNav` toma el protagonismo. Las entradas admin no se
  muestran en el header móvil; permanecen accesibles vía desktop.
- **Sin cambios** en la lógica de auth, sesión, permisos ni DB.

### 5. Navegación desktop

- `Mis álbumes` → `/app`.
- `Explorar álbumes` → `/app/albums`.
- Si `role === "admin"`: `Administrar álbumes` → `/admin/albums` y
  `Administrar usuarios` → `/admin/users`.
- Vista pública (sin `user`): `Iniciar sesión` → `/login` y
  `Crear cuenta` → `/register`.
- Estado activo centralizado en `NavLink` (cliente) — ver §7.

### 6. Dock móvil de 2 destinos reales

`src/components/ui/mobile-nav.tsx` (nuevo) es un Server Component que
renderiza el dock inferior con `MOBILE_NAV_ITEMS`:

| Slot | Etiqueta | Ruta | Estado |
| --- | --- | --- | --- |
| 1 | Mis álbumes | `/app` | definitivo |
| 2 | Explorar | `/app/albums` | definitivo |

Reglas estrictas aplicadas en UI-05A:

- **Sólo destinos reales.** No se renderizan botones `disabled` ni
  placeholders sólo para completar cuatro posiciones.
- **Geometría preparada para crecer.** La grid del dock se dimensiona
  por `MOBILE_NAV_ITEMS.length` (2 columnas en UI-05A), con
  `min-h-12` (≥48 px) por slot. Cuando existan rutas reales para
  `Me faltan`, `Cambios` y `Perfil`, basta extender la lista; no
  hace falta tocar la geometría.
- **Visibilidad responsive.** El dock se oculta en `>=md`; el
  padding inferior de `<main>` se reserva sólo en `<md` para evitar
  que el contenido quede tapado.
- **Estado activo vía `NavLink`**: `aria-current="page"` se aplica
  por construcción (ver §7).
- **`aria-label` por slot** y por región (`"Navegación inferior"`).

### 7. `NavLink` como única fuente de `aria-current`

`src/components/ui/nav-link.tsx` (nuevo, cliente) recibe `href`,
`children`, `className` opcional y un `prematch` opcional para
prefijos. Internamente:

- Usa `usePathname()`.
- Aplica `aria-current="page"` si `pathname === href` o si
  `pathname?.startsWith(prematch ?? href)`.
- Es el **único** punto del shell donde se aplica `aria-current`. Los
  hrefs declarados son disjuntos (`/app`, `/app/albums`,
  `/admin/albums`, `/admin/users`, `/login`, `/register` y los
  `MOBILE_NAV_ITEMS`), por lo que dos `NavLink` no pueden compartir
  el mismo `aria-current` en un render.

El test `src/components/ui/app-shell.test.tsx` cubre
explícitamente la unicidad de `aria-current` en header y dock para
los casos normal y admin.

### 8. Placeholder cuadrado

`src/components/ui/logo-placeholder.tsx` (nuevo) renderiza
`<span role="img" aria-label="Logo de App Álbum" class="logo-placeholder" />`
con `aspect-ratio: 1`, `bg-primary`, `border border-border` y
`rounded-control`. **Sin SVG, sin `linearGradient`, sin HEX inline.**
Reutilizable en header y, en el futuro, en empty states.

### 9. `ThemeToggle` preservado

`ThemeToggle` mantiene su contrato: storage key
`app-album-theme`, valores `light`/`dark`, persistencia en
`localStorage` con fallback `prefers-color-scheme`, atributos
`data-theme` + `.dark` + `color-scheme`, anti-flash en
`src/app/layout.tsx` y `suppressHydrationWarning`.

En UI-05A los glifos Unicode `☀️/🌙` **se conservan** y no se
sustituyen por SVG inline. La revisión visual queda abierta: si
desentonan con la nueva dirección visual, se cambian en una fase
posterior dedicada, sin tocar el resto del toggle. El
`aria-label` y el `aria-pressed` no se modifican.

### 10. Reglas de guard

- `scripts/centralization.test.ts` extiende `KEY_FILES` con
  `app-shell.tsx`, `mobile-nav.tsx`, `nav-link.tsx`,
  `logo-placeholder.tsx` y `build-ui-tokens-css.ts`: cero HEX/RGB
  concretos en esos consumidores.
- `scripts/build-ui-tokens-css.test.ts` (nuevo) garantiza que
  `src/styles/tokens.css` permanece sincronizado con los
  `productive*` exports.

### 11. QA visual pendiente

Sin navegador en este entorno (no hay Chromium/Firefox/Playwright),
la QA visual a 375 px / 768 px / desktop en light y dark **queda
pendiente** y se documenta en `FINAL_REPORT.md`. La verificación
contractual se realiza con tests (vitest) y los gates
`npm run lint`, `npm run test`, `npm run build` y `git diff --check`.

Casos visuales a validar manualmente en el siguiente turno con
navegador:

- header editorial a 375 px, 768 px y desktop (light y dark);
- dock móvil con 2 items a 375 px y 768 px (en `>=md` debe ocultarse);
- persistencia de `ThemeToggle` y anti-flash;
- `aria-current="page"` único en cada render (header y dock);
- padding inferior de `<main>` para que el contenido no quede tapado
  por el dock;
- vista admin: `/admin/albums` y `/admin/users` sólo con
  `role === "admin"`;
- vista sin sesión: nav pública (`/login`, `/register`).

### 12. Estado y gates

- `npm run ui:export` regenera `src/styles/tokens.css`.
- `npm run lint`, `npm run test`, `npm run build` y
  `git diff --check` pasan en local.
- Estado final del task: `READY_FOR_UI_05A_APPSHELL_NAVIGATION_REVIEW`.
- Sin `git add`, `commit`, `push`, `PR`, `merge` ni `deploy`.

## UI-05B — Biblioteca de álbumes y AlbumCard

> **Promoción productiva de la familia `AlbumCard`.** `AlbumCover`,
> `AlbumProgress`, `AlbumCard` y `EmptyLibrary` viven ahora en
> `src/components/albums/` y son los componentes oficiales del dominio.
> Las páginas `/app` y `/app/albums` se recompusieron alrededor de ellos
> sin tocar la lógica de `CollectionService`, `getCurrentUser`, ni
> ninguna ruta de detalle, admin o sharing.

### 1. `AlbumCard` y su contrato de `action`

`AlbumCard` es un Server Component que recibe un `action`
discriminado por tipo:

| `kind` | Datos adicionales | Render |
| --- | --- | --- |
| `open` | `href`, `label?` | `<Button asChild>` apuntando a `href` (default "Abrir álbum"). |
| `in-collection` | `href` | `<Badge variant="success">En mi colección</Badge>` + `<Button asChild variant="secondary">` al detalle. |
| `add` | `albumId` | `<AddAlbumButton albumId={albumId} />` (Server Action intacta). |

El wrapper es `<article aria-labelledby="...">` con un `<h2>` interno
(`id={titleId}` estable, derivado del slug del título). El motivo de
la unión discriminada es semántico: un link y un form con Server
Action son cosas distintas; una `mode: "owned" | "explore"` obligaría
a derivar `userAlbumId` en el sitio de uso, mientras que la prop
`action` permite pasar el nodo ya listo.

### 2. `AlbumCover` (placeholder token-driven 3:4)

Server Component sin `"use client"`; consume `coverUrl: string | null`.

- Wrapper: `relative aspect-[3/4] w-full overflow-hidden rounded-card border border-border bg-surface-soft`.
- Cuando `coverUrl` es `null`: composición CSS-only con un banda
  diagonal `linear-gradient(135deg, var(--album-primary), transparent)`
  (sin `<svg>` y sin `linearGradient` literal en CSS), un sello
  circular en `bg-accent`, y las iniciales del título centradas en
  `text-muted`. La cubierta decorativa lleva `aria-hidden`; el texto
  accesible vive en un `<span class="sr-only">`.
- Cuando `coverUrl` existe: renderiza `<img>` nativo con
  `alt={`Portada de ${title}`}` y `object-cover`. **No** usa
  `onError` para no requerir `"use client"`.
- La guard de centralización (`scripts/centralization.test.ts`)
  bloquea el alta de `<svg`, `linearGradient` o `data:image/` en el
  archivo fuente.

### 3. `AlbumProgress` y la barra productiva

- Server Component que envuelve al primitive `<Progress>`.
- Mantiene la API pública `{ progress, detailed? }` y delega la
  curva violeta (track `bg-primary`) al primitive. Verde (`success`)
  queda reservado para los badges de completado y otros finales
  productivos; el productive bar ya no usa `bg-success` directo.
- Exporta el helper puro `deriveProgressState(progress: Progress): ProgressState`
  para que las pruebas unitarias y el badge de estado compartan
  exactamente la misma regla:

  | Estado | Regla |
  | --- | --- |
  | `low` | `percentage < 25` |
  | `in_progress` | `25 <= percentage < 100` |
  | `complete` | `owned >= total` (con `total > 0`) o `percentage >= 100` |

### 4. `EmptyLibrary`

Server Component que consume `EmptyState`, `LogoPlaceholder` y un
`<Button asChild>` hacia `/app/albums`. El `username` se usa sólo si
está disponible para personalizar la descripción ("Hola, {user}.
Empieza explorando el catálogo.").

### 5. Migraciones de componentes productivos

- `src/app/app/progress.tsx` reescrito por dentro para delegar en
  `AlbumProgress`. La firma `{ progress, detailed }` y el comportamiento
  del Server Component se conservan, así que `ProgressSummary` sigue
  importándose igual.
- `src/app/app/albums/add-button.tsx` migrado a `<Button>` +
  `<InlineMessage variant="error">`. La Server Action `addAlbumAction`
  y el contrato `CollectionActionState` permanecen bit-a-bit. El
  botón envía con `type="submit"` y `disabled={pending}`; el error
  se renderiza como `InlineMessage` con `role="alert"`.

### 6. Páginas `/app` y `/app/albums`

Ambas usan `<PageHeader>` + `<ul role="list" aria-label="..." class="grid animate-enter grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">`.
Cada `<li>` envuelve un `<AlbumCard className="w-full">` y delega en
la prop `action`:

- `/app`: siempre `action.kind === "open"` apuntando a
  `/app/albums/{entry.id}`. Cuando la lista está vacía, se monta
  `<EmptyLibrary>`.
- `/app/albums`: `action.kind` alterna entre `"in-collection"` (si
  `userAlbumId !== null`) y `"add"`. `meta` se deriva a
  `"{stickerCount} láminas"`. Cuando la lista está vacía, se monta
  un `<EmptyState>` simple sin acción.

### 7. Responsive

- `< sm` (375 px): `grid-cols-1`.
- `sm` (≥ 640 px): `grid-cols-2`.
- `lg` (≥ 1024 px): `grid-cols-3`.
- El dock móvil (`<md`) ya reserva `pb-24 md:pb-6` para que el
  último `Abrir álbum` no quede tapado al hacer scroll al fondo.

### 8. Estados de progreso y variantes de badge

| Estado | Texto | Variante de `Badge` |
| --- | --- | --- |
| `low` | "Bajo" | `info` |
| `in_progress` | "En progreso" | `primary` |
| `complete` | "Completo" | `success` |

Los badges no dependen sólo del color: el texto va siempre explícito.

### 9. Accesibilidad

- `<h1>` en `PageHeader`, `<h2>` por `AlbumCard` con id estable.
- `aria-label` en el `<ul>` describe la colección ("Mis álbumes" /
  "Álbumes disponibles").
- El placeholder es decorativo (`aria-hidden` + `sr-only`); la
  portada real lleva `alt={`Portada de ${title}`}`.
- `--album-focus` sigue activo por defecto para todos los enlaces y
  botones de la card.

### 10. Reglas de guard

- `scripts/centralization.test.ts` extiende `KEY_FILES` con los
  nuevos archivos productivos. La guard `<svg|linearGradient|data:image/`
  protege específicamente a `album-cover.tsx`.
- Los gates `npm run lint`, `npm run test`, `npm run build` y
  `git diff --check` deben pasar en local.

### 11. QA visual pendiente

Sin navegador en este entorno, la QA visual a 375 px / 768 px /
desktop × light/dark queda pendiente y se documenta en
`FINAL_REPORT.md`. La verificación contractual se realiza con
Vitest + los gates mencionados.

Casos visuales a validar manualmente:

- grid responsive de `/app` y `/app/albums` en 375 / 768 / desktop;
- placeholder de `AlbumCover` con iniciales correctas y sin contraste roto;
- portada real con `alt` descriptivo y `object-cover`;
- hover / focus sobre la card: sombra cambia y vuelve al salir;
- badge `Bajo` / `En progreso` / `Completo` por porcentaje;
- agregar álbum desde `/app/albums`: botón pasa a "Añadiendo…" y el
  error se muestra como `InlineMessage` si lo hay;
- quitar álbum desde la card de detalle: modal UI-05A intacto;
- dock móvil no tapa el último `Abrir álbum` al scrollear al fondo;
- lector de pantalla anuncia `<h2>` por card y `aria-label` por `<ul>`.

### 12. Estado y gates

- Estado final del task: `READY_FOR_UI_05B_ALBUM_LIBRARY_REVIEW`.
- Sin `git add`, `commit`, `push`, `PR`, `merge` ni `deploy`.


## UI-05C — Detalle de colección y mosaico de láminas

La ruta `/app/albums/[userAlbumId]` usa una composición editorial abierta: portada 3:4 contenida, identidad y acciones separadas por ritmo y bordes, sin una card envolvente. `CollectionSummary`, mediante `AlbumProgress detailed`, es la única fuente visible de `X / Y`, porcentaje, faltantes y repetidas. Sharing se integra como zona secundaria sin panel anidado y el modal existente de quitar álbum permanece intacto.

El selector Mosaico/Lista es un control segmentado con `aria-pressed`, foco visible y targets mínimos de 44 px. Las secciones exponen nombre, `X / Y`, affordance y `aria-expanded`; empiezan colapsadas. El mosaico usa 2 columnas en móvil, 3 desde `sm` y 4/5 en desktop; la lista se apila en móvil.

Los estados de lámina se derivan exclusivamente de `quantity`: `0` es **Faltante** con `--album-sticker-missing`, `1` es **Obtenida** con `--album-sticker-owned`, y `>1` es **Repetida** con `--album-sticker-duplicate` y cantidad `×N` prominente. No existe estado Especial en producto. Los controles conservan formularios separados, límites 0/1000, payloads existentes y labels `Añadir copia de lámina {code}` / `Quitar copia de lámina {code}`; todos miden al menos 44 px.

No se usan HEX/RGB ni modificadores de opacidad Tailwind sobre colores variables. La QA visual pendiente cubre 375 px, 768 px y desktop en light/dark, incluido el espacio protegido por el dock móvil.
