# UI-03A — Primitives daisyUI 5 para autenticación

**Proyecto:** App Álbum
**Rama:** `feat/ui-primitives-auth`
**Fase:** UI-03A — primera adopción controlada de daisyUI
**Plan de referencia:** `docs/UI_UX_PHASE1_PLAN.md` (UI-01, aprobado) y `docs/UI_UX_PHASE2_IMPLEMENTATION.md` (UI-02, implementado)
**Estado:** `READY_FOR_PHASE3A_REVIEW`

---

## 1. Resumen

UI-03A introduce los primeros primitives de UI propios de App Álbum encapsulando
componentes daisyUI 5, resuelve la colisión del token `--border` heredado de UI-02
y migra sólo las pantallas `/login` y `/register`. No modifica rutas, autenticación,
acciones, base de datos, navegación ni ninguna pantalla fuera de autenticación.

El cambio paralelo en `drizzle.config.ts` (carga de `.env.local` mediante
`loadEnvConfig`) **se preserva tal cual** y queda **fuera del alcance** de UI-03A,
tal como autorizó el usuario.

---

## 2. Resolución de la colisión `--border`

UI-02 había resuelto la colisión haciendo convivir el alias heredado de color
`--border` con el token de ancho de daisyUI. UI-03A elimina definitivamente ese
alias, ya que ahora `border-border` puede resolverse sin colisionar:

- `src/app/globals.css`
  - Se eliminan los aliases CSS heredados `--border: var(--album-border)` en
    los bloques de light/dark.
  - Se conserva `--color-border: var(--album-border)` dentro de `@theme static`,
    que es la fuente real de la utility `border-border`.
  - El token de ancho que daisyUI registra como `--border: 1px` dentro de
    `@layer base` ahora puede funcionar sin ser pisado.
  - El comentario de cabecera del bloque documenta la decisión y el estado final
    para que la causa raíz sea rastreable.

Inspección del CSS compilado tras el build:

- `.border` continúa compilando con `border-width: 1px`.
- `border-border` resuelve a `var(--album-border)` a través de `--color-border`.
- Los temas custom `light` y `dark` conservan su `--border: 1px` interno.

---

## 3. Primitives creados

Nueva carpeta: `src/components/ui/`.

### 3.1 `Button`

API: `Button` es un wrapper sobre la clase daisyUI `btn`. Las clases daisyUI se
incluyen explícitamente; los overrides locales definen la densidad compacta y
las transiciones específicas.

Variantes y clases aplicadas:

| Variante | daisyUI base | Token local |
|---|---|---|
| `primary` | `btn-primary` | `--album-primary` |
| `secondary` | `btn-secondary` | `--album-secondary` |
| `danger` | `btn-error` | `--album-danger` |
| `ghost` | `btn-ghost` | transparente + hover sobre `bg-surface-muted` |
| `link` | `btn-link` | `--album-primary`, hover a `--album-accent` |

Tamaños:

- `sm`: `h-8` (32 px), `text-xs`, `px-3`.
- `md` (default): `h-10` (40 px), `text-sm`, `px-4`.

Contrato:

- Forwarding de props nativas (`type`, `name`, `value`, `disabled`, `form`,
  `onClick`, `aria-*`).
- Tipo `ButtonHTMLAttributes<HTMLButtonElement>` completo.
- `type` por defecto: `button` (evita submits accidentales).
- `disabled` aplica `cursor-not-allowed` y `opacity-50`.
- Merge de `className` con `filter(Boolean).join(' ')`.
- No es Client Component; es función pura.

### 3.2 `Field`

API: `Field` unifica un `label`, un control (`input`, `select` o `textarea`) y
mensajes opcionales (`hint`, `error`). Está modelado como una unión discriminada
por `as`, de modo que cada elemento HTML nativo recibe sólo los atributos que
le corresponden.

Tipos:

```ts
export type FieldProps =
  | (FieldOwnProps & { as?: "input" } & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "name">)
  | (FieldOwnProps & { as: "select" } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "name">)
  | (FieldOwnProps & { as: "textarea" } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "name">);
```

Las clases daisyUI encapsuladas son `input`, `select` y `textarea`, con
overrides locales:

- `h-10` y `min-h-0` en input/select.
- `min-h-20 py-2` en textarea.
- `border` y `border-input-border` por defecto, `border-danger` cuando `error`.
- `bg-input` y `text-content` desde los tokens App Álbum.

Contrato de asociación accesible:

- `name` es **obligatorio** en tipos; `id` por defecto es `name`.
- `htmlFor` del `<label>` siempre coincide con el `id` del control.
- `aria-invalid` se aplica cuando `error` está presente, sin perder un valor
  externo que el consumidor hubiera fijado.
- `aria-errormessage` apunta al id del mensaje de error cuando existe.
- `aria-describedby` combina el id externo (si lo hay), el hint y el error.

### 3.3 `InlineMessage`

API: `InlineMessage` encapsula la clase daisyUI `alert` y sirve feedback
compacto para resultados de Server Actions y estados de formulario.

