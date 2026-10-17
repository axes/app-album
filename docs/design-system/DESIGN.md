# App Álbum — Especificación de diseño (v2)

## Erratas aprobadas (prevalecen sobre el texto)

Las siguientes decisiones aprobadas corrigen o precisan cualquier instrucción contradictoria del resto de este documento:

- **Segmentado:** todos sus ítems tienen una altura mínima de 44 px; §16 prevalece sobre §8.
- **Copias:** no existe un tope de 9. El límite es el que impone el producto en el servidor. El contador muestra `+N` hasta `+99` y `99+` desde ese punto.
- **Lámina especial:** se representa mediante una prop opcional `special`. Nunca se infiere desde el nombre ni desde el código. En producción no se muestra hasta que el dato exista.
- **Perfil:** no existe destino ni ruta de perfil. La navegación muestra únicamente destinos reales.
- **Nombre:** el nombre visible del producto es **MiColección**; «App Álbum» es sólo el nombre interno.
- **Vista de láminas:** se conserva Lista y se agrega Compacto. Los modos son `Grid / Compacto / Lista`.
- **Color sobre rellenos:** no existe color `secondary`. El único token de texto sobre rellenos es `--album-on`.
- **Logo:** `LogoDefs` se declara una sola vez en el layout raíz, no en `AppShell`.
- **Íconos extra aprobados:** `sun`, `moon`, `chevronUp`, `chevronDown`, `list`, `pencil`, `image` y `back`.
- **Tile de lámina como botón y estado compartido:** aprobado con condiciones: no puede contener controles interactivos anidados, las Server Actions permanecen intactas y deben existir pruebas de consistencia del estado compartido.

Esta copia versionada en el repositorio ya no es idéntica a la especificación entregada originalmente: incorpora estas erratas aprobadas, que tienen precedencia normativa.

App para gestionar láminas de álbumes (marca: **MiColección**). Este documento es la especificación que debes implementar. Va acompañado de:

| Archivo | Rol |
|---|---|
| `DESIGN.md` | Reglas, medidas y comportamiento. **Manda sobre el HTML.** |
| `ui-tokens.css` / `design-tokens.json` | Fuente única de valores. Mismos datos en dos formatos. |
| `reference.html` | Referencia visual y de comportamiento. Ábrelo en el navegador y compáralo con tu resultado. |

## 0. Instrucciones para el agente

1. **No copies el CSS ni las clases de `reference.html`.** Sus nombres (`.btn.p`, `.slot`, `.sel`…) son de la demo. Impleméntalo con los componentes, convenciones y utilidades que ya existen en el repositorio. Si ya hay un componente equivalente, reutilízalo y ajústalo; no crees uno paralelo.
2. **Orden de trabajo:** (a) tokens y tema claro/oscuro, (b) tipografías, (c) íconos, (d) componentes base, (e) componentes de álbum, (f) navegación y diálogo.
3. **Ningún componente lleva colores propios.** Todo color viene de un token `--album-*`. La única excepción es el logo (§14).
4. Si el repo genera los tokens desde `scripts/ui-tokens.ts`, sincroniza ese script con `design-tokens.json` y regenera el CSS. No edites el CSS generado a mano.
5. El diseño está **no aprobado todavía para producción**. Impleméntalo detrás de la misma estructura de temas que ya exista y no borres la dirección actual salvo que se te indique.
6. Al terminar, entrega: lista de lo implementado, lo que no pudiste cumplir (con el motivo) y las capturas claro/oscuro comparadas con `reference.html`.

## 1. Principios

1. **El estado nunca se comunica solo con color.** Cada estado de lámina tiene borde, ícono o texto propio.
2. **Controles táctiles de 44 px mínimo.** La única excepción son los mini-controles sobre la lámina en escritorio con mouse (28 px), que tienen alternativa de teclado.
3. **Una sola jerarquía tipográfica**, sin mayúsculas forzadas.
4. **Violeta es la marca; naranja es el sticker.** El amarillo solo se usa para avisos.
5. **Todo par de color cumple contraste AA** (§4). Si cambias un color, vuelve a medirlo.
6. **Mismas etiquetas e íconos en todas las pantallas** para el mismo destino o acción.

## 2. Tokens y temas

