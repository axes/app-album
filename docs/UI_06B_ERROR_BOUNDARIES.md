# UI-06B — Error boundaries por segmento (`error.tsx`)

Estado: implementado, pendiente de revisión (`READY_FOR_UI_06B_ERROR_BOUNDARIES_REVIEW`).
Rama: `feat/ui-collection-detail`. Sin commit, sin push, sin PR.

---

## 1. Problema

Antes de esta fase **no existía ningún `error.tsx` ni `global-error.tsx` en
`src/`**. Un error inesperado de carga, render o Server Action caía en la pantalla
por defecto de Next.js: fuera del design system, sin acción de reintento y sin
salida de navegación.

---

## 2. Alcance

### Dentro de alcance

- Primitiva `ErrorState` en `src/components/ui/`.
- Dos boundaries de ruta (`error.tsx`).
- Tests de la primitiva y del contrato compartido de los boundaries.
- Esta documentación.

### Fuera de alcance (no tocado)

- `actions.ts`, `CollectionService`, `DrizzleCollectionRepository`, Drizzle,
  migraciones, DB, auth.
- `page.tsx` de cualquier ruta, `layout.tsx`, `AppShell`.
- `loading.tsx` de UI-06A.
- `scripts/ui-tokens.ts`, `src/styles/tokens.css`, paleta global.
- Primitivas existentes en `src/components/ui/`.
- Contrato 404 de `/share/[token]` y los redirects existentes.
- `global-error.tsx` y `not-found.tsx` (no pedidos).

---

## 3. Primitiva `ErrorState`

Componente presentacional sin hooks, como el resto de primitivas, así que
renderiza igual desde Server y Client Components.

```tsx
export type ErrorStateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};
```

Estructura:

```
<div data-component="error-state">     contenedor, tokens de superficie
  <div role="alert">                   ← único anuncio
    <h1>{title}</h1>
    <p>{description}</p>
  </div>
  <div>{actions}</div>                 ← fuera de la región viva
</div>
```

### Contrato de accesibilidad

| Propiedad | Garantía |
|---|---|
| Encabezado | El título es un `<h1>` real: el boundary reemplaza el contenido de la página, así que en ese momento es el encabezado principal del documento |
| Región viva | Exactamente una `role="alert"`, y envuelve **sólo** el bloque de texto |
| Acciones | Los controles quedan fuera de la región viva: una región viva con controles interactivos es ruidosa y puede interrumpir la navegación por teclado |
| Foco | Sin auto-focus; el boundary nunca roba el foco |
| Botones | `<button type="button">` reales vía `Button`, con el `focus-visible` global ya existente |

No se usa `aria-labelledby`: requeriría `useId()` (un hook) para nada, porque el
`<h1>` ya da la estructura y `role="alert"` ya da el anuncio.

---

## 4. Boundaries

| Archivo | Cubre | Acción secundaria |
|---|---|---|
| `src/app/app/error.tsx` | `/app`, `/app/albums`, `/app/albums/[userAlbumId]` | `/app` → «Explorar álbumes»; resto → «Volver a mis álbumes» |
| `src/app/admin/error.tsx` | `/admin/albums`, `/admin/albums/[id]`, `/admin/albums/new`, `/admin/users` | «Volver a mis álbumes» → `/app` |

### Herencia

Un `error.tsx` cubre su segmento y todos los descendientes que no declaren el
suyo. Por eso `/app/albums/[userAlbumId]` hereda el de `/app`, y
`/admin/albums/[id]` y `/admin/albums/new` heredan el de `/admin`. Un archivo
propio en cada uno sería una copia literal sin diferencia funcional.

### Ubicación respecto del layout

Los boundaries viven **dentro** de sus layouts, que ya resolvieron
`getCurrentUser()` y redirigieron si correspondía. Un `error.tsx` no captura
errores de su propio `layout.tsx` —sólo de su `page.tsx` y descendientes—, así que
un fallo de sesión sigue produciendo el redirect de siempre y nunca un estado de
error.

### Detalle de colección

