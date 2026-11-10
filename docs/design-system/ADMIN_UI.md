# Admin UI — Gates y decisiones aprobadas

Este documento registra el contrato aprobado para la fundación y la migración visual de la administración. No cambia lógica de negocio, repositorios, servicios, Server Actions, base de datos ni autorización.

Los nombres históricos 4B, 4C y 4D no son dependencias contractuales. El trabajo se valida mediante las capacidades concretas de los Gates A–D.

## Gate A — Foundation

Debe estar estable:

- tipografía DESIGN v2;
- `Icon`;
- mapa central de iconos;
- tokens;
- spacing/radius aprobados.

## Gate B — Primitives

Debe estar estable:

- `Button`;
- `Badge`;
- `Field`;
- `PageHeader`;
- `SurfaceCard`;
- `SegmentedControl`;
- `ConfirmAction`;
- `InlineMessage`;
- `EmptyState`;
- `ErrorState`;
- `LoadingRegion` / `Skeleton`;
- `Progress`.

Las extensiones necesarias para administración se implementan y revisan antes de migrar páginas.

## Gate C — Shell/Navigation

Debe estar estable:

- `AppShell`;
- `NavLink`;
- `MobileNav`;
- separación administrativa aprobada.

## Gate D — Cierre antes de merge a `main`

Debe completarse antes de autorizar el merge a `main`:

- retirada de aliases temporales;
- `ProgressRing`;
- página de previsualización de componentes base.

Gate D no autoriza por sí solo commit, push, merge ni deploy. El merge a `main` requiere aprobación explícita posterior.

## Decisiones D1–D9

### D1 — Navegación administrativa

La administración usa una segunda fila exclusiva para administradores.

En escritorio:

- primera fila: destinos de usuario, tema, username y logout;
- segunda fila: `Administrar álbumes` y `Administrar usuarios`.

La fila usa `NavLink`, `Icon`, `aria-current="page"` y `whitespace-nowrap`. No se implementa un menú «Administración».

En móvil, la navegación normal y administrativa permanecen separadas. El dock conserva exclusivamente destinos de usuario y las rutas administrativas usan una fila compacta horizontal desplazable. No se mezclan las cuatro rutas como destinos equivalentes ni se añade un menú complejo sin necesidad demostrada.

### D2 — Tablas responsive

Las tablas administrativas usan scroll horizontal accesible, no tarjetas:

- wrapper con `overflow-x-auto`;
- `tabIndex={0}`;
- `role="region"`;
- `aria-label` específico;
- foco visible;
- `min-width` apropiado;
- encabezados y estructura de tabla semánticos.

### D3 — Búsqueda

`/admin/albums` y `/admin/users` usan filtrado local cliente mediante un componente pequeño que recibe las filas ya resueltas en servidor.

La búsqueda:

- filtra sólo las filas cargadas;
- no cambia repositorios;
- no cambia services;
- no cambia Server Actions;
- no cambia contratos de página con servidor;
- no introduce query string;
- no persiste la búsqueda.

### D4 — `dangerGhost`

`Button variant="dangerGhost"` tiene:

- background transparente;
- foreground e icono `danger`;
- borde transparente;
- hover centralizado con `color-mix(in srgb, var(--album-danger) 12%, var(--album-surface))`;
- foco global;
- estado disabled consistente.

No usa modificadores Tailwind de opacidad sobre tokens. La confirmación final dentro de `ConfirmAction` usa `Button variant="danger"` sólido.

### D5 — Roles y estados

La traducción es exclusivamente visual; no cambia los valores internos:

- `admin` → `Administrador`, badge `primary`;
- `user` → `Usuario`, badge `neutral`;
- `active` → `Activo`, badge `success`;
- `banned` → `Bloqueado`, badge `danger`.

### D6 — Estado del álbum

El estado aparece una sola vez en la cabecera mediante `Badge`. Se eliminan sus duplicaciones en el subtítulo del bloque Álbum, badge interior y fila Estado del resumen.