- Tema por atributo: `data-theme="light" | "dark"` en `<html>` (y clase `.dark` por compatibilidad). Respeta `prefers-color-scheme` solo para el valor inicial; la elección del usuario manda.
- Valores exactos: ver `ui-tokens.css`. Resumen de uso:

| Token | Uso |
|---|---|
| `--album-background` | Fondo de página |
| `--album-surface` | Tarjetas, campos, diálogos, barras de navegación |
| `--album-surface-soft` | Fondos de apoyo: láminas faltantes, segmentados, pista de progreso, panel de selección |
| `--album-border` | Bordes decorativos y separadores |
| `--album-input-border` | Bordes funcionales: campos, láminas faltantes, botón secundario (≥ 3:1) |
| `--album-text` / `--album-text-muted` | Texto principal / secundario |
| `--album-on` | **Único** color de texto e íconos sobre `primary`, `accent`, `success`, `warning` y `danger` |
| `--album-primary` | Acción principal, selección, enlaces, pestaña activa |
| `--album-accent` | Acción destacada de intercambio, contador de repetidas, láminas especiales |
| `--album-focus` | Anillo de foco |
| `--album-success/warning/danger` | Estados. Siempre con ícono y texto |
| `--album-owned-a/b` | Degradado de lámina pegada |
| `--album-special-a/b/-on` | Degradado y texto de lámina especial pegada |

- **Reglas:**
  - El anillo de foco no puede coincidir con ningún color de estado de lámina (por eso es blanco en oscuro).
  - Amarillo (`warning`) no se usa en láminas. Lo especial es naranja con estrella y pliegue.
  - No hay color `secondary`. El botón secundario es transparente con borde `input-border`.
  - Fondos y neutros tienen tinte violeta; no uses grises puros ni el negro `#000` como fondo.

## 3. Tipografía

- **Títulos y números: Poppins 600/700.** Es la familia del logotipo.
- **Todo lo demás: Inter 400/500/600.** Buena lectura a 12–14 px y cifras tabulares.
- Alternativa aceptada solo si se aprueba: Outfit + Inter.
- **Sin CDN en producción.** Carga las fuentes con `next/font/google` (o `@font-face` local) y expón las variables `--font-display` y `--font-body`.

| Rol | Tamaño | Alto de línea | Peso | Otros |
|---|---|---|---|---|
| Display | 40 px (32 en ≤ 640 px) | 1.1 | 700 | `letter-spacing: -0.02em`, Poppins |
| H1 | 32 px | 1.2 | 700 | `-0.015em`, Poppins |
| H2 | 24 px | 1.25 | 600 | Poppins |
| H3 | 18 px | 1.3 | 600 | Poppins |
| Cuerpo | 16 px | 1.5 | 400 | Inter |
| Pequeño | 14 px | 1.5 | 400 | Inter |
| Etiqueta | 14 px | — | 600 | Inter |
| Leyenda | 12 px | — | 400 | Inter, color `text-muted` |
| Botón | 15 px | — | 600 | Inter, **sin mayúsculas** |
| Numérico | 24 px | 1.1 | 700 | Poppins, `font-variant-numeric: tabular-nums` |
| Número de lámina | 20 px (16 en compacto) | — | 600 | Poppins |

## 4. Contraste (medido)

Mínimos: 4.5:1 en texto, 3:1 en texto grande, íconos y bordes funcionales.

| Par | Claro | Oscuro |
|---|---|---|
| text / background | 16.4 | 17.1 |
| text-muted / surface-soft | 6.1 | 7.6 |
| on / primary | 9.6 | 6.9 |
| on / accent | 4.6 | 8.1 |
| on / success | 5.4 | 10.8 |
| on / warning | 5.9 | 11.3 |
| on / danger | 6.5 | 8.2 |
| primary / background | 8.9 | 6.9 |
| focus / background | 5.4 | 17.1 |
| input-border / surface | 3.5 | 3.3 |
| blanco / owned-a | 6.3 | 5.1 |
| special-on / special-a | 4.6 | 8.1 |

## 5. Espaciado, forma y elevación