`src/app/app/albums/[userAlbumId]/page.tsx` ya captura `CollectionError` con
códigos `forbidden`, `not_found` e `invalid_input` y redirige a `/app`; el resto
lo re-lanza. **Ese archivo no se tocó.** El boundary sólo ve errores inesperados,
nunca un not-found ni un forbidden.

### Acción secundaria dependiente de la ruta

Con una acción secundaria fija, una de las tres rutas del segmento `/app`
recibiría un enlace a sí misma. `usePathname()` lo resuelve en tres líneas:

```tsx
const pathname = usePathname();
const secondary =
  pathname === "/app"
    ? { href: "/app/albums", label: "Explorar álbumes" }
    : { href: "/app", label: "Volver a mis álbumes" };
```

No es una jerarquía de tipos de error: es una condición sobre la ruta actual.
`/admin` no lo necesita porque ninguna de sus rutas es `/app`.

`/admin` enlaza a `/app` —ruta autenticada siempre válida para quien ve el
panel— y deliberadamente **no** ofrece rutas públicas (`/`, `/login`,
`/register`).

---

## 5. Copy

Idéntico en ambos boundaries:

- Título: `Algo salió mal`
- Descripción: `No pudimos cargar esta sección. Puedes intentar nuevamente.`
- Acciones: `Reintentar` (primario) · secundaria según la tabla de la sección 4.

---

## 6. Qué no se renderiza

| Dato | Decisión |
|---|---|
| `error.message` | Nunca. El tipo lo declara por el contrato de Next.js, pero no se desestructura ni se pinta |
| `error.stack` | Nunca |
| `error.digest` | Tampoco. Es un identificador interno; mostrarlo no aporta a quien usa la app y el copy debe quedar breve |
| `console.error` | No se añade. El proyecto no tiene ningún patrón de logging aceptado en `src/` y Next.js ya reporta el error en el servidor |

### `reset()` frente a recarga

`Reintentar` llama a `reset()` y nada más. No se usa
`window.location.reload()`.

Si el fallo es del servidor, `reset()` volverá a fallar. Es el comportamiento
documentado de Next.js y es correcto: reintenta de verdad en lugar de fingir. La
acción secundaria es la salida real cuando el reintento no basta.

---

## 7. Hallazgo: `error.tsx` es neutro para el status HTTP

En UI-06A se documentó que un `loading.tsx` **sí** altera el status de un
`redirect()` o `notFound()` lanzado dentro del `page.tsx`, porque el límite de
Suspense compromete las cabeceras 200 antes del throw.

Antes de planificar esta fase se verificó empíricamente si un `error.tsx` hace lo
mismo. **No lo hace**: no crea un límite de Suspense y no toca ninguna cabecera.

### Medición A/B (build de producción, `next start`)

Sesión autenticada obtenida sellando una cookie de iron-session contra la base
local; sin sesión para los casos públicos.

| Ruta | Sin ningún boundary | Sólo `error.tsx` | `error.tsx` + `loading.tsx` |
|---|---|---|---|
| `/app` (sin sesión) | 307 → `/login` | **307 → `/login`** | **307 → `/login`** |
| `/admin/albums` (sin sesión) | 307 → `/app` | **307 → `/app`** | **307 → `/app`** |
| `/app/albums/<id inválido>` (con sesión) | 307 → `/app` | **307 → `/app`** | 200 |
| `/app/albums/<id inexistente>` (con sesión) | 307 → `/app` | **307 → `/app`** | 200 |
| `/admin/albums/<id inválido>` (con sesión) | 404 | **404** | 200 |
| `/share/<token inválido>` (público) | 404 | **404** | 404 |

Las degradaciones de la tercera columna son responsabilidad exclusiva de
`loading.tsx` y ya están documentadas y aceptadas en UI-06A. **Añadir boundaries
de error no empeora nada.**

### Verificación del estado final

Repetida sobre el build de UI-06B (que ya incluye los cuatro `loading.tsx` de
UI-06A y los dos `error.tsx` nuevos), la tabla coincide exactamente con la
columna «`error.tsx` + `loading.tsx`», y los destinos de redirect se conservan
(`/app` → `/login`, `/admin/albums` → `/app`).

