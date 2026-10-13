# UI-05C.3 — Sticker Interaction Feedback

Estado: implementado, pendiente de revisión (`READY_FOR_UI_05C3_ANIMATION_REVIEW`).
Rama: `feat/ui-collection-detail`. Sin commit, sin push, sin PR.

---

## 1. Objetivo

Convertir marcar láminas en la interacción más satisfactoria de App Álbum, con un
feedback visual **distinto según la transición de cantidad**, sin tocar lógica de
negocio, persistencia ni Server Actions.

Regla crítica: la animación **nunca** espera a la Server Action ni al RSC, nunca bloquea
el click y nunca introduce un retardo artificial.

```
click
  → estado optimista local
  → feedback visual inmediato
  → Server Action en paralelo
  → reconciliación con el servidor
```

El servidor sigue siendo la fuente de verdad.

---

## 2. Dependencia

| Dato | Valor |
|---|---|
| Paquete | `motion` |
| Versión | `14.2.0` (exacta, sin caret) |
| Transitivas | `framer-motion@14.2.0`, `motion-dom@14.2.0`, `motion-utils@14.1.1`, `tslib` |

`framer-motion` **no** es dependencia directa y **no** se importa desde código de la app.
Sólo se consume la API oficial de `motion`.

### Por qué `animate()` imperativo y no `LazyMotion` + `m`

Medición real con esbuild 0.19.12 (el del proyecto), bundle minificado, gzip:

| Patrón | gzip |
|---|---|
| `m` desde `motion/react` | 5 502 B |
| `LazyMotion` | 624 B |
| `domAnimation` | 28 011 B |
| `animate()` | 24 094 B |
| `motion` completo | 45 213 B |
| `LazyMotion` + `domAnimation` estático + `m` | 31 055 B |

| | Crítico | Total | Complejidad |
|---|---|---|---|
| A — `LazyMotion` + `m` + `domAnimation` dinámico | 6 126 B | 34 137 B | Alta |
| **B — `animate()` imperativo** | **24 094 B** | **24 094 B** | **Baja** |

Se eligió **B**: menor coste total, sin chunk diferido y sin riesgo de primer click
lento. Este proyecto ya tiene un antecedente documentado de problema INP en
`RemoveAlbumButton` causado por un paint que no llegaba a tiempo; introducir una descarga
en el primer click habría repetido ese error.

Hallazgo relevante: `motion/react-m` **no** exporta `m` como named export (el `.mjs` sólo
exporta los elementos), y tampoco exporta `LazyMotion` ni `domAnimation`. La opción A
obligaría a importar de dos entrypoints distintos.

---

## 3. Client boundary

No se crea ninguna frontera cliente nueva. Todo el subárbol bajo `StickerCollection` ya
era cliente.

```
page.tsx                    RSC  ← intacto
  └─ AlbumDetailHero        RSC  ← intacto
  └─ StickerCollection      client (ya existía)
       └─ StickerSection    client (ya existía)
            └─ StickerCard  client (ya existía) ← dueño del estado optimista
                 ├─ StickerMotionLayer  client (NUEVO, hoja decorativa)
                 └─ QuantityControls → form ×2 → QuantityButton (intacto)
```

El estado optimista vive en `StickerCard` y no en un hijo porque el `<li>` que lleva el
tinte de superficie es el nodo raíz de la card: si el estado viviera más abajo, el `<li>`
seguiría pintando el color viejo hasta que llegara el RSC.

`QuantityButton` no se modifica. El disparador es el `onClick` del `<form>`, que recibe
el evento burbujeado desde el botón submit y corre antes del envío. El payload no cambia:
el handler nunca construye `FormData` ni llama a la acción.

---

## 4. Detección `previous → next`

`sticker-interaction.ts` expone `intentFor(from, to)`, una función pura sin DOM, sin React
y sin Motion. No duplica reglas de negocio: sólo nombra una transición numérica.

| Transición | Intent |
|---|---|
| `0 → 1` | `obtained` |
| `1 → 2` | `duplicate` |
| `2 → N` | `increment` |
| `N → N-1` (sigue repetida) | `decrement` |
| `2 → 1` | `downgrade` |
| `1 → 0` | `lost` |

**La animación se dispara exclusivamente desde el handler de click.** El estado
`animation` se inicializa en `null` y sólo se asigna dentro de `handleIntent`. No existe
ningún `useEffect` que observe `sticker.quantity`. Por construcción, un RSC entrante, un
refresh, un cambio de vista o una navegación no pueden animar nada.

---

## 5. Optimistic UI