- **Escala:** 4, 8, 12, 16, 24, 32, 48 px (`--s1`…`--s12`).
- **Ritmo:** padding de tarjeta 24 px (16 en ≤ 640 px); separación entre secciones 48 px; título de sección → texto de apoyo 4 px; texto de apoyo → contenido 16 px; gap en grillas de láminas 8 px (6 px en compacto).
- **Layout:** ancho máximo 1120 px; padding de página 24 px (16 en móvil); breakpoint móvil 640 px.
- **Radios:** control 12, tarjeta/diálogo 20, lámina y portada 14, mini-control 8, píldora 9999.
- **Sombras:** `sm` en tarjetas, `md` en láminas pegadas y mini-controles, `lg` en barra móvil, barra de cantidad y diálogo. `glow` es el anillo de foco de campos.

## 6. Íconos

- **Librería: Lucide** (`lucide-react`). Trazo 2 px, puntas y uniones redondeadas, `currentColor`.
- **Tamaños:** 16 px en badges y mensajes de campo, 20 px en botones, alertas y pestañas de escritorio, 24 px en navegación móvil.
- Con texto al lado: `aria-hidden="true"`. Solos: `aria-label` en el botón.
- **Mapa obligatorio** (mismo significado = mismo ícono en toda la app):

| Significado | Ícono Lucide | Significado | Ícono Lucide |
|---|---|---|---|
| Álbumes | `sticker` | Éxito | `circle-check` |
| Explorar / buscar | `search` | Aviso | `triangle-alert` |
| Perfil | `user` | Error | `circle-x` |
| Agregar | `plus` | Información | `info` |
| Quitar | `minus` | Cerrar | `x` |
| Pegada | `check` | Menú | `menu` |
| Repetida | `copy` | Vista grid | `layout-grid` |
| Especial | `star` | Bloqueado | `lock` |
| Logro | `trophy` | Cargando | `loader-circle` (giro 800 ms) |
| Eliminar | `trash-2` | Compartir | `share-2` |
| Intercambio | `arrow-left-right` | | |

> En `reference.html` los íconos están redibujados a mano al estilo Lucide, y el botón "Compartir" usa una estrella como marcador. En la app usa los íconos oficiales y `share-2` para compartir.

## 7. Botones

- **Medidas:** alto 44 px, padding horizontal 16 px, radio 12 px, borde 1.5 px transparente, gap 8 px entre ícono y texto, texto 15/600 sin mayúsculas. Compacto: 36 px alto, padding 12 px, texto 13 px, solo en escritorio denso. Botón de solo ícono: 44 × 44 px con `aria-label`.
- **Variantes:**

| Variante | Fondo | Texto/ícono | Borde |
|---|---|---|---|
| Primario | `primary` | `on` | — |
| Acento | `accent` | `on` | — |
| Secundario | transparente | `text` | `input-border` |
| Ghost | transparente | `primary` | — |
| Peligro | `danger` | `on` | — |

- **Estados:** hover = `brightness(1.1)`; presionado = `scale(.97)`; deshabilitado = opacidad .45, `cursor: not-allowed`, sin hover; cargando = deshabilitado + ícono `loader-circle` girando y texto en gerundio ("Guardando…"); foco = anillo 3 px `focus` con offset 2 px (global, `:focus-visible`).
- **Uso:** un solo botón primario por vista o diálogo. Acciones destructivas siempre con ícono `trash-2` y texto explícito.

## 8. Controles segmentados

- Contenedor: `inline-flex`, padding 4 px, gap 4 px, fondo `surface-soft`, borde 1 px `border`, radio píldora.
- Ítem: alto 40 px, padding horizontal 16 px, texto 14/600, radio píldora, color `text-muted`. Seleccionado: fondo `primary`, texto `on`. Usa `aria-pressed` (o `role="radiogroup"`).
- Se usa para: tema, filtro de láminas (**Todas / Me faltan / Repetidas**) y vista (**Grid / Compacto**).

## 9. Badges

- `inline-flex`, gap 4 px, padding 3 × 10 px, texto 12/600, radio píldora, ícono de 16 px opcional.
- Neutro: fondo `surface-soft`, borde `border`. Rellenos (`primary`, `accent`, `success`, `warning`, `danger`): fondo del token, texto `on`, sin borde.
- Significados fijos: **activo** = primary, **especial** = accent, **completo** = success, **pendiente** = warning, **error** = danger, **borrador** = neutro.

