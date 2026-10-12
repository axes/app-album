# UI/UX Phase 1 — Auditoría y plan

**Proyecto:** App Álbum

**Fase:** UI-01 — Audit + Plan Only

**Estado:** `READY_FOR_UI_UX_PHASE1_REVIEW`
**Alcance de este documento:** análisis y planificación. No incluye cambios de interfaz, comportamiento, dependencias, rutas, autenticación ni base de datos.

## 0. Resumen ejecutivo

App Álbum ya dispone de una base visual semántica pequeña y consistente: Tailwind CSS 3.4, variables CSS para light/dark, componentes con buena semántica HTML y una interfaz funcional que prioriza densidad sobre decoración. El tema se aplica antes del primer render, se guarda en `localStorage` y usa simultáneamente la clase `dark` y `data-theme`.

La deuda principal no está en una paleta descontrolada, sino en la repetición de patrones visuales dentro de los componentes: botones, campos, tarjetas, badges, estados, tablas y mensajes se construyen una y otra vez con cadenas de utilidades. También faltan una escala explícita de radios, transiciones, estados de carga progresiva y tokens propios del dominio de láminas.

**Conclusión de compatibilidad:** daisyUI 5 no es compatible directamente con la configuración actual. El repositorio usa Tailwind CSS `3.4.19`; daisyUI 5 está diseñado para Tailwind CSS 4 y su integración oficial usa la configuración CSS-first de Tailwind 4 (`@import "tailwindcss"`, `@plugin "daisyui"`) y `@tailwindcss/postcss`. Adoptarlo exige una migración técnica previa y controlada de Tailwind 3 a 4. Instalar daisyUI 5 sin esa migración no es una opción válida.

La recomendación es realizar UI-02 como una **fase técnica de cimientos**, no como rediseño masivo: migrar Tailwind 3→4 y añadir daisyUI 5 con dos temas propios que reproduzcan la paleta actual, conservar el selector de tema y sus contratos, mantener temporalmente aliases de compatibilidad y validar que la interfaz no cambie de forma involuntaria. La adopción de componentes daisyUI debe ocurrir después, por familias y pantallas.

---

## 1. Estado actual

### 1.1 Observaciones confirmadas en código

| Área | Estado confirmado |
|---|---|
| Framework | Next.js `15.5.26`, App Router |
| UI | React `19.3.0`, React DOM `19.3.0` |
| Lenguaje | TypeScript `5.9.3`, modo estricto |
| Estilos | Tailwind CSS `3.4.19`, PostCSS `8.5.28`, Autoprefixer `10.6.1` |
| Configuración Tailwind | `tailwind.config.ts`, `darkMode: "class"`, contenido `./src/**/*.{ts,tsx}` |
| CSS global | Un único archivo: `src/app/globals.css` |
| Componentes UI externos | Ninguno; daisyUI no está instalado |
| Animación externa | Ninguna; Motion/Framer Motion no está instalado |
| Pruebas | Vitest `2.1.9`; existen pruebas unitarias y de componentes |
| ORM/BD | Drizzle ORM `0.38.4` + PostgreSQL; irrelevante para esta fase y no modificado |

Versiones complementarias comprobadas: Drizzle Kit `0.30.6`, ESLint `9.39.5`, Zod `3.25.76`, iron-session `8.0.4` y `@node-rs/argon2` `2.2.1`.

### 1.2 Configuración global de Tailwind

`tailwind.config.ts` amplía colores con variables CSS:

- `background` → `--background`
- `surface` → `--surface`
- `surface-muted` → `--surface-muted`
- `content` → `--text`
- `muted` → `--muted`
- `border` → `--border`
- `input` → `--input`
- `input-border` → `--input-border`
- `primary` → `--primary`
- `primary-text` → `--primary-text`
- `danger` → `--danger`
- `success` → `--success`

`--focus` existe en CSS, pero no se expone como color Tailwind; se usa directamente en la regla global `:focus-visible`.

PostCSS usa el plugin `tailwindcss` junto con `autoprefixer`, que es el esquema de Tailwind 3. El CSS global utiliza las directivas `@tailwind base`, `@tailwind components` y `@tailwind utilities`.

### 1.3 Paleta visual actual

#### Tema claro

| Token actual | Valor |
|---|---|
| `--background` | `#f8fafc` |
| `--surface` | `#ffffff` |
| `--surface-muted` | `#f1f5f9` |
| `--text` | `#0f172a` |
| `--muted` | `#64748b` |
| `--border` | `#e2e8f0` |
| `--input` | `#ffffff` |
| `--input-border` | `#cbd5e1` |
| `--primary` | `#ea580c` |
| `--primary-text` | `#ffffff` |
| `--focus` | `#0891b2` |
| `--success` | `#10b981` |
| `--danger` | `#ef4444` |

#### Tema oscuro

| Token actual | Valor |
|---|---|
| `--background` | `#0f172a` |
| `--surface` | `#1e293b` |
| `--surface-muted` | `#0b1120` |
| `--text` | `#f8fafc` |
| `--muted` | `#94a3b8` |
| `--border` | `#334155` |
| `--input` | `#1e293b` |
| `--input-border` | `#475569` |
| `--primary` | `#f97316` |
| `--primary-text` | `#ffffff` |
| `--focus` | `#06b6d4` |
| `--success` | `#34d399` |
| `--danger` | `#f87171` |