Variantes y clases:

| Variante | Rol | Borde |
|---|---|---|
| `error` | `role="alert"` (asertivo) | `border-danger` |
| `success` | `role="status"` (polite) | `border-success` |
| `warning` | `role="status"` (polite) | `border-warning` |
| `info` | `role="status"` (polite) | `border-info` |
| `pending` | `role="status"` (polite) | `border-border` |

Texto siempre heredado (`text-content`) para heredar el contraste nativo del
tema; el borde semántico distingue la variante sin introducir un texto de
contraste insuficiente.

---

## 4. Densidad y transiciones

Densidad:

- `Button`: `h-8` / `h-10`. `min-h-0` evita que la altura mínima de daisyUI
  (`3rem`) se imponga por encima del tamaño compacto de App Álbum.
- `Field`: `h-10` para input/select, `min-h-20` para textarea.
- `InlineMessage`: `min-h-0` y `py-2` compactos.
- Todos los primitives usan `rounded-control` y `shadow-none`.

Transiciones:

- Todas usan `--transition-fast` y `--ease-standard`.
- Las propiedades son explícitas y nunca `transition-all`:
  - `Button`: `color`, `background-color`, `border-color`, `opacity`.
  - `Field`: `border-color`, `background-color`, `color`.
  - `InlineMessage`: no requiere transición (cambia con el contenido).
- La política global de `prefers-reduced-motion` ya presente en `globals.css`
  reduce cualquier transición a 0.01 ms cuando el sistema lo solicita.

---

## 5. Migración de autenticación

Sólo se modificaron los componentes de formulario; el resto del flujo se
preserva exactamente.

### 5.1 `src/app/login/login-form.tsx`

- Sustituye los `<label>` y `<input>` por `<Field>`.
- Sustituye el `<button>` por `<Button variant="primary" type="submit">`.
- Sustituye el `<p role="alert">` por `<InlineMessage variant="error">`.
- Conserva `useActionState`, `loginAction`, los nombres de campos, las
  restricciones nativas, los textos `Iniciar sesión` / `Ingresando…` y el
  enlace a `/register`.
- Añade `aria-busy={pending}` al `<form>` para anunciar estado pending.

### 5.2 `src/app/register/register-form.tsx`

- Migración análoga a login.
- El `<select>` se reemplaza por `<Field as="select">` con los mismos `<option>`.
- Conserva `useActionState`, `registerAction`, los nombres de campos, las
  restricciones nativas, los textos `Crear cuenta` / `Creando…`, el defaultValue
  `self` y el enlace a `/login`.
- Añade `aria-busy={pending}` al `<form>`.

No se modificaron:

- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/login/actions.ts`
- `src/app/register/actions.ts`

---

## 6. Documentación de accesibilidad

- `Button` reenvía todos los atributos ARIA del botón HTML.
- `Field` garantiza asociación label-control vía `htmlFor` y `id` basado en `name`.
- `Field` aplica `aria-invalid`, `aria-errormessage` y compone `aria-describedby`
  con hint + error sin perder un valor externo.
- `InlineMessage` distingue errores (`role="alert"`, anuncio asertivo) de
  información / pending / success / warning (`role="status"`, anuncio polite).
- Los formularios de login y registro declaran `aria-busy={pending}`.
- La política global de `:focus-visible` de UI-02 sigue activa; los primitives
  no la debilitan.

---

## 7. Cobertura de pruebas

Archivos de test añadidos o modificados por UI-03A:

| Archivo | Casos | Cobertura |
|---|---:|---|
| `src/components/ui/button.test.tsx` | 11 | Default `type="button"`, default variant/size, cada variante, ambos tamaños, forwarding de props, `className` merge, transición específica (sin `transition-all`) |
| `src/components/ui/field.test.tsx` | 7 | input con `name` y atributos nativos, select con `defaultValue` y `<option>`, textarea, estado inválido con `aria-errormessage`, hint sin alert, composición de `aria-describedby` con descripción externa + hint + error, `disabled` |
| `src/components/ui/inline-message.test.tsx` | 7 | `error` con `role="alert"`, las 4 variantes restantes con `role="status"`, default `info`, mapeo semántico de borde, presencia de la clase daisyUI `alert` |
| `src/app/login/login-form.test.tsx` | 5 | Contratos de username/password, link a `/register`, submit con `FormData`, error server como `alert`, pending y `disabled` |
| `src/app/register/register-form.test.tsx` | 5 | Contratos de username/email/owner/password, link a `/login`, submit con `FormData`, error server como `alert`, pending y `disabled` |

Los tests no son snapshots visuales: verifican semántica accesible, props
HTML reenviadas, presencia de clases daisyUI y forward de `FormData` real.

---

## 8. Validaciones técnicas

| Validación | Resultado |
|---|---|
| `npm run lint` | ✅ sin errores ni warnings |
| `npm run test` (focalizado en archivos UI-03A) | ✅ 34 tests en 5 archivos |
| `npm run build` | ✅ compila, 14 rutas, daisyUI 5.7.47 detectado |
| `git diff --check` | ✅ sin conflictos |
| `tsc --noEmit` | ⚠️ preexistente: errores en `share-controls.test.tsx`, `sticker-collection.test.tsx` y `service.test.ts` que ya existían en `main` y que `next build` tolera |

Los errores de `tsc` son **preexistentes al inicio de UI-03A** y están
verificados ejecutando `tsc` sobre el estado sin mis cambios (HEAD puro
`0b58625`). No se introdujeron ni empeoraron.

---

## 9. Inspección del CSS compilado

Tras `npm run build`:

- `daisyUI 5.7.47` se incluye en el bundle de estilos.
- `.border` compila con `border-width: 1px`.
- Las clases `btn`, `btn-primary`, `btn-secondary`, `btn-error`, `btn-ghost`,
  `btn-link`, `input`, `select`, `textarea`, `alert` están disponibles.
- El token `--border` que daisyUI define dentro de `@layer base` no es
  anulado por aliases sin capa; `border-border` sigue resolviendo al color
  del token App Álbum.
- No hay bloques `prefers-color-scheme: dark` que compitan con `[data-theme]`.
- No aparecen modificadores de opacidad prohibidos sobre colores CSS-variable
  en los nuevos componentes.

---

## 10. Limitaciones de contraste heredadas

Las variantes `primary` y `danger` reproducen los tokens actuales:

- Primary (`#ea580c`) con texto `#ffffff`: 3.56:1 en light.
- Danger (`#ef4444`) con texto `#ffffff`: 3.76:1 en light.