## 10. Formularios

- **Disposición:** grilla `repeat(auto-fit, minmax(240px, 1fr))`, gap 16 × 24 px. Campos largos (notas, casillas) ocupan toda la fila. Nunca más de 3–4 columnas ni columnas angostas.
- **Etiqueta** encima del campo, 14/600. **Ayuda** 12 px `text-muted` debajo.
- **Campo y select:** alto 44 px, padding horizontal 12 px, texto 15 px, fondo `surface`, borde 1.5 px `input-border`, radio 12 px.
- **Foco:** sin outline nativo; borde `focus` + `box-shadow: var(--glow)`.
- **Solo lectura:** fondo `surface-soft`, texto `text-muted`, ícono `lock` a la izquierda.
- **Error:** borde `danger`, mensaje debajo en 12/600 `danger` con ícono `circle-x` de 16 px, y `aria-invalid="true"`. El mensaje dice qué hacer ("Usa solo números.").
- **Textarea:** padding 12 px, alto mínimo 88 px, redimensionable en vertical.
- **Casilla:** 20 px, `accent-color: primary`, fila de 44 px de alto con la etiqueta a la derecha.
- **Campo con ícono** (búsqueda): ícono de 20 px a 12 px del borde izquierdo, `padding-left` 40 px.

## 11. Mensajes, estado vacío y progreso

**Alerta**
- Fila flex, gap 12 px, padding 12 × 16 px, radio 12 px, texto 14 px.
- Color del estado `c`: fondo `color-mix(c 12%, surface)`, borde 1 px `color-mix(c 50%, transparent)`, ícono de 20 px en `c`, texto en `text`.
- Variantes: éxito `circle-check`, aviso `triangle-alert`, error `circle-x`, progreso `loader-circle` girando en `primary`. Nunca viñetas "•" ni caracteres como íconos.

**Estado vacío** (uno solo, sin esqueletos encima)
- Borde 2 px punteado `border`, radio 20 px, padding 32 × 24 px, centrado, gap 12 px.
- Logo de 56 px, título H3, texto `text-muted` de 14 px, y un botón primario con ícono `plus`.

**Barra de progreso:** alto 10 px, radio píldora, pista `surface-soft` con borde 1 px `border`, relleno con degradado 90° de `owned-a` a `special-a`. Siempre con `role="progressbar"`, `aria-valuenow/min/max` y etiqueta visible con el porcentaje.

**Anillo de progreso:** 64 px (48 px compacto), trazo 7, radio 26, `stroke-dasharray: 163.4`, pista `surface-soft`, valor `primary` con puntas redondeadas, girado −90°, transición 200 ms. Porcentaje centrado en Poppins 13/600 (11/600 en compacto). Al 100 % el valor pasa a `success`.

## 12. Componentes de álbum

### 12.1 Portada y estadísticas
- **Portada:** ancho 88 px, proporción 3:4, radio 14 px, degradado 150° de `owned-a` a `special-a`, iniciales del álbum en Poppins 24/700 blanco con sombra de texto sutil.
- **Estadística:** número en estilo *Numérico* (24/700) y leyenda de 12 px debajo; gap entre estadísticas 24 px. Orden: Obtenidas, Me faltan, Repetidas.
- **Tarjeta de álbum (resumen):** portada a la izquierda; a la derecha título H3, "151 de 240 láminas" en leyenda, barra de progreso y estadísticas. **La tarjeta no se estira** para igualar la altura de otra; se alinea arriba.

### 12.2 Lámina (tile)

Modelo de datos: `copias` es un entero de **0 a 9**.

| Copias | Estado | Apariencia |
|---|---|---|
| 0 | Me falta | Borde 2 px **punteado** `input-border`, fondo `surface-soft`, número en `text-muted` |
| 1 | Pegada | Sin borde visible, degradado 150° `owned-a → owned-b`, número blanco, sombra `md`, animación de entrada 200 ms (escala .92 → 1.05 → 1) |
| ≥ 2 | Repetida | Como "pegada" + contador **"+N"** arriba a la derecha, con N = copias − 1 |