El naranja es el color primario y el cian se reserva para foco. No existen aún tokens globales para `secondary`, `accent`, `warning`, estados de lámina, radios, sombras o duración/easing.

### 1.4 Clases y escalas observadas

La auditoría de los TSX productivos encontró estos patrones dominantes:

- Tipografía: `text-sm` y `text-xs` predominan; encabezados usan principalmente `text-2xl` y `text-lg`.
- Separación: `gap-2`, `gap-1` y `gap-3` son los más frecuentes; hay contenedores principales con `gap-6`.
- Controles: predominan `px-3 py-2`; los controles administrativos compactos usan `px-2 py-1` o `py-0.5`.
- Tarjetas: combinaciones repetidas de `rounded border border-border bg-surface` con `p-2`, `p-3` o `p-4`.
- Radios: se usa exclusivamente el radio genérico `rounded`; no existe una escala semántica entre tarjeta y control.
- Sombras: no se usa ninguna clase `shadow-*`.
- Transiciones: sólo hay dos usos relevantes, uno genérico y otro `transition-transform`.
- Breakpoints: se usan `sm`, `lg` y una vez `xl`; no se observaron usos de `md` o `2xl`.
- Layout global: ancho máximo `max-w-5xl`, padding horizontal `px-4`, contenido principal con `gap-6` y `pb-12`.
- Responsive: los listados de álbumes pasan a 2 columnas en `sm` y 3 en `lg`; el mosaico de láminas usa 2/3/4/5 columnas en base/`sm`/`lg`/`xl`.
- Tablas: se protegen mediante `overflow-x-auto`; los formularios de gestión cambian de columna a fila desde `sm`.

No hay uso de modificadores `dark:` en los componentes. Tampoco se usan modificadores de opacidad sobre colores basados en variables CSS, lo que debe preservarse.

### 1.5 Colores hardcodeados

El uso de colores semánticos es amplio y consistente. La excepción confirmada está en `src/app/page.tsx`, que usa:

- `text-neutral-600`
- `bg-neutral-900`
- `border-neutral-300`
- `text-white`

Esta portada inicial no sigue por completo los tokens y puede presentar contraste/armonía distintos al cambiar de tema. Debe incorporarse a una etapa futura, no corregirse dentro de UI-01.

---

## 2. Arquitectura visual existente

### 2.1 Observaciones confirmadas

No existe todavía una biblioteca de componentes compartidos. `src/components` contiene solamente `theme-toggle.tsx`. La mayoría de las piezas visuales viven junto a su ruta o dominio.

Componentes reutilizables ya presentes:

| Componente | Ubicación | Responsabilidad actual |
|---|---|---|
| `ThemeToggle` | `src/components/theme-toggle.tsx` | Alterna y persiste light/dark |
| `CollectionNav` | `src/app/app/collection-nav.tsx` | Navegación del usuario y logout |
| `ProgressSummary` | `src/app/app/progress.tsx` | Texto y barra de progreso |
| `AlbumCover` | `src/app/admin/albums/album-cover.tsx` | Portada y placeholder de error/ausencia |
| `ActionForm` | `src/app/admin/albums/action-form.tsx` | Estado de Server Action y mensajes |
| `Collapsible` | mismo archivo | Bloque desplegable compacto |
| `Card` | mismo archivo | Card/accordion administrativo |
| `AlbumForm` | `src/app/admin/albums/album-form.tsx` | Formulario de álbum |
| `AlbumActions` | `src/app/admin/albums/album-actions.tsx` | Publicar, volver a borrador, eliminar |
| `StickerTable` | `src/app/admin/albums/sticker-table.tsx` | Tabla editable, selección y acciones masivas |
| `InlinePageName` | `src/app/admin/albums/inline-page-name.tsx` | Edición inline del nombre de página |
| `StickerCollection` | `src/app/app/albums/[userAlbumId]/sticker-collection.tsx` | Mosaico/lista y cantidades |
| `QuantityButton` | `src/app/app/albums/quantity-button.tsx` | Control compacto de cantidad |
| `ShareControls` | detalle de colección | Activar, copiar y desactivar enlace público |

### 2.2 Inventario por pantalla

#### Navegación

- La navegación autenticada es una fila flexible de links subrayados con logout alineado al extremo.
- Los accesos administrativos aparecen según rol.
- Las pantallas administrativas no comparten esta navegación completa: usan enlaces locales como “← Álbumes”, “Usuarios” o “Área protegida”.
- El selector de tema está separado sobre el `<main>` en el layout raíz y consume una franja vertical propia.

#### Inicio público y autenticación

- `/` es una portada mínima con título, texto y dos acciones.
- `/login` y `/register` son formularios verticales simples.
- Login y registro duplican el patrón de label, input, error, CTA y enlace secundario.
- Los formularios aprovechan atributos HTML nativos (`required`, límites, autocomplete, pattern).

#### Biblioteca/listado de álbumes

- `/app` y `/app/albums` repiten el mismo patrón de grilla y card de álbum.
- En móvil la card es horizontal; desde `sm` pasa a vertical.
- `AlbumCover` se reutiliza correctamente.
- `/app` añade `ProgressSummary`; explorar añade la acción de incorporación a la colección.
- Hay empty states simples, legibles y funcionales.

#### Detalle de colección personal