```ts
const [optimistic, setOptimistic] = useState<number | null>(null);
const [serverQuantity, setServerQuantity] = useState(sticker.quantity);

if (serverQuantity !== sticker.quantity) {
  setServerQuantity(sticker.quantity);
  setOptimistic(null);          // el servidor habló: gana él
}

const displayed = optimistic ?? sticker.quantity;
```

Se usa `useState` local y no `useOptimistic` porque `addOptimistic` debe invocarse dentro
de una transición, y un `onClick` en un botón submit dispara antes de que React abra la
transición del form action. Ajustar el estado durante el render cuando cambia una prop es
el patrón recomendado por React y evita el commit extra de un `useEffect`.

---

## 6. Reconciliación con el servidor

El overlay optimista **nunca se mergea** con el valor del servidor: o se muestra el
overlay, o se muestra la prop. Cualquier cambio de prop descarta el overlay. No hay
aritmética acumulada sobre el valor del servidor, así que no puede haber drift.

| Caso | Comportamiento |
|---|---|
| RSC normal | La prop cambia → el overlay se limpia → manda el servidor |
| Valor inesperado (clamp, otra pestaña) | La prop cambia a un valor ≠ overlay → se limpia y se muestra el real |
| `throw` en la acción | Error boundary → desmontaje. Sin estado residual |
| `redirect("/app")` | Desmontaje. Sin estado residual |
| Acción que nunca responde | Timeout de seguridad de 5 s que limpia el overlay |

---

## 7. Matriz de animaciones

| Intent | Card | Label | Capa decorativa | Duración |
|---|---|---|---|---|
| `obtained` | pop `scale [1, 1.07, 1]` | pop `scale [0.9, 1]` | burst de 6 partículas | 400 ms |
| `duplicate` | bounce `scale [1, 1.04, 1]` | — | ghost duplicate detrás | 320 ms |
| `increment` | — | pulse `scale [1, 1.12, 1]` | — | 200 ms |
| `decrement` | — | pulse `scale [1, 0.94, 1]` | — | 160 ms |
| `downgrade` | — | — | ghost saliendo | 240 ms |
| `lost` | fade `opacity [1, 0.85, 1]` + `scale [1, 0.98, 1]` | — | — | 200 ms |

Sólo se animan `transform` y `opacity`. Nunca `width`, `height`, `top`, `left` ni
`margin`. Cero lecturas de layout en el camino de animación.

**Burst:** 6 partículas (4 círculos + 2 rombos), 4–6 px, ángulos de 60°, radio 22–30 px.
Los desplazamientos se calculan una vez en render y viajan como custom properties
`--burst-x` / `--burst-y` que consume el keyframe CSS. Sin canvas, sin cálculo por frame.

**Ghost:** un `<span>` absoluto por debajo de la card, con fondo
`color-mix(in srgb, var(--album-sticker-duplicate) 18%, var(--album-surface))`, opacidad
máxima 0.45, desplazamiento 8 px / −6 px y rotación −3°.

---

## 8. Mosaico vs Lista

Las celebraciones se ejecutan **únicamente en vista Mosaico**.

| | Mosaico | Lista |
|---|---|---|
| Actualización optimista | sí | sí |
| Cambio de label y cantidad | sí | sí |
| Cambio de color/superficie | sí | sí |
| Partículas | sí | **no** |
| Ghost duplicate | sí | **no** |
| Pop / bounce de card | sí | **no** |

La vista Lista se mantiene estable y orientada a gestión. La diferencia se deriva del
prop `view` que `StickerCard` ya recibía; no se duplica lógica de negocio.

---

## 9. Reduced motion

Hook local `src/lib/use-reduced-motion.ts` basado en `window.matchMedia`, no
`useReducedMotion()` de Motion. El coste es irrelevante (265 B); decide el control: el hook
local permite decidir **antes de renderizar** si se monta la capa decorativa, no sólo
acortar su duración.

Con `prefers-reduced-motion: reduce`:

- no se monta `StickerMotionLayer` → cero partículas, cero ghost;
- no se llama a `animate()` → sin pop, sin bounce, sin pulse;
- sí se mantienen estado, color, copy y cantidad.

El hook es SSR-safe (`useState(false)` inicial → sin hydration mismatch), responde a
cambios de la preferencia y siempre remueve su listener. El neutralizador CSS global de
`globals.css` sigue actuando como defensa en profundidad.

---

## 10. Performance

- Sin listeners globales. El único listener es el `matchMedia` del hook, con cleanup.
- Sin canvas. Las partículas son `<span>` DOM efímeros.
- La capa decorativa sólo existe durante ≤500 ms tras un click. En reposo, cero nodos
  extra por card.
- `animate()` devuelve `controls`; el cleanup del efecto llama a `stop()`, así que un
  click nuevo detiene el anterior y no se acumulan animaciones.