- **Especial:** además lleva un ícono `star` de 14 px arriba a la izquierda (siempre, también si falta). Faltante: borde punteado `special-a`. Pegada: degradado 150° `special-a → special-b`, número `special-on` y **pliegue** abajo a la izquierda (triángulo blanco al 80 % de opacidad, 32 % del ancho, `clip-path: polygon(0 0, 100% 100%, 0 100%)`). El contador de una especial usa fondo `surface` y texto `text` en vez de `accent`.
- **Contador "+N":** ancho mínimo 22 px, alto 22 px, padding horizontal 5 px, radio píldora, fondo `accent`, texto `on` 11/600, sombra `sm`, a 5 px de los bordes.
- **Geometría:** proporción 3:4, radio 14 px, número en Poppins 20/600 (16 en compacto), `overflow: hidden`.
- **Seleccionada:** anillo `0 0 0 3px surface, 0 0 0 6px primary`.
- **Hover:** se eleva 2 px, 150 ms.
- **Grilla:** `repeat(auto-fill, minmax(64px, 1fr))`, gap 8 px. Compacto: `minmax(48px, 1fr)`, gap 6 px. Nunca un número fijo de columnas.
- **Leyenda** sobre la grilla: Me falta (punteado), Pegada (violeta), Repetida +N, Especial (naranja). Chips de 14 × 18 px, radio 4 px.
- **Accesibilidad:** cada lámina es un `button` con `aria-label`: `Lámina {n}[ especial], {me falta | pegada | repetida, {N} extra}`.
- **Prohibido:** ciclar estados con un clic (0 → 1 → 2 → 0). Aumentar y reducir son acciones separadas.

### 12.3 Control de cantidad (aumentar y reducir)

Las láminas son muchas y hay scroll: **el control debe quedar al alcance sin desplazarse**. Se resuelve distinto según el dispositivo. Detecta con `matchMedia('(hover: none)')` (no por user-agent).

**Escritorio con mouse (`hover: hover`)**
- Cada lámina tiene dos mini-botones superpuestos en su borde inferior: **− y +**, alto 28 px, radio 8 px, fondo `surface`, texto `text`, sombra `md`, ícono de 14 px, separados 4 px y a 4 px de los bordes.
- Aparecen con `:hover` y con `:focus-within` de la celda. Hover sobre un botón: fondo `primary`, texto `on`.
- `−` deshabilitado en 0 copias; `+` deshabilitado en 9.
- Los mini-botones son botones aparte **dentro de una celda contenedora**, nunca anidados dentro del botón de la lámina.
- Teclado: con la lámina enfocada, `+` o `=` suman y `-` resta.

**Móvil / táctil (`hover: none`)**
- Tocar una lámina la **selecciona** (anillo violeta) y muestra la **barra de cantidad**, que permanece visible mientras se hace scroll por la grilla.
- Barra: `position: fixed` en la app (en la demo usa `sticky`), centrada abajo, **por encima de la barra de navegación inferior** (offset = alto de la nav + 12 px + `env(safe-area-inset-bottom)`), `z-index` sobre la grilla.
- Contenido: lámina de 56 px de ancho, "Lámina N[ · especial]", badge de estado, y el *stepper*: botón `−` 44 px, número en Poppins 24/700, botón `+` 44 px.
- Estilo: radio 12 px, fondo `surface-soft`, borde 1 px `primary`, sombra `lg`, padding 16 px.
- Se cierra al tocar la lámina seleccionada otra vez, al tocar fuera o con un botón `x`.
- `−` deshabilitado en 0; `+` deshabilitado en 9; la cifra usa `aria-live="polite"`.

**Estado en el badge:** 0 = "Me falta" (neutro), 1 = "Pegada" (primary), ≥ 2 = "Repetida · +N extra" (accent).

**Efectos en cadena:** al cambiar copias se actualizan al instante la lámina, los contadores (Pegadas, Me faltan, Repetidas), el anillo de progreso y los filtros activos.

### 12.4 Filtros y vistas
- Filtro (Todas / Me faltan / Repetidas) oculta las celdas que no corresponden; mantiene la selección.
- Vista (Grid / Compacto) cambia solo el tamaño mínimo de columna, el gap y el tamaño del número.

## 13. Navegación, diálogo y logro