- Encabezado con portada, metadatos, progreso, sharing y eliminación.
- Láminas agrupadas mediante `<details>`.
- Vista mosaico predeterminada y vista lista alternativa.
- Los controles `+`/`−` tienen 40×40 px, adecuados para interacción táctil.
- Faltantes se pueden marcar directamente desde la tarjeta completa.

#### Administración de álbumes, páginas y láminas

- El listado de álbumes es una tabla horizontalmente desplazable.
- El editor de álbum usa cards desplegables para reducir scroll inicial.
- Los formularios de creación de páginas y láminas también son desplegables.
- Páginas y láminas admiten edición inline y acciones compactas.
- `StickerTable` concentra la interfaz más compleja: selección por rango, selección masiva, asignación, eliminación, edición inline y ordenamiento.
- El archivo `sticker-table.tsx` tiene 579 líneas: es un foco de complejidad UI, aunque no se detectó un defecto funcional que justifique refactorizarlo dentro de esta fase.

#### Administración de usuarios

- Tabla/listado compacto con acciones para rol y estado.
- Reutiliza el mismo lenguaje de botones, controles y mensajes, pero mediante cadenas de clases locales.

#### Vista pública compartida

- Repite encabezado, portada y progreso del detalle privado.
- Faltantes y repetidas se agrupan en `<details>` y grillas compactas.
- El bloque de progreso está duplicado en lugar de usar `ProgressSummary`.

#### Modales, alertas y mensajes

- No existe un componente modal propio.
- Las confirmaciones destructivas usan `window.confirm`.
- Errores y éxitos se muestran como texto inline (`text-danger`, `text-success`, `role="alert"` cuando corresponde).
- No existe un sistema compartido de `alert`, toast o mensajes con `aria-live`/`role="status"`.

### 2.3 Duplicación visual confirmada

1. **Campos:** las cadenas de input/select/textarea aparecen tanto inline como en constantes locales (`field`, `fieldClass`).
2. **Botones:** primary, neutral, danger, icon y link se reconstruyen en numerosos archivos.
3. **Badges de estado:** el badge Borrador/Publicado está duplicado entre listado y detalle administrativo.
4. **Cards/paneles:** `rounded border border-border bg-surface` se repite en cards, details, empty states y toolbars.
5. **Mensajes:** error, éxito y “Procesando…” se renderizan localmente con pequeñas variaciones.
6. **Listados de álbumes:** `/app` y `/app/albums` comparten una estructura casi idéntica.
7. **Progreso:** la vista pública replica manualmente `ProgressSummary`.
8. **Navegación administrativa:** no existe un shell de navegación común.
9. **Iconos:** se mezclan símbolos Unicode (`↑`, `↓`, `⌄`, `▦`, `☷`, `+`, `−`) y SVG inline; el lápiz SVG está duplicado.

---

## 3. Implementación actual de light/dark

### 3.1 Observaciones confirmadas

Los archivos responsables son:

- `src/lib/theme.ts`
- `src/components/theme-toggle.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/lib/theme.test.ts`

Flujo actual:

1. La clave de almacenamiento es `app-album-theme`.
2. Los valores válidos son exclusivamente `light` y `dark`.
3. Una preferencia válida en `localStorage` tiene precedencia.
4. Sin preferencia válida, se consulta `prefers-color-scheme: dark`.
5. Un script inline en `<head>` se ejecuta antes del primer paint.
6. El script aplica simultáneamente:
   - `document.documentElement.classList.toggle("dark", ...)`
   - `document.documentElement.dataset.theme = theme`
7. `<html>` usa `suppressHydrationWarning` para tolerar la mutación previa a hidratación.
8. `ThemeToggle` vuelve a resolver/aplicar el tema al montarse y lo persiste al alternar.
9. Si `localStorage` no está disponible, el cambio visual se aplica igualmente y sólo falla la persistencia.
10. El CSS claro vive en `:root`; el oscuro, en `.dark`.
11. `color-scheme` cambia entre `light` y `dark`, afectando también controles nativos del navegador.

No se utilizan cookies ni se sincroniza el tema entre pestañas. Tampoco se escucha un cambio posterior del tema del sistema cuando el usuario no ha guardado preferencia; esto no es necesariamente un defecto y no debe cambiarse sin una decisión de producto.

### 3.2 Dependencias de dark mode

- Los componentes no tienen condiciones de tema ni variantes `dark:`.
- Toda la adaptación visual depende de variables CSS.
- La clase `dark` es relevante para Tailwind por configuración, aunque hoy no hay consumidores `dark:*`.
- `data-theme` ya coincide con el mecanismo principal que daisyUI espera.
- Las pruebas verifican explícitamente que el script incluya `classList.toggle('dark'...)`; por ello, retirar la clase `dark` rompería un contrato probado y no aporta beneficio.

### 3.3 Recomendación

Conservar `ThemeToggle`, `THEME_STORAGE_KEY`, la resolución de preferencia, el script anti-flash, la clase `dark` y `data-theme`. La integración futura debe adaptar las variables detrás de este mecanismo, no reemplazar el comportamiento.

En daisyUI, definir temas custom con nombres `light` y `dark` permite que el `data-theme` actual siga funcionando sin introducir una librería de cambio de tema.

---

## 4. Problemas y deuda visual encontrada

### 4.1 Observaciones confirmadas

#### Sistema visual

