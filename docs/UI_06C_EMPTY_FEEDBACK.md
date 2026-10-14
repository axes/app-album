# UI-06C — Empty states y feedback de acciones

Estado: implementado, pendiente de revisión (`READY_FOR_UI_06C_EMPTY_FEEDBACK_REVIEW`).
Rama: `feat/ui-collection-detail`. Sin commit, sin push, sin PR.

---

## 1. Problema

Dos huecos distintos, ambos de comunicación con el usuario:

1. **Empty states inconsistentes.** El primitive `EmptyState` existía desde
   UI-03B con tres usos, pero `/admin/albums` renderizaba una tabla desnuda con
   encabezados y `<tbody>` vacío cuando no había álbumes. Además el título se
   emitía como `<p>`, invisible para la navegación por encabezados de un lector
   de pantalla.
2. **Feedback ausente en «Copiar enlace».** `share-controls.tsx` hacía
   `setCopied(true)` y **nunca volvía a `false`**: el botón quedaba en «Copiado»
   de forma permanente hasta el siguiente render del servidor. Y el cambio era
   sólo visual — sin región viva, un lector de pantalla no anunciaba nada.

---

## 2. Alcance

### Dentro de alcance

- `EmptyState`: título `<p>` → `<h2>`.
- Copy de los empty states de `/app`, `/app/albums` y `/admin/albums`.
- Feedback de copiado en `share-controls.tsx` + corrección del bug.
- Tests de todo lo anterior.
- Esta documentación.

### Fuera de alcance (no tocado)

- DB, migraciones, repositorios, `lib/collection/*`, `lib/catalog/*`, `lib/admin/*`.
- Auth y `getCurrentUser`.
- Server Actions (`enableSharingAction`, `disableSharingAction`, `adjustQuantityAction`, …).
- Motion de láminas, `loading.tsx` (UI-06A), `error.tsx` (UI-06B).
- `scripts/ui-tokens.ts`, `src/styles/tokens.css`, `globals.css`, paleta global.
- Layout general, `AppShell`, `PageHeader`.
- Librerías nuevas. **No se instaló ninguna librería de toast.**

---

## 3. Empty states

### 3.1 Qué se cambió

| Ruta | Antes | Ahora |
|---|---|---|
| `/app` | «Todavía no tienes álbumes en tu colección.» / «Hola, {user}. Empieza explorando el catálogo.» | «Tu colección está vacía» / «Hola, {user}. Añade tu primer álbum para empezar a registrar tus láminas.» |
| `/app/albums` | «No hay álbumes publicados disponibles.» | «No hay álbumes disponibles» |
| `/admin/albums` | tabla vacía con encabezados | `EmptyState` «Todavía no hay álbumes» |

El CTA «Explorar álbumes» de `/app` se conserva tal cual. El saludo al usuario
se mantiene, pero **integrado en la descripción**, nunca como encabezado.

### 3.2 Qué se dejó intacto y por qué

- **`/app/albums/[userAlbumId]`** — el copy («No hay láminas» / «Este álbum
  todavía no tiene láminas disponibles.») ya era el acordado.
- **`/admin/users`** — el caso 0 usuarios es **inalcanzable**.
  `AdminUserRepository.listUsers()` hace `select * from users` sin filtro, así
  que 0 filas significa 0 usuarios en la base; con 0 usuarios no existe ningún
  admin activo y `src/app/admin/layout.tsx` redirige a `/app` antes de que la
  página renderice. No se añade empty state ni se inventan acciones
  administrativas.
- **`/admin/albums/[id]` páginas y láminas** — los `<p>` muted viven *dentro* de
  una card que ya contiene los formularios de creación justo encima. Convertir
  esos mensajes en `EmptyState` metería una caja con borde y padding dentro de
  otra card: ruido visual, no coherencia.
- **`/share/[token]`** — página pública sin sesión; su registro («Álbum
  completo», «Sin repetidas») es deliberadamente distinto y no compite con
  app/admin.

