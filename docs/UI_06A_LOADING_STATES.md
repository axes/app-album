# UI-06A — Estados de carga (loading.tsx + skeletons)

Estado: implementado, pendiente de revisión (`READY_FOR_UI_06A_LOADING_REVIEW`).
Rama: `feat/ui-collection-detail`. Sin commit, sin push, sin PR.

---

## 1. Problema

Todas las rutas con datos son dinámicas (`force-dynamic`, runtime `nodejs`) y
consultan PostgreSQL (Neon) en cada navegación. Antes de esta fase **no existía
ningún `loading.tsx` en `src/app`**, así que Next.js no tenía nada que pintar
mientras el servidor resolvía la consulta: la navegación se percibía congelada
hasta que llegaba el RSC completo.

Las rutas dinámicas del build previo eran `/app`, `/app/albums`,
`/app/albums/[userAlbumId]`, `/admin/albums`, `/admin/albums/[id]`,
`/admin/users` y `/share/[token]`. Las estáticas (`/`, `/login`, `/register`) no
necesitan boundary y no se tocaron.

---

## 2. Alcance

### Dentro de alcance

- Primitivas `Skeleton` y `LoadingRegion` en `src/components/ui/`.
- Cuatro boundaries de ruta (`loading.tsx`).
- Tests de la primitiva y del contrato compartido de los boundaries.
- Esta documentación.

### Fuera de alcance (no tocado)

- `actions.ts`, `CollectionService`, `DrizzleCollectionRepository`, Drizzle,
  migraciones, DB.
- `page.tsx` de cualquier ruta, layouts, `AppShell`, `AlbumCard`, `AlbumCover`.
- `scripts/ui-tokens.ts`, `src/styles/tokens.css`, paleta global.
- Primitivas existentes en `src/components/ui/`.
- `error.tsx` (bloque B, fase separada).

---

## 3. Primitivas

### `Skeleton`

Bloque decorativo dirigido por tokens. Siempre `aria-hidden="true"`: un
placeholder no transporta información. Usa `bg-surface-muted` (token
`--album-surface-soft`) y `rounded-control`, con `animate-pulse`.

El pulso es decorativo y queda neutralizado por la guarda global
`prefers-reduced-motion` de `globals.css`, que fija
`animation-duration: 0.01ms !important` y `animation-iteration-count: 1
!important`. No se añadió CSS nuevo.

### `LoadingRegion`

Envoltorio accesible que posee el **único** anuncio de un boundary:

```tsx
<div role="status" data-testid="loading-region">
  <span className="sr-only">{label}</span>
  <div aria-hidden="true">{children}</div>
</div>
```

Contrato de accesibilidad:

| Propiedad | Garantía |
|---|---|
| Región viva | Exactamente una `role="status"` por boundary |
| Anuncio | El `label` es el único texto expuesto a tecnología asistiva |
| Geometría | El contenedor visual completo es `aria-hidden` |
| Foco | Ningún placeholder es focusable; no se puede tabular dentro de un skeleton |

No se usa `aria-busy`: en una región viva, `aria-busy="true"` que nunca vuelve a
`false` puede suprimir el anuncio. La región se desmonta cuando llega el
contenido real, así que el anuncio ocurre una sola vez.

---

## 4. Boundaries

| Archivo | Cubre | Espeja |
|---|---|---|
| `src/app/app/loading.tsx` | `/app`, `/app/albums` | `PageHeader` + grid de `AlbumCard` |
| `src/app/app/albums/[userAlbumId]/loading.tsx` | `/app/albums/[userAlbumId]` | `AlbumDetailHero` + `StickerCollection` |
| `src/app/admin/loading.tsx` | `/admin/albums`, `/admin/users` | `PageHeader` + tabla |
| `src/app/admin/albums/[id]/loading.tsx` | `/admin/albums/[id]` | nav + header + 3 cards |

### Herencia

Un `loading.tsx` aplica al segmento y a sus hijos. Por eso
`src/app/app/loading.tsx` cubre también `/app/albums/[userAlbumId]`, y ese
segmento declara su propio boundary para reemplazarlo. Lo mismo ocurre entre
`src/app/admin/loading.tsx` y `src/app/admin/albums/[id]/loading.tsx`.

### Ubicación respecto del layout

Los boundaries de `/app` y `/admin` viven **dentro** de sus layouts, que ya
resolvieron `getCurrentUser()` y redirigieron si correspondía. El shell
autenticado (header, navegación, dock móvil) permanece pintado mientras carga el
contenido; nunca se muestra un skeleton a un usuario sin sesión.

### `/admin/albums/new`

Hereda el boundary de `/admin`, pero su componente de página es síncrono y no
suspende, así que el fallback no se pinta. No se añadió un boundary propio.

---