- No hay una capa de primitives compartidos para Button, Input, Badge, Alert, Card o EmptyState.
- Existen 66 usos del radio genérico `rounded`; card y control no se diferencian semánticamente.
- No hay sombras ni token de elevación.
- `secondary`, `accent` y `warning` no existen.
- Los estados propios del dominio (obtenida, faltante y repetida) reutilizan `muted`, `success` y `primary`, sin tokens dedicados.
- El inicio público contiene colores hardcodeados fuera del sistema.
- `--focus` no está mapeado en Tailwind, aunque su uso global es correcto.

#### Interacción y feedback

- Sólo existen dos transiciones declaradas; hover y cambios de estado suelen ser instantáneos.
- No existen skeletons, `loading.tsx`, animaciones de entrada ni estrategia global de reduced motion.
- No hay lazy loading explícito en `AlbumCover`; se usa `<img>` nativo sin `loading="lazy"`, dimensiones intrínsecas ni `decoding="async"`.
- Los estados pending son principalmente cambios de texto u opacidad; no hay feedback visual unificado.
- Los mensajes exitosos no tienen una semántica live-region compartida.

#### Mantenibilidad

- `StickerTable` concentra mucha lógica y markup visual en un archivo grande.
- Hay constantes de clase duplicadas entre archivos (`field`, `primaryButton`, `dangerButton`, `iconButton`).
- La falta de primitives hará costosa una migración global si se intenta reemplazar cada cadena directamente.

### 4.2 Densidad y scroll

#### Observaciones confirmadas

- El layout raíz crea una fila separada para el selector de tema y después un `<main>` con `pt-4`; esto consume altura antes de la navegación y el título.
- Muchas pantallas usan `gap-6` entre navegación, título, header y contenido. Es legible, pero en vistas compactas puede acumular espacio vertical.
- El detalle privado apila navegación, header grande (`gap-5`, `p-4`), panel de sharing y colección de láminas.
- La vista pública abre todos los grupos de faltantes y repetidas por defecto, lo que puede generar scroll considerable en álbumes grandes.
- El editor administrativo ya mitiga scroll mediante `<details>` y formularios colapsables.
- La tabla de láminas está deliberadamente compactada para catálogos de aproximadamente 240 elementos.
- Las portadas conservan relación 3:4 y pueden dominar visualmente las cards verticales desde `sm`.
- Los empty states usan `p-6`; no son excesivos de forma aislada.

#### Recomendaciones, sin rediseño en esta fase

1. Integrar tema y navegación en un shell común o cabecera compacta para evitar una fila exclusiva del toggle.
2. Estandarizar separación vertical de página en 16–20 px y reservar 24 px para cambios claros de sección.
3. Mantener controles táctiles críticos en 40 px como mínimo, pero permitir botones administrativos secundarios de 32–36 px.
4. Revisar la altura/ratio visible de portadas en cards para equilibrar información y scroll.
5. Mantener `<details>` en administración; en vistas públicas, evaluar grupos cerrados o apertura selectiva según volumen.
6. Agrupar metadatos secundarios en una línea y acciones relacionadas en toolbars compactas.
7. Evitar convertir cada bloque en una card con padding amplio; usar superficies, divisores y densidad según jerarquía.
8. No reducir la densidad de `StickerTable` sin pruebas con álbumes reales.

---

## 5. Estrategia de variables y tokens

### 5.1 Principios recomendados

- Los componentes consumen tokens semánticos; nunca deciden manualmente entre light y dark.
- Los nombres `--album-*` expresan la intención de producto.
- Los tokens daisyUI expresan la intención de la biblioteca.
- Debe existir una sola fuente efectiva por tema, evitando dos paletas independientes.
- Durante la transición, los nombres actuales (`--background`, `--surface`, etc.) pueden ser aliases de compatibilidad.
- No usar opacidad Tailwind sobre tokens basados en variables CSS (`bg-primary/10`, `text-primary/80`, etc.). Para superficies suaves deben existir tokens sólidos explícitos.

### 5.2 Propuesta de tokens de App Álbum

```css
/* Esquema conceptual; no implementado en UI-01 */
--album-primary;
--album-primary-content;
--album-secondary;
--album-secondary-content;
--album-accent;
--album-accent-content;

--album-background;
--album-surface;
--album-surface-soft;
--album-border;
--album-input;
--album-input-border;

--album-text;
--album-text-muted;
--album-focus;

--album-success;
--album-warning;
--album-danger;

--sticker-owned;
--sticker-missing;
--sticker-duplicate;

--radius-card;
--radius-control;

--transition-fast;
--transition-normal;
--ease-standard;
```

Propuesta inicial de escala:

- `--radius-control`: `0.375rem` (equivalente visual cercano al `rounded` actual).
- `--radius-card`: `0.5rem` (separación leve entre contenedor y control).
- `--transition-fast`: `150ms`.
- `--transition-normal`: `200ms`.
- `--ease-standard`: `cubic-bezier(0.2, 0, 0, 1)` o una curva equivalente validada visualmente.

Los valores definitivos de `secondary`, `accent`, `warning` y estados de lámina deben someterse a contraste y revisión visual. No corresponde inventarlos y consolidarlos sin prototipo.

### 5.3 Mapeo recomendado a daisyUI 5