### D7 — Acciones del álbum

En `/admin/albums/[id]` existe una sola zona de acciones cerca de la cabecera. Se elimina el segundo `AlbumActions` inferior.

Jerarquía:

- acción principal: `Publicar` / `Volver a borrador`;
- acción destructiva: `Eliminar`, con `dangerGhost` + `ConfirmAction`.

No se crea una segunda danger zone inferior.

### D8 — Mezclas de estado

La fila seleccionada usa una regla centralizada:

```css
color-mix(in srgb, var(--album-primary) 8%, var(--album-surface))
```

El hover danger usa:

```css
color-mix(in srgb, var(--album-danger) 12%, var(--album-surface))
```

No se hardcodean colores HEX en componentes ni se usan clases como `bg-primary/10`, `bg-danger/10` o equivalentes con opacidad sobre tokens.

### D9 — `SegmentedControl` tabs

`SegmentedControl` se extiende retrocompatiblemente con `mode="tabs"` y semántica:

- `role="tablist"`;
- `role="tab"`;
- `aria-selected`;
- `aria-controls`;
- `role="tabpanel"`;
- navegación por ArrowLeft, ArrowRight, Home y End.

Los modos `toggle` y `radio` permanecen compatibles y protegidos por pruebas.

## Contraste de `dangerGhost`

La fuente de verdad de colores es `scripts/ui-tokens.ts`. Las pruebas de `scripts/contrast.test.ts` construyen las mezclas desde `productiveCanonicalColorTokens`; no duplican colores literales.

En ambos temas se validan con mínimo WCAG AA 4.5:1:

1. `danger` sobre `surface`;
2. `danger` sobre hover, donde hover = 12% `danger` + 88% `surface` en sRGB;
3. `danger` sobre fila seleccionada, donde fila = 8% `primary` + 92% `surface` en sRGB;
4. `danger` sobre hover de fila seleccionada, donde hover = 12% `danger` + 88% fila seleccionada en sRGB;
5. `danger` sobre hover basado en `surface-soft`, donde hover = 12% `danger` + 88% `surface-soft` en sRGB.

Valores medidos por el test al registrar este contrato:

| Par | Light | Dark |
|---|---:|---:|
| danger / surface | 6.54:1 | 7.62:1 |
| danger / hover | 5.37:1 | 6.23:1 |
| danger / fila seleccionada | 5.67:1 | 6.78:1 |
| danger / hover sobre fila seleccionada | 4.69:1 | 5.48:1 |
| danger / hover sobre surface-soft | 4.61:1 | 5.63:1 |

Los valores medidos son evidencia informativa. El test siempre recalcula los resultados desde los tokens actuales y falla si algún par cae bajo el mínimo.

## Artefactos versionados

Los siguientes archivos fueron copiados sin cambios desde el directorio de referencia no versionado `docs/design-references/app-album-visual-proposal/new/`:

- `DESIGN.md`;
- `design-tokens.json`;
- `ui-tokens.css`.

Las copias canónicas para revisión viven ahora en `docs/design-system/`. `reference.html` también quedó versionado, en `docs/design-system/reference/reference.html`.

## Acciones por fila en la administración de álbumes

Decisiones aprobadas para la lista `/admin/albums`:

- La acción **Editar** por fila usa `Button size="sm"` (36 px de alto) como excepción explícita del admin de escritorio denso. La regla general de 44 px de DESIGN v2 §16 sigue vigente para el resto de controles; esta excepción se limita a las acciones dentro de filas de tabla administrativa en escritorio.
- El **título del álbum ya no es un enlace**. La entrada al detalle es el botón **Editar** de la fila, con `aria-label` que incluye el nombre del álbum. Así no existen dos destinos distintos hacia la misma ruta ni un enlace duplicado dentro de la celda del título.
- El título se conserva como dato principal de la fila, en texto (`text-content`), junto al slug como línea secundaria.