**Navegación (mismas etiquetas e íconos en todos lados):** Álbumes (`sticker`), Explorar (`search`), Perfil (`user`).
- **Barra superior (escritorio):** fila flex, gap 16 px, padding 8 × 16 px, fondo `surface`, borde 1 px `border`, radio 20 px. Marca (logo 32 px + "App Álbum" en H3) a la izquierda, pestañas centradas, resto a la derecha. Pestaña: alto 44 px, padding horizontal 16 px, radio 12 px, texto 14/600, ícono de 20 px. Activa: fondo `surface-soft`, texto `primary`, `aria-current="page"`. En ≤ 640 px se ocultan las etiquetas de la barra superior y quedan los íconos.
- **Barra inferior (móvil):** máximo 380 px, grilla de 3 columnas, padding 8 px, fondo `surface`, borde 1 px `border`, radio 24 px, sombra `lg`. Ítem en columna: ícono de 24 px, etiqueta 11/600, alto mínimo 56 px; activo igual que arriba.
- **Menú hamburguesa:** solo si hay más destinos de los que caben. No convive con pestañas visibles que cubren los mismos destinos.

**Diálogo:** elemento `<dialog>` nativo (foco atrapado y `Esc` cierran solos). Radio 20 px, padding 24 px, ancho máximo 400 px (100 % − 32 px en móvil), fondo `surface`, borde 1 px `border`, sombra `lg`. Fondo (`::backdrop`): `rgb(19 15 31 / .7)` con `blur(4px)`. Título H3; texto `text-muted` 14 px que explica la consecuencia; acciones alineadas a la derecha: **Cancelar** (secundario) y la acción principal. Destructivo = botón `danger` con `trash-2`.

**Logro "Álbum completado":** tarjeta de radio 20 px, padding 24 px, degradado 120° `owned-a → owned-b`, texto blanco. Recuadro de 56 px con radio 12 px, fondo `special-a`, ícono `trophy` en `special-on`. Título H3, subtítulo 14 px al 90 % de opacidad, botón acento pequeño "Compartir" con `share-2`. No es un banner amarillo.

## 14. Logo

- Colores **fijos**. Nunca usar variables de tema en el SVG (en modo claro el cuadro central debe seguir siendo oscuro).
- Tamaños: 32 px (barra), 48 px (cabecera), 56 px (estado vacío).
- Definir el `<symbol>` **una sola vez** por página y reutilizarlo con `<use href="#mark"/>` (ids de degradado únicos).

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a1fb8"/><stop offset="1" stop-color="#2a1285"/></linearGradient>
  <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a2b"/><stop offset="1" stop-color="#ff4d12"/></linearGradient>
  <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4a1fb8"/><stop offset=".55" stop-color="#6b2fc9"/><stop offset="1" stop-color="#f0583a"/></linearGradient></defs>
  <symbol id="mark" viewBox="0 0 200 200">
    <rect x="10" y="10" width="180" height="180" rx="52" fill="url(#g1)"/>
    <rect x="40" y="40" width="120" height="120" rx="24" fill="#190c58" stroke="#5b34e0" stroke-width="10"/>
    <path d="M64 45H136Q155 45 155 64V136Q155 155 136 155H81L45 119V64Q45 45 64 45Z" fill="url(#g2)"/>
    <rect x="65" y="59" width="70" height="56" rx="14" fill="url(#g3)"/>
    <path d="M45 119L81 155L81 119Z" fill="#ffc48f" stroke="#ffc48f" stroke-width="3" stroke-linejoin="round"/>
  </symbol>