| App Álbum | daisyUI 5 | Uso |
|---|---|---|
| `--album-background` | `--color-base-200` | Fondo general |
| `--album-surface` | `--color-base-100` | Cards, paneles, controles sobre fondo |
| `--album-surface-soft` | `--color-base-200` o token adicional | Superficie suave |
| `--album-border` | `--color-base-300` | Bordes/divisores |
| `--album-text` | `--color-base-content` | Texto principal |
| `--album-primary` | `--color-primary` | CTA principal |
| `--album-primary-content` | `--color-primary-content` | Texto sobre primary |
| `--album-secondary` | `--color-secondary` | Acción/identidad secundaria |
| `--album-accent` | `--color-accent` | Acento lúdico controlado |
| `--album-success` | `--color-success` | Éxito/obtenida |
| `--album-warning` | `--color-warning` | Advertencias |
| `--album-danger` | `--color-error` | Error/destructivo |
| `--radius-control` | `--radius-field` | Inputs y botones |
| `--radius-card` | `--radius-box` | Cards/paneles |

DaisyUI también requiere colores `*-content` para asegurar contraste sobre cada color semántico. Deben definirse explícitamente para primary, secondary, accent, neutral, info, success, warning y error.

Los estados de dominio no deben mapearse ciegamente a clases de daisyUI:

- `--sticker-owned`: inicialmente puede apuntar a success.
- `--sticker-missing`: debe ser visible y no depender sólo de un gris tenue; puede conservar un aspecto neutral con borde/texto distinguible.
- `--sticker-duplicate`: inicialmente puede apuntar a primary o accent.

El estado debe seguir comunicándose también mediante texto, no sólo color.

### 5.4 Valores iniciales recomendados

Para evitar regresión visual, UI-02 debería conservar los valores actuales en los tokens equivalentes:

```css
/* Light: referencia conceptual */
--album-background: #f8fafc;
--album-surface: #ffffff;
--album-surface-soft: #f1f5f9;
--album-border: #e2e8f0;
--album-text: #0f172a;
--album-text-muted: #64748b;
--album-primary: #ea580c;
--album-primary-content: #ffffff;
--album-focus: #0891b2;
--album-success: #10b981;
--album-danger: #ef4444;

/* Dark: referencia conceptual */
--album-background: #0f172a;
--album-surface: #1e293b;
--album-surface-soft: #0b1120;
--album-border: #334155;
--album-text: #f8fafc;
--album-text-muted: #94a3b8;
--album-primary: #f97316;
--album-primary-content: #ffffff;
--album-focus: #06b6d4;
--album-success: #34d399;
--album-danger: #f87171;
```

`secondary`, `accent` y `warning` deben elegirse en UI-02 mediante una muestra pequeña de componentes y validación de contraste, no por sustitución automática.

---

## 6. Propuesta de integración con daisyUI 5

### 6.1 Compatibilidad confirmada

La configuración actual no admite una instalación directa y correcta de daisyUI 5:

- Actual: Tailwind CSS `3.4.19`.
- Requisito de daisyUI 5: Tailwind CSS 4.
- Actual: plugin PostCSS `tailwindcss` + `autoprefixer`.
- Tailwind 4 con Next.js: `@tailwindcss/postcss`.
- Actual: directivas `@tailwind` y configuración principal en `tailwind.config.ts`.
- Tailwind 4/daisyUI 5: configuración CSS-first con `@import "tailwindcss"` y `@plugin "daisyui"`.

Tailwind 4 además eleva el piso de navegador a Safari 16.4, Chrome 111 y Firefox 128. Este requisito debe aprobarse explícitamente antes de migrar.

DaisyUI `4.12.24` es la línea compatible con Tailwind 3, pero instalarla sería adoptar una versión mayor distinta de la solicitada y crear una migración posterior adicional. No se recomienda salvo que el soporte de navegadores impida Tailwind 4 y el equipo acepte expresamente ese compromiso.

### 6.2 Estrategia recomendada

#### UI-02A — Fundación técnica

1. Crear una rama `chore/ui-foundation-daisyui5` o equivalente; nunca trabajar en `main`.
2. Establecer y documentar el soporte mínimo de navegadores.
3. Migrar Tailwind 3.4 a 4 siguiendo la guía oficial y revisar manualmente el diff.
4. Reemplazar el plugin PostCSS por `@tailwindcss/postcss`.
5. Migrar `globals.css` al modelo CSS-first.
6. Instalar daisyUI 5 con versión fijada y revisar cambios de lockfile.
7. Habilitar sólo dos temas custom: `light` y `dark`; no incluir los temas predefinidos innecesarios.
8. Configurar ambos temas con la paleta actual, radios compactos, `--depth` bajo o nulo y `--noise: 0`.
9. Conservar `ThemeToggle`, `localStorage`, script anti-flash, clase `dark` y `data-theme`.
10. Mantener aliases temporales para que las clases existentes continúen funcionando.
11. No migrar aún todos los componentes a clases daisyUI.
12. Validar lint, tests, build y comparación visual de rutas clave.

#### UI-02B y siguientes — Adopción incremental

- Introducir primitives locales que encapsulen daisyUI y las reglas de App Álbum.
- Migrar primero componentes de bajo riesgo: Button, Input, Badge, Alert y Card.
- Migrar por flujo completo, no mediante reemplazos globales de texto.
- Retirar aliases antiguos sólo cuando no queden consumidores.