- El estado optimista vive en `StickerCard`, no en `StickerCollection`: sólo se
  re-renderiza la card clickeada.
- No se aplica `will-change` preventivo: añadirlo a cientos de cards crearía cientos de
  capas de composición.

---

## 11. Testing

`motion/react` se mockea porque jsdom 29.1.1 no implementa `Element.prototype.animate`
(verificado: es `undefined`). También faltan `window.matchMedia`, `requestAnimationFrame`,
`ResizeObserver` e `IntersectionObserver`. Como `vitest.config.ts` no declara
`setupFiles`, el stub de `matchMedia` se importa explícitamente desde
`src/test/stubs/match-media.ts` en los tests que lo necesitan.

El mock es de grano grueso (sólo `animate`): se prueba **nuestra** lógica —cuándo y con qué
intent animamos—, nunca los internos de Motion. Sin snapshots visuales.

| Archivo | Tests |
|---|---|
| `sticker-interaction.test.ts` | 12 — `intentFor` puro, `isCelebration`, presupuesto de tiempos |
| `sticker-motion.test.tsx` | 22 — disparo por transición, initial render, RSC entrante, clicks rápidos, reduced motion, cleanup, reconciliación, vista Lista, overlay optimista, accesibilidad |
| `sticker-collection.test.tsx` | 8 — preexistentes, **sin cambios** |

Los tests con temporizadores usan `fireEvent` en lugar de `userEvent`: `userEvent`
programa sus propios delays a través del reloj falso y bloquea el test salvo que se
avance cada espera interna a mano. `fireEvent` despacha el click de forma síncrona, que es
todo lo que esas aserciones necesitan.

---

## 12. Revisión focal previa a Preview

Revisión del diff sobre los cinco ejes solicitados. **Sin findings bloqueantes.**

### 12.1 Overlay optimista

| Propiedad | Estado | Evidencia |
|---|---|---|
| No persiste si la Server Action falla | ✅ | `adjustQuantityAction` **lanza** (`actions.ts:61`) o hace `redirect("/app")` (`:59`). Ambos desmontan el subárbol, así que el estado optimista se destruye. No hay `error.tsx` en `src/app`, por lo que aplica el error boundary por defecto de Next.js. |
| La prop del servidor siempre gana | ✅ | Guarda de render: cualquier cambio de `sticker.quantity` limpia el overlay. Test: `reconciles the optimistic value with the server value`. |
| El timeout de seguridad se limpia | ✅ | `clearTimeout` en el cleanup del efecto. Test: `clears the safety timer so a stale rollback cannot clobber a newer value` — un timer superviviente habría revertido la card a 1 copia a los 5000 ms. |
| Clicks múltiples sin timers huérfanos | ✅ | El efecto depende de `optimistic`, así que cada click reinicia la ventana. Test: `restarts the safety window on every click`. Tras el desmontaje, `vi.getTimerCount() === 0`. |

### 12.2 Cleanup de Motion

| Propiedad | Estado | Evidencia |
|---|---|---|
| Cada `animate()` en vuelo tiene cleanup | ✅ | Todo resultado se empuja a `controls` y se detiene en el cleanup del efecto. |
| No se acumulan controls | ✅ | El efecto depende de `animation`; un click nuevo dispara el cleanup anterior. Invariante testeado: **como máximo una animación en vuelo**. |
| Los elementos temporales se desmontan | ✅ | `animation` vuelve a `null` tras `CLEAR_MS[intent]` y la capa decorativa desaparece. Test: `unmounts the decorative layer once the animation window closes`. |
| Sin memory leaks | ✅ | Único listener (`matchMedia`) con cleanup; timers con `clearTimeout`; `controls.stop()` en desmontaje. |

### 12.3 Accesibilidad

| Propiedad | Estado |
|---|---|
| `aria-hidden` en partículas y ghost | ✅ `aria-hidden="true"` en el contenedor del burst y en el ghost |
| `pointer-events-none` | ✅ en ambos nodos |
| Sin elementos focusables | ✅ 0 descendientes `button/a/input/select/textarea/[tabindex]` |
| Sin `aria-live` añadido | ✅ 0 regiones vivas en la card |
| Labels existentes intactos | ✅ `Faltante` / `Obtenida` / `Repetida · N copias` y los `aria-label` de los controles |

### 12.4 `globals.css`

Diff **puramente aditivo**: 3 `@keyframes` (`album-burst`, `album-ghost-in`,
`album-ghost-out`), 3 clases (`.sticker-burst-particle`, `.sticker-ghost-in`,
`.sticker-ghost-out`) y una guarda de reduced motion que oculta `.sticker-burst` y
`.sticker-ghost`. Sin cambios globales accidentales. Coherente con el hook local: el hook
decide no montar la capa, la guarda CSS es defensa en profundidad si la preferencia cambia
a mitad de animación.