</svg>
```

## 15. Movimiento

- Color y borde: 150 ms. Progreso, anillo y entrada de lámina: 200 ms. Spinner: 800 ms lineal. Curva `cubic-bezier(.2, 0, 0, 1)`.
- Con `prefers-reduced-motion: reduce`, toda animación y transición baja a 0.01 ms.

## 16. Accesibilidad (resumen verificable)

- Foco visible global: `:focus-visible { outline: 3px solid var(--album-focus); outline-offset: 2px; }`. Nunca se elimina sin sustituto.
- Todo control táctil ≥ 44 × 44 px (excepción única: mini-controles de escritorio con mouse).
- Estado de lámina por forma + texto accesible, no solo color.
- Íconos solos con `aria-label`; íconos con texto con `aria-hidden`.
- Errores de campo con `aria-invalid` y mensaje asociado.
- Cambios de cantidad anunciados con `aria-live="polite"`.

## 17. Qué NO hacer (errores de la versión anterior)

1. Paleta con swatches duplicados o sin función. El conjunto de tokens de §2 es el definitivo.
2. Usar el mismo color para foco y lámina pegada.
3. Amarillo para "especial" y para "aviso" a la vez.
4. Dos colores distintos de texto sobre relleno (usa solo `--album-on`).
5. Títulos de sección livianos o H1/H2/H3 casi iguales.
6. Botones con texto en mayúsculas.
7. Etiquetas dentro de láminas diminutas o que se desbordan; `+N` ilegible.
8. Tarjetas que se estiran con espacio vacío.
9. Pestañas y menú hamburguesa duplicando destinos, o etiquetas distintas ("Mis álbumes" vs "Álbumes").
10. Viñetas o guiones de texto como íconos; esqueletos grises sobre estados vacíos.
11. Formularios de 5 columnas angostas.
12. Banners planos amarillos para logros.
13. Gradientes de láminas mezclados con el color de fondo en vez de con oscuro.
14. Logo con colores del tema.

## 18. Mapeo sugerido a Tailwind 4 (adaptar al repositorio)

```css
@import "tailwindcss";
@import "./ui-tokens.css";

@theme inline {
  --color-background: var(--album-background);
  --color-surface: var(--album-surface);
  --color-surface-soft: var(--album-surface-soft);
  --color-border: var(--album-border);
  --color-input-border: var(--album-input-border);
  --color-foreground: var(--album-text);
  --color-muted: var(--album-text-muted);
  --color-on: var(--album-on);
  --color-primary: var(--album-primary);
  --color-accent: var(--album-accent);
  --color-focus: var(--album-focus);
  --color-success: var(--album-success);
  --color-warning: var(--album-warning);
  --color-danger: var(--album-danger);
  --radius-control: var(--r-md);
  --radius-card: var(--r-lg);
  --radius-tile: var(--r-tile);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --font-display: var(--font-display);
  --font-sans: var(--font-body);
}
```

## 19. Criterios de aceptación

Verifica cada punto en tema claro **y** oscuro:

- [ ] `body` tiene el fondo `--album-background` (#f7f5ff claro / #130f1f oscuro) en toda la página.
- [ ] Títulos y números usan Poppins; el resto Inter. Sin fuentes cargadas desde CDN.
- [ ] Ningún componente contiene colores hexadecimales propios (salvo el logo).
- [ ] Botones y campos miden 44 px de alto; el texto del botón es 15 px/600 sin mayúsculas.
- [ ] El foco se ve en botones, campos, láminas y pestañas (3 px, offset 2 px).
- [ ] Una lámina pegada es violeta con degradado; la especial es naranja con estrella y pliegue abajo a la izquierda.
- [ ] Una lámina con 3 copias muestra "+2".
- [ ] No existe el ciclo de clic 0 → 1 → 2 → 0. `−` y `+` son controles separados y `−` se deshabilita en 0.
- [ ] En escritorio, `−` y `+` aparecen al pasar el mouse o al enfocar una lámina. En táctil, una barra de cantidad queda visible durante el scroll de la grilla.
- [ ] Cambiar copias actualiza lámina, contadores, anillo y filtros.
- [ ] La grilla usa `auto-fill`; en compacto las columnas bajan a 48 px.
- [ ] Alertas, navegación y campos usan íconos Lucide (nada de "•", "▲", "×", "▣").
- [ ] Álbumes / Explorar / Perfil tienen las mismas etiquetas e íconos en barra superior e inferior.
- [ ] El diálogo es `<dialog>` nativo, cierra con `Esc` y atrapa el foco.
- [ ] El logo se ve igual en claro y oscuro.
- [ ] Todos los pares de contraste de §4 se cumplen.
- [ ] Con `prefers-reduced-motion: reduce` no quedan animaciones.
- [ ] Se entregan capturas claro/oscuro comparadas con `reference.html` y una nota con lo que no pudo cumplirse.