### 3.3 Sin CTA duplicada en `/admin/albums`

El `PageHeader` de esa página ya renderiza el botón «Crear álbum». El empty
state **no** repite la acción: duplicarla a 40 px de distancia sería ruido. El
test lo fija con `expect(text.match(/Crear álbum/g)).toHaveLength(1)`.

---

## 4. Primitiva `EmptyState`

Único cambio: el título pasa de `<p className="font-medium text-content">` a
`<h2 className="font-medium text-content">`.

- Sin props nuevas, sin cambios de API, sin cambios de clases.
- Compatible con los tres usos existentes y con cualquier uso futuro.
- El test `renders the title as a semantic heading` lo fija con
  `getByRole("heading", { level: 2, name: … })`.

**Nota de jerarquía:** en `sticker-collection.tsx` el empty state queda como
`<h2>` hermano del `<h2>Láminas</h2>`. Es un bloque independiente, no una
subsección, así que se deja así en lugar de tocar un cuarto archivo por una
jerarquía que no rompe nada.

---

## 5. Feedback de acciones

### 5.1 Auditoría previa

| Acción | Feedback | Veredicto |
|---|---|---|
| Cantidad `+` / `−` | conteo optimista + label («Faltante»/«Obtenida»/«Repetida · N copias») + tinte de color + animación | suficiente |
| Añadir álbum | `redirect(/app/albums/{id})` | suficiente |
| Activar / desactivar compartir | el panel se transforma por completo | suficiente |
| **Copiar enlace** | `copied` nunca volvía a `false`; sin región viva | **defecto** |
| Eliminar álbum | `redirect("/app")` | suficiente |
| Admin (13 acciones) | `useActionState` → success/error inline | suficiente |

### 5.2 Lo implementado

Sólo `Copiar enlace`, porque la escritura al portapapeles no produce ningún
resultado visible por sí misma.

- El botón mantiene su label estable **«Copiar enlace»**: el target no se mueve
  ni cambia de ancho al recopiar.
- Al copiar aparece `InlineMessage variant="success"` con **«Enlace copiado»**.
- `role="status"` (implícito en la variante `success` del primitive), que
  **implica `aria-live="polite"`**. No se añade un `aria-live` redundante: el
  primitive ya documenta esa equivalencia y es el patrón vigente en toda la app.
- Auto-ocultado a los **2500 ms** (`COPY_FEEDBACK_MS`).
- `clearTimeout` en el cleanup del efecto: al desmontar y al reiniciar la
  ventana, ningún timeout obsoleto puede cambiar el estado.
- Sin animación, sin portal, sin dependencia nueva.
- Si el portapapeles falla, se conserva el fallback actual (seleccionar el input
  readonly) y **no** se muestra la confirmación.

### 5.3 Lo que deliberadamente NO recibe feedback

| Acción | Por qué no |
|---|---|
| Cantidad `+` / `−` | el conteo optimista, el label, el tinte y la animación ya lo dicen todo. Un toast aquí sería ruido en la acción más repetida de la app |
| Añadir álbum | la navegación al álbum recién creado **es** la confirmación |
| Eliminar álbum | el `redirect("/app")` **es** la confirmación |
| Activar / desactivar compartir | el panel se transforma por completo; añadir texto exigiría convertir dos Server Actions `void` en actions con estado, tocando su contrato y sus tests. Coste alto, valor nulo |
| Admin (13 acciones) | ya tienen success/error inline vía `useActionState` |

**No se instala ninguna librería de toast.** La auditoría no encontró ni un solo
caso donde el feedback inline no funcione.

### 5.4 Limitación conocida

La región viva se monta junto con su contenido. Varios lectores de pantalla sólo
anuncian cambios en regiones que **ya existían** antes de la mutación, por lo
que el anuncio puede perderse. Es exactamente el mismo patrón que ya usan todas
las acciones admin con `useActionState`; se mantiene por consistencia en lugar
de introducir un mecanismo paralelo. El texto visible sigue siendo la garantía
principal.