### 6.3 Por qué no usar clases daisyUI directamente en todas partes

DaisyUI entrega estilos de componentes, no sustituye las decisiones de producto. Un pequeño conjunto de wrappers/primitives locales permite:

- mantener tamaños compactos consistentes;
- centralizar accesibilidad y estados pending/disabled;
- limitar variantes admitidas;
- evitar que cada pantalla combine libremente clases daisyUI;
- cambiar detalles visuales sin editar decenas de rutas;
- preservar Server Components cuando no se necesita estado cliente.

No se recomienda crear abstracciones para cada elemento HTML ni componentes sin reutilización demostrada.

### 6.4 Riesgos técnicos específicos de Tailwind 4

- `rounded` cambia de nombre/escala conceptual en Tailwind 4; aunque la forma bare sigue disponible, debe compararse visualmente.
- La escala de sombras cambia. Hoy no hay sombras, lo que reduce este riesgo.
- El color por defecto de `border` pasa a `currentColor`; el repositorio casi siempre declara `border-border`, lo cual reduce el riesgo, pero debe auditarse tras la migración.
- Los plugins PostCSS y las directivas CSS cambian.
- Las variables y utilities personalizadas deben trasladarse correctamente desde `tailwind.config.ts`.
- DaisyUI aporta estilos base y de componentes que pueden cambiar alturas, bordes, radios y foco si se añaden clases sin control.
- Las clases daisyUI comunes (`btn`, `input`, `card`, etc.) pueden generar diferencias visuales relevantes aun conservando colores.

---

## 7. Propuesta de animaciones y carga progresiva

### 7.1 Decisión recomendada sobre Motion

**No incorporar Motion en esta etapa.** CSS y Tailwind cubren las necesidades descritas:

- fade-in simple;
- hover/focus;
- transiciones de color, borde, transform y opacidad;
- feedback breve al actualizar cantidad;
- stagger pequeño mediante variable/índice CSS;
- skeleton shimmer limitado;
- respeto a reduced motion.

Motion sólo se justificaría después si aparecen requisitos de salida/entrada coordinada, layout animations complejas, drag-and-drop o gestos. Ninguno está presente en el alcance actual.

### 7.2 Tokens y utilidades propuestas

- Duración rápida: 150 ms.
- Duración normal: 200 ms.
- Stagger: 20–30 ms por elemento.
- Acumulado máximo: aproximadamente 200 ms; limitar el índice animado o capar el delay.
- Transformaciones: 1–2 px o escala muy leve; no desplazar contenido de forma notoria.
- Nunca animar controles críticos antes de permitir interacción.

### 7.3 Aplicación futura

#### Fade-in de páginas/secciones

- Aplicar una animación única de opacidad + desplazamiento vertical mínimo.
- Preferir secciones cargadas progresivamente, no animar cada nodo.
- Duración 180–200 ms.
- No bloquear interacción ni ocultar contenido más allá del primer frame.

#### Hover y focus

- Usar `transition-colors` o propiedades específicas, no `transition-all`.
- Cards clicables: borde/superficie suave; evitar escalado que mueva la grilla.
- Botones: feedback de color y, opcionalmente, `translateY` de 1 px al activar.
- Mantener siempre el outline global de foco visible.

#### Marcar una lámina

- Cambio de estado inmediato o tras confirmación de la Server Action existente.
- Pulso único muy leve de borde/fondo o escala, 150–180 ms.
- No usar animación permanente ni confeti por cada cambio.
- Pending debe deshabilitar interacción duplicada y conservar contexto.

#### Stagger/cascada

- Sólo en primeras cards visibles o grupos pequeños.
- Delays de 20–25 ms, con máximo de 6–8 elementos animados.
- Para listados largos, animar el contenedor o el primer viewport, no cientos de láminas.

#### Skeleton loading

- Añadir `loading.tsx` en segmentos donde la consulta server-side pueda ser perceptible.
- Skeleton con geometría equivalente al contenido final para evitar layout shift.
- Shimmer muy sutil y detenido bajo reduced motion; también es válida una pulsación discreta.
- No mostrar skeleton para Server Actions breves cuando el texto pending sea suficiente.

#### Imágenes

- Evaluar `loading="lazy"` y `decoding="async"` para portadas fuera del primer viewport.
- Mantener aspect ratio 3:4 para evitar layout shift.
- Como las URLs son administrables y de hosts arbitrarios, conservar `<img>` puede seguir siendo más seguro que abrir una allowlist global de `next/image`.
- Priorizar sólo la portada principal visible si se demuestra necesario.

#### `prefers-reduced-motion`

Crear una política global equivalente a:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Antes de aplicar una regla global tan amplia, probar que no perjudique indicadores funcionales. Las utilidades nuevas también deben usar variantes `motion-safe`/`motion-reduce` cuando corresponda.

---

## 8. Componentes candidatos a estandarización

Orden sugerido según reutilización y riesgo:

