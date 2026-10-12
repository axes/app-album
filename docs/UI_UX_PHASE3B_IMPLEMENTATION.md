# UI-03B — Implementación

## Estado

UI-03B Bloques 1 y 2 implementados. La revisión visual manual permanece pendiente antes de cerrar la fase.

## Alcance completado

UI-03B establece un shell visual común, compacto y responsive para rutas públicas, autenticadas y administrativas, sin modificar autenticación, permisos, rutas, Server Actions, base de datos ni comportamiento funcional del dominio.

### Contraste y movimiento

- Primary light se ajustó a `#C2410C`, con contraste AA para texto blanco normal.
- Danger light se ajustó a `#B91C1C`, con contraste AA para texto blanco normal.
- Primary dark conserva el naranja existente y usa foreground oscuro para mantener contraste AA.
- Secondary, accent y warning se mantienen sin cambios.
- La utilidad `animate-enter` combina opacidad y desplazamiento vertical de 5 px durante 200 ms.
- El movimiento decorativo se elimina bajo `prefers-reduced-motion: reduce`.

### Primitives

- `Button` admite composición `asChild` para aplicar estilos a enlaces sin generar HTML inválido.
- `AppShell` unifica marca, navegación, selector de tema y composición principal.
- `AppShell` es presentacional: no consulta sesión, base de datos ni servicios.
- `PageHeader` admite título, descripción, metadata y acciones opcionales.
- `EmptyState` admite título, descripción, acción e icono opcionales.

### Integración pública

- El root layout conserva el script anti-flash, `suppressHydrationWarning`, los estilos globales y el body semántico, sin imponer otro shell o `<main>`.
- `/` usa el shell público y una portada corta con CTA “Crear cuenta” e “Iniciar sesión”.
- `/login` y `/register` usan el shell público sin modificar sus formularios ni Server Actions.
- `/share/[token]` usa el shell público sin rediseñar progreso, grupos, grillas, faltantes ni repetidas.

### Integración autenticada

- `src/app/app/layout.tsx` resuelve el usuario con `getCurrentUser()` y redirige a `/login` cuando no existe sesión.
- El layout autenticado entrega el usuario a `AppShell`; no consulta álbumes ni mueve lógica de negocio desde las páginas.
- `AppShell` muestra “Mis álbumes”, “Explorar álbumes”, nombre de usuario, `ThemeToggle` y logout.
- Logout conserva el formulario server-side `<form action={logoutAction}>`.
- Los accesos “Administrar álbumes” y “Administrar usuarios” aparecen sólo para usuarios con rol `admin`.

### Integración administrativa

- `src/app/admin/layout.tsx` conserva su autorización server-side con `getCurrentUser()`, `isActiveAdmin()` y redirect a `/app` para cualquier usuario que no sea admin activo.
- Después de autorizar, el layout entrega el usuario administrador al mismo `AppShell`.
- La autorización no depende de ocultar enlaces ni de lógica cliente.

### Retiro de wrappers y navegación duplicada

- Los wrappers transitorios de `/app/**` y `/admin/**` fueron reemplazados por sus layouts definitivos con `AppShell`.
- Ya no existen filas independientes de `ThemeToggle`, contenedores `<main>` duplicados ni doble padding en esos layouts.
- `CollectionNav` y su prueba fueron retirados porque toda su navegación global, rol y logout quedaron cubiertos por `AppShell`.
- Se retiraron enlaces globales redundantes en los listados administrativos.
- En el editor de álbum se conserva “← Álbumes” como navegación contextual legítima y se retiró el enlace global redundante a usuarios.
- La página de creación conserva “← Álbumes” por el mismo motivo contextual.

### PageHeader y EmptyState

Adopciones directas y acotadas:

- `/app`: `PageHeader` para el título simple y `EmptyState` para colección vacía.
- `/app/albums`: `PageHeader` y `EmptyState` para catálogo publicado vacío.
- `/admin/albums`: `PageHeader` con la acción existente “Crear álbum”.
- `/admin/users`: `PageHeader` para el encabezado simple.

No se migraron headers complejos del detalle de colección ni del editor de álbumes.

## Límites preservados

No se rediseñaron:

- cards de álbumes;
- `ProgressSummary`;
- `StickerCollection`;
- sharing interno;
- tablas de administración;
- `StickerTable`;
- editor de álbumes;
- formularios administrativos.

No se modificaron:

- esquema, migraciones, Drizzle ni acceso a base de datos;
- servicios o repositorios;
- autenticación, permisos, roles o Server Actions;
- rutas ni contratos funcionales;
- comportamiento de `ThemeToggle`, localStorage, dark mode, script anti-flash o accesibilidad;
- `drizzle.config.ts`.

## Pruebas

La cobertura de UI-03B incluye:

- navegación pública y autenticada de `AppShell`;
- accesos administrativos según rol;
- usuario, `ThemeToggle` y logout server-side;
- redirect de `/app` sin sesión;
- render de `/app` dentro del shell autenticado;
- rechazo de usuario normal y administrador inactivo en `/admin`;
- render de admin activo dentro del shell compartido;
- comportamiento funcional existente de colección y sharing público.

El gate final exige:

```bash
npm run lint
npm run test
npm run build
git diff --check
git status --short
```

## QA visual manual pendiente

Revisar en light y dark, con anchos de 375 px, 768 px y escritorio:

- `/`;
- `/login`;
- `/register`;
- `/app`;
- `/app/albums`;
- `/admin/albums`;
- `/admin/users`.

Confirmar especialmente navegación compacta, wrapping del header, ausencia de doble shell/padding/toggle, foco visible y densidad vertical.

## Riesgos y recomendaciones para UI-04

- En móvil, la cantidad de enlaces para administradores puede requerir una navegación colapsable; debe validarse visualmente antes de introducir ese patrón.
- El shell común ya está estabilizado. UI-04 puede concentrarse en contenido interno sin volver a distribuir autenticación o navegación global.
- Priorizar en UI-04 cards, tablas y pantallas de detalle de forma incremental, preservando la navegación contextual.
- No añadir una dependencia de animación mientras las transiciones CSS cubran la necesidad.