### 12.5 Dependencia

| Propiedad | Estado |
|---|---|
| `motion: "14.2.0"` exacto | ✅ sin caret |
| Sin `framer-motion` directo | ✅ ausente de `package.json`; sólo transitiva (`framer-motion@14.2.0`) |
| Imports sólo desde `motion` | ✅ un único import: `import { animate } from "motion/react"` |

### 12.6 Observaciones menores (no bloqueantes, no corregidas)

1. **`animation.id` se escribe pero nunca se lee** (`sticker-card.tsx:191`). Se incrementa
   para forzar una nueva identidad de objeto, pero `setAnimation` ya crea un objeto nuevo
   en cada llamada, así que el efecto se re-ejecuta igual. Campo muerto, inofensivo.
2. **El intent se dispara desde el `onClick` del `<form>`**, no del botón submit. En ambos
   layouts la caja del form se ajusta al botón (ítem flex), así que no hay área vacía
   práctica; unos pocos px de holgura de línea podrían disparar un intent sin envío, que
   la red de seguridad de 5 s revertiría. Impacto bajo. Corregirlo exigiría tocar
   `QuantityButton`, fuera de alcance.
3. **`overflow-visible` en el contenedor del burst es inerte** porque el `<li>` padre tiene
   `overflow-hidden`. Con la geometría actual (máx. ±28 px horizontal y ±24 px vertical
   desde el centro, card ≥ ~112 px de ancho) las partículas quedan dentro. Clase muerta
   cosmética.
4. **No existe ningún `error.tsx` en `src/app`.** Un fallo de Server Action cae al error
   boundary por defecto de Next.js, que reemplaza la página. Es **preexistente** (todas las
   demás acciones también lanzan) y queda fuera del alcance de UI-05C.3. Garantiza, eso sí,
   que el estado optimista no sobrevive a un fallo.

### 12.7 Tests añadidos durante la revisión

8 tests nuevos, **sin cambio de comportamiento visual**: rollback por timeout, timer
obsoleto que no puede pisar un valor más nuevo, reinicio de la ventana por click, cero
timers tras desmontaje, `aria-hidden`/`pointer-events-none`/sin focusables en burst y
ghost, ausencia de `aria-live`, y desmontaje de la capa decorativa.

---

## 13. Accesibilidad

- La animación nunca es el único feedback: los labels `Faltante` / `Obtenida` /
  `Repetida · N copias` se renderizan siempre.
- **No se añade `aria-live`.** Anunciar cada transición produciría ruido excesivo en
  clicks repetidos sobre una colección de cientos de láminas.
- Todo nodo decorativo lleva `aria-hidden="true"` y `pointer-events-none`.
- Se preservan `aria-label` de los controles, `disabled` en los límites, los targets de
  44 px y el `aria-expanded` de las secciones.

---

## 14. Archivos

| Archivo | Acción |
|---|---|
| `package.json` | `"motion": "14.2.0"` |
| `package-lock.json` | resolución de la dependencia |
| `src/lib/use-reduced-motion.ts` | nuevo |
| `src/app/app/albums/[userAlbumId]/sticker-interaction.ts` | nuevo |
| `src/app/app/albums/[userAlbumId]/sticker-motion-layer.tsx` | nuevo |
| `src/app/app/albums/[userAlbumId]/sticker-card.tsx` | modificado |
| `src/app/globals.css` | keyframes + guardas de reduced motion |
| `src/app/app/albums/[userAlbumId]/sticker-interaction.test.ts` | nuevo |
| `src/app/app/albums/[userAlbumId]/sticker-motion.test.tsx` | nuevo |
| `src/test/stubs/match-media.ts` | nuevo |
| `docs/UI_UX_PHASE5C3_IMPLEMENTATION.md` | nuevo |

No se tocaron: `actions.ts`, `quantity-button.tsx`, `sticker-collection.tsx`,
`sticker-section.tsx`, `view-toggle.tsx`, `page.tsx`, `album-detail-hero.tsx`,
`remove-button.tsx`, `share-controls.tsx`, `scripts/ui-tokens.ts`,
`src/styles/tokens.css`, `src/components/ui/**`, DB, Drizzle, repositorios,
`CollectionService` ni las reglas de cantidad.

---

## 15. Pendiente

- QA visual real a 375 px / 768 px / escritorio en light y dark. El entorno no tiene
  Chromium, Firefox, Playwright ni Puppeteer, así que no es verificable localmente.
- Verificación de la Preview de Vercel en el lado del usuario.