## 5. Fidelidad de geometría

Cada boundary replica la estructura real para que el intercambio a contenido
definitivo no mueva la página:

- **Grid de álbumes**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, card
  `max-w-xs` con portada 3:4 limitada a `10rem`, dos líneas de título, una línea
  editorial, badge, barra de progreso y CTA.
- **Detalle de colección**: hero `sm:grid-cols-[10rem_minmax(0,1fr)]` con borde
  inferior, y mosaico `grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]` con cards
  `rounded-sticker`.
- **Tablas admin**: mismas columnas y anchos que la tabla real.

---

## 6. Hallazgo: el boundary cambia el status HTTP de `redirect()` y `notFound()`

### Mecanismo

`loading.tsx` envuelve el segmento en un límite de Suspense. En una ruta
`force-dynamic`, Next.js empieza a transmitir el shell —y por tanto compromete
las cabeceras con 200— antes de que el contenido termine de resolver. Si el
`redirect()` o el `notFound()` ocurren **dentro** de ese límite, ya no pueden
producir un 307 ni un 404: el redirect se resuelve en el cliente y el not-found
se renderiza sobre un 200.

Lo que queda **fuera** del límite no se ve afectado: el `redirect()` de
`src/app/app/layout.tsx` y `src/app/admin/layout.tsx` corre antes de entrar al
Suspense, así que conserva su 307.

### Medición A/B (build de producción, `next start`)

Sesión autenticada obtenida sellando una cookie de iron-session contra la base
local; sin sesión para los casos públicos.

| Ruta | Sin `loading.tsx` | Con `loading.tsx` |
|---|---|---|
| `/app` (sin sesión) | 307 → `/login` | **307 → `/login`** |
| `/admin/albums` (sin sesión) | 307 → `/app` | **307 → `/app`** |
| `/app/albums/<id inválido>` (con sesión) | 307 → `/app` | **200** |
| `/app/albums/<id inexistente>` (con sesión) | 307 → `/app` | **200** |
| `/admin/albums/<id inválido>` (con sesión) | 404 | **200** |
| `/share/<token inválido>` (público) | 404 | **200** |

En los tres casos degradados el cuerpo sigue conteniendo la UI correcta
(`NEXT_REDIRECT` para el redirect de la página de detalle, «This page could not
be found» para los not-found), así que **el comportamiento visible para la
persona usuaria no cambia**; lo que cambia es el código de estado.

### Decisión

- **Se conservan** los cuatro boundaries. En `/app` y `/admin/*` el redirect del
  layout mantiene su 307 y no hay `notFound()` de página. En las dos rutas de
  detalle el status cambia, pero son rutas autenticadas, el resultado visible es
  idéntico y son justamente las páginas más pesadas: es donde el boundary aporta
  más.
- **Se retira** `src/app/share/[token]/loading.tsx`. Es la única ruta pública y
  su 404 está documentado como contrato («responde uniformemente como no
  encontrada ante tokens inválidos, sharing deshabilitado o álbum eliminado»).
  El boundary aportaba poco ahí —una sola consulta— y rompía ese contrato.

### Alternativa descartada

Un `<Suspense>` explícito **dentro** de la página, envolviendo sólo el subárbol
que consulta datos, conserva el status. Requiere reestructurar cada `page.tsx`
en un shell síncrono más un componente asíncrono de datos, lo que sale del
alcance declarado (los `page.tsx` no se tocan) y no resuelve el caso de
`notFound()`, que depende del resultado de la consulta.

---

## 7. Tests

### `src/components/ui/skeleton.test.tsx` (7)

`Skeleton` es `aria-hidden`, usa los tokens compartidos y acepta `className`.
`LoadingRegion` expone una sola región `status` con su label, oculta la
geometría, no renderiza nada focusable y acepta `className`.

### `src/app/loading-states.test.tsx` (12)

Los cuatro boundaries son composiciones presentacionales sin lógica propia, así
que su contrato real es el mismo en todos: exactamente una región `status`, al
menos un placeholder y nada focusable. Se verifica una vez para los cuatro, con
`it.each` sobre `CASES`; agregar un boundary nuevo sólo requiere sumarlo a esa
lista.

`AppShell` se mockea como passthrough porque ya tiene su propia suite; así este
archivo no necesita mockear la Server Action de logout, el toggle de tema ni
`next/link`.

---

## 8. Validaciones

```bash
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run lint
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run test
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run build
git diff --check
```

---

## 9. Pendiente

- QA visual real a 375 px / 768 px / escritorio en light y dark. El entorno no
  tiene Chromium, Firefox, Playwright ni Puppeteer, así que no es verificable
  localmente.
- Verificación de la Preview de Vercel en el lado del usuario.
- Bloque B (`error.tsx` por segmento) queda para una fase separada.