| Prioridad | Primitive/patrón | Variantes mínimas sugeridas | Consumidores iniciales |
|---|---|---|---|
| 1 | `Button` | primary, secondary/neutral, danger, ghost/link, icon; sm/md | auth, navegación, admin, colección |
| 1 | `Field` / clases compartidas | input, select, textarea; invalid, disabled | login, registro, álbum, páginas, láminas, usuarios |
| 1 | `InlineMessage` / `Alert` | error, success, warning, info, pending | Server Actions de toda la app |
| 1 | `Badge` | neutral, success, warning/error | estado de álbum y usuario |
| 2 | `Card` / `Panel` | estándar, compacta, clicable | álbumes, sharing, details, empty states |
| 2 | `PageHeader` | título, descripción, acciones | app y admin |
| 2 | `AppShell` / `Nav` | pública, autenticada, admin | navegación y theme toggle |
| 2 | `EmptyState` | neutral, success, con CTA | biblioteca, catálogo y listas públicas |
| 2 | `Progress` | compacta/detallada | privada y pública |
| 3 | `AlbumCard` | propia/con progreso, explorable/con acción | `/app`, `/app/albums` |
| 3 | `DataTable` patterns | header, row, responsive wrapper, toolbar | álbumes, páginas, láminas, usuarios |
| 3 | `Disclosure` | panel/card, grupo de láminas | admin y colección |
| 3 | `Icon` set mínimo | edit, up/down, grid/list, copy, delete | reemplazo coherente de símbolos mixtos |
| 4 | `Skeleton` | card, header, table/list | loading states por ruta |

No se propone un componente modal hasta decidir si se reemplazan las confirmaciones nativas. Cambiar `window.confirm` afecta comportamiento y accesibilidad, por lo que merece una fase específica y pruebas propias.

---

## 9. Plan de implementación por etapas

### Etapa 0 — Aprobación

- Revisar este documento.
- Aprobar soporte mínimo de navegadores.
- Confirmar que el objetivo sigue siendo daisyUI 5, aceptando que implica Tailwind 4.
- Aprobar paleta provisional para secondary/accent/warning o decidir mantenerlos neutros hasta una etapa posterior.

### Etapa 1 — UI-02: cimientos técnicos

- Rama dedicada.
- Tailwind 4 + `@tailwindcss/postcss`.
- daisyUI 5 con sólo temas custom light/dark.
- Tokens `--album-*` y aliases de compatibilidad.
- Mantener selector actual y script anti-flash.
- Añadir pruebas de contrato de tema y un pequeño showcase interno o test fixture no productivo si se aprueba.
- Cero migración masiva de componentes.
- Validación visual de `/`, `/login`, `/app`, detalle de colección, admin de álbum y share público.

### Etapa 2 — Primitives y autenticación/shell

- Button, Field, Badge y Alert.
- Shell/navegación compacta integrando theme toggle sin cambiar rutas ni permisos.
- Migrar portada, login y registro como flujo de bajo riesgo.
- Añadir reduced-motion y transiciones base.

### Etapa 3 — Biblioteca y cards de álbum

- `AlbumCard`, `EmptyState`, `Progress` y header de página.
- Unificar `/app` y `/app/albums` sin mezclar su lógica de negocio.
- Revisar tamaño de portada, densidad y microinteracciones.

### Etapa 4 — Detalle personal y sharing

- Header compacto.
- Tokens owned/missing/duplicate.
- Feedback de cantidad.
- Grilla/lista y disclosures estandarizados.
- Compartir colección con mensajes accesibles.

### Etapa 5 — Administración

- Tablas, toolbars, badges, formularios y acciones masivas.
- Trabajar por pantalla y conservar la densidad de `StickerTable`.
- Refactor visual de `StickerTable` sólo con cobertura y sin cambiar reglas funcionales.

### Etapa 6 — Carga progresiva y pulido

- `loading.tsx` donde aporte valor medido.
- Skeletons sin layout shift.
- Lazy loading de portadas.
- Revisión de reduced motion, contraste, teclado y responsive.
- Retirar aliases y clases antiguas sólo cuando no existan consumidores.

---

## 10. Riesgos

| Riesgo | Impacto | Mitigación propuesta |
|---|---|---|
| Tailwind 4 es una actualización mayor | Cambios visuales/build inesperados | Rama separada, migración aislada, revisión de CSS compilado, build y QA visual |
| Requisito de navegadores modernos | Usuarios con navegador antiguo podrían perder estilos | Aprobar matriz de soporte antes de UI-02 |
| DaisyUI puede imponer tamaños/radios/foco | Pérdida de densidad o identidad | Temas custom, primitives locales y adopción incremental |
| Dos sistemas de tokens simultáneos | Confusión y drift | Una fuente por tema + aliases temporales documentados |
| Cambiar el selector de tema | Flash, hydration mismatch o pérdida de preferencia | Conservar implementación y tests actuales |
| Migración masiva de clases | Diff difícil de revisar y regresiones | Migrar por familia/flujo, nunca con reemplazo global ciego |
| Contraste de colores nuevos | Accesibilidad insuficiente | Validar WCAG antes de consolidar secondary/accent/warning y estados |
| Animar listas largas | Jank y retrasos percibidos | Animar contenedor/viewport, capar stagger a ~200 ms |
| Skeletons incorrectos | Layout shift y falsa percepción de lentitud | Geometría equivalente y sólo en cargas perceptibles |
| Native `<img>` sin lazy loading | Carga innecesaria en grillas | Añadir lazy/async selectivamente sin abrir hosts globales |
| `StickerTable` complejo | Regresiones de selección/edición | Mantener lógica, pruebas focalizadas y cambios pequeños |
| Tests centrados en contrato funcional | Regresiones visuales no detectadas | Checklist visual responsive/light/dark y, si se aprueba, snapshots visuales posteriores |