Estos ratios **ya existían en UI-02 y antes** y son herencia del producto.
Los primitives los reproducen fielmente para no introducir cambios visuales
fuera de la migración de componentes. Corregirlos cambiaría la paleta actual
y queda fuera del alcance de UI-03A.

En el primitive `InlineMessage` se optó conscientemente por heredar
`text-content` y transmitir la variante sólo mediante el borde, evitando
empeorar el contraste con texto rojo/verde/azul sobre superficie.

---

## 11. QA visual pendiente

No fue posible completar la matriz visual manual porque este entorno no
dispone de navegador gráfico, Chromium/Firefox, Playwright ni Puppeteer.

Requiere revisión manual en un entorno QA preparado:

- `/login` y `/register` en 375 px, 768 px y escritorio.
- Light y dark.
- Densidad, radios, bordes, altura de controles.
- Foco visible y contraste.
- Pending y error visibles.
- Dark mode y `prefers-reduced-motion` activo.

---

## 12. Archivos UI-03A

| Archivo | Estado |
|---|---|
| `src/app/globals.css` | modificado (colisión `--border` resuelta) |
| `src/components/ui/button.tsx` | nuevo |
| `src/components/ui/button.test.tsx` | nuevo |
| `src/components/ui/field.tsx` | nuevo |
| `src/components/ui/field.test.tsx` | nuevo |
| `src/components/ui/inline-message.tsx` | nuevo |
| `src/components/ui/inline-message.test.tsx` | nuevo |
| `src/app/login/login-form.tsx` | modificado (migrado a primitives) |
| `src/app/login/login-form.test.tsx` | nuevo |
| `src/app/register/register-form.tsx` | modificado (migrado a primitives) |
| `src/app/register/register-form.test.tsx` | nuevo |
| `docs/UI_UX_PHASE3A_IMPLEMENTATION.md` | nuevo |

Total: **12 archivos** (10 nuevos + 2 modificados). Dentro del límite de 15.

`drizzle.config.ts` (modificado en paralelo) se preserva excluido.

---

## 13. Exclusiones explícitas

No se modificaron:

- `drizzle.config.ts` (cambio paralelo excluido por el usuario).
- `package.json` / `package-lock.json` / `postcss.config.mjs` / `tailwind.config.ts`
  (sin cambios desde UI-02).
- Acciones de login/registro.
- Páginas `/login` y `/register` (sólo el form cambia).
- `/`, `/app`, `/app/albums`, detalle de colección, sharing, `/admin/albums`,
  `/admin/users`, `StickerTable`, `CollectionNav`, `ProgressSummary`.
- Esquema DB, migraciones, Drizzle, autenticación, permisos, roles.

---

## 14. Próximos pasos (no incluidos en UI-03A)

- UI-03B: extender la adopción de primitives a las pantallas de colección
  preservando densidad de `StickerTable` y la lógica de compactación
  (`POSITION_OFFSET`).
- UI-03C: aplicar los primitives a la administración manteniendo
  exactamente la lógica de `StickerTable`.
- UI-03D: revisar contraste de `primary` / `danger` y de los textos
  semánticos sobre superficie si el usuario decide ajustar paleta.
- UI-04: refinar portada `/` y reemplazar colores hardcodeados por tokens.
- UI-05: pulido, retirar aliases heredados, `loading.tsx`, skeletons, lazy
  loading de portadas.

Detenerse antes de iniciar UI-03B.