---

## 8. Verificación end-to-end del boundary

Los tests unitarios cubren el contrato del componente, pero no prueban que el
boundary se monte de verdad en un build de producción. Para eso se forzó un error
real con una sonda desechable: un `throw` condicionado por una variable de
entorno al inicio de `src/app/app/albums/page.tsx` y
`src/app/admin/users/page.tsx`, build de producción, `next start` con la bandera
activa y petición autenticada.

Resultados:

| Comprobación | `/app/albums` | `/admin/users` |
|---|---|---|
| HTTP | 200 | 200 |
| Copy «Algo salió mal» en el HTML inicial | no | no |
| Chunk `app/error-*.js` referenciado en el payload RSC | sí | sí |
| Copy presente en el chunk del boundary | sí | sí |
| `SENTINEL_INTERNAL_MESSAGE_9f3a` filtrado | **no** | **no** |
| Stack trace filtrado | **no** | **no** |
| `error.message` en el payload | **no** | **no** |

**El boundary no se renderiza en el HTML inicial.** Es el comportamiento estándar
del App Router: el error viaja en el payload RSC como
`5:E{"digest":"<hash>"}` y el boundary —que es un Client Component— se monta tras
la hidratación. El HTML inicial contiene el shell autenticado y el `<main>` vacío.
El único dato del error que aparece es el `digest` numérico que Next.js usa en su
propio protocolo; no es texto del error ni información sensible.

Control con la misma build y la bandera apagada: `/app`, `/app/albums` y
`/admin/users` responden 200 con su contenido real y sin rastro del centinela.

La sonda se retiró por completo: los dos `page.tsx` quedaron idénticos a `HEAD`
(`git diff --quiet` limpio) y `.next` se reconstruyó contra el árbol final.

---

## 9. Tests

### `src/components/ui/error-state.test.tsx` (7)

Título como `<h1>`, descripción, acciones, exactamente una región `alert` que
contiene el mensaje, acciones **fuera** de la región viva, partes opcionales
omitidas y `className` propagado.

### `src/app/error-boundaries.test.tsx` (16)

Contrato compartido con `it.each` sobre los dos boundaries:

- copy visible;
- `Reintentar` invoca `reset` exactamente una vez;
- **no expone `error.message`, `error.stack` ni `error.digest`** (se pasan
  centinelas y se afirma que no aparecen ni en el texto ni en el HTML);
- exactamente una región `alert`;
- `Reintentar` es un `<button type="button">` real, habilitado y alcanzable por
  teclado.

Específicos por segmento:

- `/app` en `/app` → enlace a `/app/albums`; en `/app/albums` y en una ruta de
  detalle → enlace a `/app`; y en ningún caso un enlace a la ruta actual;
- `/admin` → enlace a `/app` y ningún enlace a `/`, `/login` ni `/register`.

`next/navigation` se mockea con `vi.hoisted` y `next/link` con un passthrough
ancla, siguiendo el patrón ya usado por `nav-link.test.tsx` y
`app-shell.test.tsx`.

### Lo que no se testea con unit tests

- **Redirects existentes y el 404 de `/share/<token inválido>`.** Son contratos
  HTTP, no de componente: se verifican con la sonda de producción (secciones 7
  y 8), no forzando errores en Vitest.
- **Que los `loading.tsx` de UI-06A sigan presentes.** Ya está cubierto:
  `src/app/loading-states.test.tsx` los importa directamente, así que borrar uno
  rompe ese archivo.

---

## 10. Validaciones

```bash
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run lint
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run test
PATH="$PWD/node_modules/.bin:/usr/local/bin:$PATH" npm run build
git diff --check
```

---

## 11. Pendiente

- QA visual real a 375 px / 768 px / escritorio en light y dark. El entorno no
  tiene Chromium, Firefox, Playwright ni Puppeteer, así que no es verificable
  localmente.
- Comprobar en Preview que el estado de error no provoque un salto raro respecto
  del loading, que `Reintentar` funcione y que la navegación secundaria sea
  correcta en cada segmento.
- Verificación de la Preview de Vercel en el lado del usuario.