---

## 11. Archivos que probablemente se modificarían

Esta lista corresponde a fases futuras; **UI-01 no los modifica**.

### UI-02 — fundación técnica

- `package.json`
- `package-lock.json`
- `postcss.config.mjs`
- `tailwind.config.ts` (migración, reducción o retiro según solución final)
- `src/app/globals.css`
- `src/lib/theme.ts`
- `src/lib/theme.test.ts`
- `src/components/theme-toggle.tsx` (sólo si el mapeo lo exige; comportamiento debe preservarse)
- `src/app/layout.tsx` (sólo si se necesita una integración mínima del tema)

### Adopción posterior

- Nuevos primitives acotados bajo `src/components/ui/`, previa aprobación del bloque.
- `src/app/page.tsx`
- `src/app/login/login-form.tsx`
- `src/app/register/register-form.tsx`
- `src/app/app/collection-nav.tsx`
- `src/app/app/progress.tsx`
- `src/app/app/page.tsx`
- `src/app/app/albums/page.tsx`
- `src/app/app/albums/[userAlbumId]/page.tsx`
- `src/app/app/albums/[userAlbumId]/sticker-collection.tsx`
- `src/app/app/albums/[userAlbumId]/share-controls.tsx`
- `src/app/share/[token]/page.tsx`
- `src/app/admin/albums/page.tsx`
- `src/app/admin/albums/[id]/page.tsx`
- `src/app/admin/albums/sticker-table.tsx`
- `src/app/admin/users/page.tsx`
- Componentes auxiliares y pruebas colocadas junto a esos archivos.

No se prevén migraciones, cambios de esquema, cambios de servicios, rutas o autenticación para este plan visual.

---

## 12. Criterios de aceptación

### UI-01 — este entregable

- [x] Se inspeccionó la configuración real de Tailwind/PostCSS y el CSS global.
- [x] Se documentaron variables, colores, radios, sombras, espaciado y breakpoints.
- [x] Se auditó la implementación real de light/dark y su script anti-flash.
- [x] Se inventariaron las pantallas y componentes principales.
- [x] Se registraron duplicaciones, deuda de densidad/scroll y problemas relevantes.
- [x] Se propuso una arquitectura de tokens light/dark y su mapeo a daisyUI.
- [x] Se determinó que daisyUI 5 requiere migrar Tailwind 3→4.
- [x] Se propuso una estrategia de animación sin añadir Motion.
- [x] Se definieron etapas, riesgos, archivos probables y una propuesta concreta para UI-02.
- [x] No se modificó código productivo, dependencias, rutas, autenticación ni base de datos.

### UI-02 — aceptación propuesta

1. Tailwind 4 y daisyUI 5 compilan en Next.js sin warnings relevantes.
2. Sólo están habilitados los temas custom `light` y `dark`.
3. La paleta base luce equivalente a la actual en ambos temas.
4. El selector actual conserva texto, accesibilidad, persistencia y fallback al sistema.
5. No existe flash visible de tema incorrecto ni mismatch de hidratación.
6. Los componentes existentes continúan funcionando antes de su migración gracias a aliases controlados.
7. No se introducen variantes `dark:` en componentes para resolver colores.
8. No se introducen modificadores de opacidad sobre colores CSS-variable.
9. No cambian rutas, permisos, Server Actions, contratos ni datos.
10. Pasan `npm run lint`, `npm run test`, `npm run build` y `git diff --check`.
11. Se ejecuta QA visual manual en 375 px, 768 px y escritorio, light/dark, al menos sobre las rutas clave.
12. Se documentan diferencias visuales deliberadas y no se inicia la migración masiva sin nueva revisión.

---

## 13. Propuesta concreta para UI-02

**Nombre sugerido:** `UI-02 — Tailwind 4 + daisyUI 5 Theme Foundation`.

**Alcance cerrado sugerido:**

- migrar la infraestructura de estilos a Tailwind 4;
- instalar daisyUI 5;
- crear únicamente los temas custom `light` y `dark`;
- introducir tokens `--album-*` y aliases de compatibilidad;
- preservar `ThemeToggle` y el comportamiento anti-flash;
- añadir reduced-motion base sólo si se valida que no altera indicadores funcionales;
- no convertir todavía las pantallas a `btn`, `card`, `input`, etc.;
- no rediseñar navegación, cards, tablas o formularios;
- entregar una matriz de QA visual y resultados de lint/test/build.

**Decisión requerida antes de iniciar:** confirmar que la matriz de navegadores admite Tailwind 4 (Safari 16.4+, Chrome 111+, Firefox 128+) y aprobar que UI-02 incluya esa actualización mayor como requisito técnico explícito de daisyUI 5.

---

## 14. Fuentes técnicas consultadas

- Código y configuración local del repositorio, auditados directamente.
- Documentación oficial de daisyUI 5: release notes, temas e instalación con Next.js.
- Guía oficial de migración Tailwind CSS 3→4.
- Registro npm consultado durante la auditoría: daisyUI 5 es la línea actual; `4.12.24` es la última versión de la línea 4 y Tailwind `3.4.19` es la línea v3 LTS.

Las fuentes externas se usaron sólo para confirmar compatibilidad y requisitos; las observaciones de arquitectura visual provienen del código real del repositorio.