---

## 6. Archivos

**11 archivos de código + 1 doc.**

| # | Archivo | Cambio |
|---|---|---|
| 1 | `src/components/ui/empty-state.tsx` | título `<p>` → `<h2>` |
| 2 | `src/components/ui/empty-state.test.tsx` | + test de encabezado semántico |
| 3 | `src/components/albums/empty-library.tsx` | copy de colección vacía |
| 4 | `src/app/app/albums/page.tsx` | copy de catálogo vacío |
| 5 | `src/app/admin/albums/page.tsx` | + `EmptyState` cuando `albums.length === 0` |
| 6 | `src/app/app/albums/[userAlbumId]/share-controls.tsx` | reset a 2500 ms + `InlineMessage` «Enlace copiado» |
| 7 | `src/app/app/albums/[userAlbumId]/share-controls.test.tsx` | tests de feedback, auto-hide y cleanup |
| 8 | `src/app/app/page.test.tsx` | asserts de copy |
| 9 | `src/app/app/albums/page.test.tsx` | asserts de copy + ausencia de CTA |
| 10 | `src/app/admin/albums/page.test.tsx` | **nuevo** — empty state admin |
| 11 | `src/app/app/albums/[userAlbumId]/sticker-collection.test.tsx` | regresión «sin feedback redundante» |
| 12 | `docs/UI_06C_EMPTY_FEEDBACK.md` | este documento |

---

## 7. Tests

| Caso | Dónde |
|---|---|
| colección vacía (título + descripción con saludo + CTA) | `app/page.test.tsx` |
| catálogo vacío (título, sin CTA) | `app/albums/page.test.tsx` |
| admin álbumes vacío (título, sin tabla, sin CTA duplicada) | `admin/albums/page.test.tsx` |
| admin álbumes con datos (tabla intacta) | `admin/albums/page.test.tsx` |
| álbum sin láminas | `sticker-collection.test.tsx` |
| encabezado semántico del empty state | `empty-state.test.tsx` |
| copiar enlace anuncia «Enlace copiado» y el label no muta | `share-controls.test.tsx` |
| el feedback se auto-oculta (visible a 1 s, ausente a 3 s) | `share-controls.test.tsx` |
| el timer se limpia al desmontar (`vi.getTimerCount()`) | `share-controls.test.tsx` |
| un fallo de portapapeles no confirma éxito | `share-controls.test.tsx` |
| sin feedback redundante en cantidad `+` / `−` | `sticker-collection.test.tsx` |
| Server Actions intactas (payload `userAlbumId`) | `share-controls.test.tsx` |

**Cambio de contrato asumido:** el assert
`getByRole("button", { name: "Copiado" })` se reemplaza por
`getByRole("status").textContent === "Enlace copiado"` más
`queryByRole("button", { name: "Copiado" }) === null`. Es un cambio deliberado
(el label del botón deja de mutar), **no** un debilitamiento: se sustituye una
aserción por dos más fuertes.

Los tests de temporizador usan `vi.useFakeTimers()` con `fireEvent` en lugar de
`userEvent` + `waitFor`, porque `waitFor` sondea con `setInterval` y los fake
timers lo congelan.

---

## 8. Gates ejecutados

| Gate | Resultado |
|---|---|
| `vitest run` (suite completa) | 60 archivos pasan, 2 omitidos · 474 tests pasan, 35 omitidos |
| `eslint .` | sin hallazgos |
| `next build` | compila y genera las 16 rutas |
| `git diff --check` | sin errores de whitespace |

---

## 9. Pendiente

- **QA visual 375 px / 768 px / escritorio en light y dark.** El entorno no
  tiene Chromium, Firefox, Playwright ni Puppeteer, y el Preview de Vercel está
  detrás de SSO. Queda como pendiente manual, igual que en UI-06A y UI-06B.
- Commit, push y PR: **no realizados**, a la espera de aprobación explícita.
