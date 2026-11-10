# Gestores de álbum — propuesta aparcada

> **Estado: APLAZADO — fuera del MVP.**
>
> Este documento conserva la investigación de **solo lectura** entregada el
> 2026-10-16. **No implementar** sin una nueva aprobación explícita del usuario.
>
> No contiene código ni esquema aplicado: sólo la propuesta tal como se
> investigó. No se creó la rama `feat/album-managers`, ni migraciones, ni
> código.

## Por qué está aparcado

El 2026-10-17 el usuario canceló la funcionalidad de gestores de álbum por
cambio de alcance MVP:

- no se crea la rama `feat/album-managers`;
- no se crean migraciones;
- no se escribe código.

El commit 4 (`/admin/users`) sigue pendiente de aprobación, pero **sin** la
parte de gestores.

## Impacto en el commit 4 (`/admin/users`)

Decisión MVP: el commit 4 se implementará **sin** botón "Permisos" ni diálogo de
roles. Alcance aprobado:

- **Badges** con vocabulario aprobado: Administrador, Usuario, Activo, Bloqueado.
- **Acciones por fila compactas**: Degradar/Promover como `Button` secondary
  pequeño con ícono; Bloquear como `dangerGhost` con `ConfirmAction`.
- **Columna Contacto** con encabezado claro.
- **Búsqueda local**.

Todo lo demás de este documento queda fuera del MVP.

## Estado del código al momento de la investigación

- Rama: `feat/ui-design-v2`.
- Referencia: `ae19be6` (los hechos descritos se verificaron de nuevo contra el
  árbol actual y siguen vigentes).

---

## a) Rutas y Server Actions de `/admin` y de álbumes

### Rutas

| Ruta | Archivo | ¿Comprueba admin en el propio archivo? | Depende de |
|---|---|---|---|
| `/admin/*` | `src/app/admin/layout.tsx` | **SÍ** — `isActiveAdmin` + `redirect("/app")` | — |
| `/admin/albums` | `src/app/admin/albums/page.tsx` | **NO** | layout |
| `/admin/albums/new` | `src/app/admin/albums/new/page.tsx` | **NO** | layout |
| `/admin/albums/[id]` | `src/app/admin/albums/[id]/page.tsx` | **NO** | layout |
| `/admin/users` | `src/app/admin/users/page.tsx` | **NO** | layout |
| `/admin/error.tsx`, `/admin/loading.tsx` | — | N/A | — |

No hay `route.ts` bajo `/admin`. `/api/health` es público y no expone datos.

### Server Actions

| Archivo | Acciones | ¿Comprueba admin en la acción? |
|---|---|---|
| `src/app/admin/albums/actions.ts` | 17 (`createAlbumAction`, `updateAlbumAction`, `changeAlbumStatusAction`, `deleteAlbumAction`, `createSectionAction`, `renameSectionAction`, `moveSectionAction`, `deleteSectionAction`, `createStickerAction`, `updateStickerAction`, `moveStickerAction`, `deleteStickerAction`, `createStickerRangeAction`, `createStickerListAction`, `createSectionRangeAction`, `bulkAssignStickerSectionAction`, `bulkDeleteStickersAction`) | **SÍ** — todas pasan por `context()` → `getCurrentUser()` + `isActiveAdmin`; si falla devuelven `unauthorized` |
| `src/app/admin/users/actions.ts` | 2 (`changeRoleAction`, `changeStatusAction`) | **SÍ** — `actorId()` → `getCurrentUser()` + `isActiveAdmin` |
| `src/app/app/albums/actions.ts` | 5 (`addAlbumAction`, `adjustQuantityAction`, `removeAlbumAction`, `enableSharingAction`, `disableSharingAction`) | No aplica: exige usuario autenticado y la propiedad se valida en el servicio |
| `login` / `register` / `logout` | 3 | Públicas por diseño |

### Defensa en profundidad

`DrizzleCatalogRepository` llama `assertAdmin(tx, actorId)` **dentro de la
transacción** en cada mutación. Es una segunda barrera real.

### Hallazgo: las lecturas dependen sólo del layout

**Las lecturas NO tienen segunda barrera.** `listAlbums()` y `getAlbum(id)` no
comprueban admin.

Marcadas como dependientes sólo del layout:

- `/admin/albums` → `listAlbums()`
- `/admin/albums/[id]` → `getAlbum(id)` (devuelve el detalle completo, incluidos
  borradores)
- `/admin/users` → `listUsers()`

Riesgo concreto: si mañana se añade un `route.ts` bajo `/admin`, o una página
fuera del layout, o se reutiliza `getAlbum` desde otro contexto, los datos se
exponen sin ninguna barrera. Con gestores por álbum esto deja de ser aceptable:
cada lectura tendría que resolver acceso por recurso.

---

## b) Propuesta de modelo de datos

### Por qué NO en `users.role`

`users.role` es un enum global con `CHECK role in ('user','admin')`. Un gestor es
**por álbum**: meterlo en `role` no expresa *cuál* álbum, obligaría a migrar el
`CHECK`, rompería la semántica binaria de `isActiveAdmin` y contaminaría la regla
del último administrador activo.

### Tabla propuesta

```text
album_managers
  id          uuid        PK default random
  album_id    uuid        NOT NULL  FK albums(id) ON DELETE CASCADE
  user_id     uuid        NOT NULL  FK users(id)  ON DELETE CASCADE
  created_by  uuid        NOT NULL  FK users(id)  ON DELETE RESTRICT
  created_at  timestamptz NOT NULL  default now()

  UNIQUE (album_id, user_id)
  INDEX  (user_id)          -- "álbumes que gestiono"
  INDEX  (album_id)         -- "gestores de este álbum"
```

Decisiones:

- `ON DELETE CASCADE` en `album_id`: si el álbum desaparece, sus asignaciones no
  tienen sentido.
- `ON DELETE CASCADE` en `user_id`: si el usuario desaparece, la asignación
  también. Hoy los usuarios no se borran (se bloquean), así que en la práctica no
  se dispara.
- `created_by` con `RESTRICT`: preserva la trazabilidad de quién asignó.
- `UNIQUE (album_id, user_id)` evita duplicados; la inserción usa
  `insertOrIgnore` para ser idempotente.

### Migración 0005 reversible

- **Up:** `CREATE TABLE album_managers` + `UNIQUE` + índices.
- **Down:** `DROP TABLE album_managers`.

Drizzle la genera; se aplica explícitamente con
`npx neon-env run -- npm run db:migrate` antes del deploy. Vercel nunca corre
migraciones.

### Auditoría

**Opción A (recomendada): tabla propia `album_manager_events`.**

```text
album_manager_events
  id             uuid PK
  actor_user_id  uuid NOT NULL FK users(id) RESTRICT
  actor_label    varchar(64) NOT NULL
  album_id       uuid NOT NULL
  album_title    varchar(160) NOT NULL
  target_user_id uuid NOT NULL FK users(id) RESTRICT
  target_label   varchar(64) NOT NULL
  action         varchar(32) NOT NULL  CHECK in ('assign_manager','revoke_manager')
  performed_at   timestamptz NOT NULL default now()
```

Ventajas: no se toca ningún `CHECK` existente, no se añaden columnas nulables a
tablas ya pobladas, y la semántica queda separada (asignar gestor es otro
agregado). Espeja el patrón de `user_admin_events` y `album_admin_events`.

**Opción B: ampliar `album_admin_events`.** Habría que `ALTER` el
`CHECK album_admin_events_action_check` para añadir `assign_manager` y
`revoke_manager`, y añadir una columna `target_user_id` nulable. Más invasivo
sobre una tabla existente y con columnas opcionales.

**Recomendación: A.**

### Qué habría que cambiar

`src/lib/db/schema.ts` (dos tablas + tipos), migración `0005`,
`drizzle-repository` (insertar eventos), servicio nuevo de gestores, Server
Actions nuevas, UI.

---

## c) Matriz de permisos

| Capacidad | Admin general | Gestor de X | Gestor de Y | Usuario normal | Bloqueado |
|---|---|---|---|---|---|
| Ver `/admin/albums` | sí (todos) | sólo los suyos | sólo los suyos | no | no |
| Ver `/admin/albums/X` | sí | sí | no | no | no |
| Editar info de X | sí | sí | no | no | no |
| Páginas de X (crear/editar/mover/borrar) | sí | sí | no | no | no |
| Láminas de X (crear/editar/mover/borrar) | sí | sí | no | no | no |
| Publicar / volver a borrador X | sí | **NO** | no | no | no |
| Eliminar X | sí | **NO** | no | no | no |
| Asignar/quitar gestores de X | sí | **NO** | no | no | no |
| Crear álbum nuevo | sí | **NO** | no | no | no |
| `/admin/users` | sí | **NO** | no | no | no |
| Cambiar rol global | sí | no | no | no | no |
| Bloquear usuarios | sí | no | no | no | no |
| Colección personal | sí | sí | sí | sí | no |

### Ajustes propuestos sobre el criterio inicial

1. **"NO ver otros álbumes"**: implementarlo como **lista filtrada**, no como
   403. El ítem de navegación "Administrar álbumes" tiene que llevar a algo; una
   lista con sólo sus álbumes es mejor UX que un error. Si tiene exactamente uno,
   se puede redirigir directo a ese detalle.
2. **"Crear álbum nuevo"**: dejarlo en **NO** por defecto. Crear un álbum implica
   ser dueño de un recurso nuevo; si se quisiera, debería auto-asignar al creador
   como gestor.
3. Añadir explícitamente: el gestor **no** ve `/admin/albums/new`.
4. Añadir: el gestor **sí** ve el conteo de colecciones del álbum (agregado, sin
   datos personales).
5. Las acciones masivas actuales son todas *album-scoped*, así que no hay riesgo
   de que un gestor cruce álbumes con ellas. Conviene dejarlo escrito como
   invariante.

---

## d) Punto único de decisión

Dos funciones, un solo módulo:

```ts
requireAdmin(user)                        // admin + active, o error
canManageAlbum(user, albumId): Promise<boolean>   // admin, o gestor activo del álbum
requireAlbumManager(user, albumId)        // lanza CatalogError("forbidden")
```

Regla: **la UI sólo oculta; el servidor siempre decide.** Cada lectura y cada
escritura resuelve el acceso en servidor, en el mismo punto, sin comprobaciones
ad-hoc repartidas.

Diseño recomendado: resolver el contexto de acceso **una vez por request** y
pasarlo explícitamente al servicio, en lugar de que cada método consulte por su
cuenta.

### Archivos a tocar

```text
src/lib/admin/authorization.ts            añadir requireAdmin; conservar isActiveAdmin
src/lib/catalog/authorization.ts          añadir canManageAlbum / requireAlbumManager
src/lib/catalog/service.ts                aceptar contexto de acceso; exigirlo en cada método
src/lib/catalog/drizzle-repository.ts     assertAdmin → assertAlbumAccess; lookup de gestor;
                                          filtrar listAlbums por gestor
src/app/admin/albums/actions.ts           context() resuelve acceso y pasa albumId
src/app/admin/albums/page.tsx             guarda en servidor + datos filtrados
src/app/admin/albums/[id]/page.tsx        guarda por recurso
src/app/admin/albums/new/page.tsx         guarda requireAdmin
src/app/admin/users/actions.ts            requireAdmin
src/app/admin/layout.tsx                  admitir admin O gestor
src/components/admin/admin-nav.tsx        filtrar ítems
src/components/ui/app-shell.tsx           renderizar nav admin también para gestores
NUEVO src/lib/admin/album-managers.ts     servicio de asignación/revocación
NUEVO src/app/admin/albums/[id]/managers-actions.ts
```

---

## e) Protecciones

- **No degradarse a sí mismo**: hoy no existe guard explícito; sólo la regla del
  último admin. Añadir un guard explícito "el actor no puede cambiar su propio
  rol" para que el mensaje sea claro.
- **No dejar el sistema sin administradores**: se reutiliza
  `assertAdminMutationAllowed` + `pg_advisory_xact_lock(741903)`. No se toca.
- **Asignación de gestor**: no se puede asignar a un usuario bloqueado ni
  inexistente; `UNIQUE (album_id, user_id)` + `insertOrIgnore` para idempotencia;
  revocar no borra el álbum.
- **Auditoría**: una fila por asignación y una por revocación, con actor, target,
  álbum y fecha. Nunca contraseñas ni tokens.
- **Revocación inmediata**: sin caché de la lista de gestores entre requests; el
  chequeo lee la BD (o una caché con alcance de request).
- **Bloqueo inmediato**: un gestor bloqueado pierde acceso en el mismo punto de
  decisión, porque `status` se comprueba ahí.

---

## f) Flujos de UI (sin implementar)

| Pieza | Componentes existentes | Faltantes |
|---|---|---|
| Botón "Permisos" por fila en `/admin/users` | `Button` (secondary, sm) + `Icon` | — |
| Diálogo de permisos: rol general | `SegmentedControl` modo `radio` | — |
| Diálogo de permisos: lista de álbumes con selección | `DataTable` + `SelectionCheckbox` + `AdminSelectionBar` | — |
| Selector de álbum con búsqueda | `Field` + filtro local (patrón `AdminAlbumList`) | **combobox accesible con búsqueda** |
| Botón "Asignar gestor" en detalle de álbum | `Button` primary + `Icon` | **selector de usuario con búsqueda** |
| Sección "Gestores" en detalle de álbum | `CollapsibleSurfaceCard` + `DataTable` + `Badge` | — |
| Quitar gestor | `Button` dangerGhost + `ConfirmAction` | — |
| Menú del gestor filtrado | `AdminNav` + `NavLink` | — |
| Estados vacíos / errores | `EmptyState`, `InlineMessage`, `ErrorState` | — |
| Cabeceras | `PageHeader` | — |

**Faltan tres piezas reales:**

1. Un **combobox/selector accesible con búsqueda** (para usuario y para álbum).
   No existe hoy.
2. Un **primitivo de diálogo general**. `ConfirmAction` es un diálogo de
   confirmación, no un modal reutilizable con contenido arbitrario.
3. Una **lista multi-selección con búsqueda** para el diálogo de permisos.

---

## g) Riesgos, orden de commits y plan de pruebas

### Riesgos

- Ampliar el `CHECK` de `users.role` o añadir un valor `manager` rompería
  `isActiveAdmin` y la regla del último admin. **Evitar.**
- Filtrar `listAlbums` por gestor cambia la semántica de la lista admin; hay que
  preservar la vista completa para administradores.
- Permitir gestores en el layout **amplía la superficie**: a partir de ahí, cada
  página bajo `/admin` debe re-chequear por recurso. Es el punto más delicado.
- La migración se aplica a mano antes del deploy; Vercel nunca la corre.
- Postgres local es efímero (Docker sobre tmpfs): las integraciones se omiten sin
  BD.
- No hay QA visual posible en este entorno.

### Orden de commits

1. **Esquema y migración**: `album_managers` + `album_manager_events` + tipos +
   migración `0005`.
2. **Autorización y servicios**: `requireAdmin`, `canManageAlbum`,
   `AlbumManagerService` + unit tests.
3. **Repositorio**: enforcement en lecturas y escrituras + tests de integración.
4. **Acciones**: asignar/revocar gestor; cambio de rol a gestor + tests.
5. **UI**: diálogo Permisos, Asignar gestor, sección Gestores, nav filtrado +
   tests de componentes.
6. **Documentación**.

### Plan de pruebas

- **Unit**: matriz de `canManageAlbum` (admin / gestor del álbum / gestor de otro
  / normal / bloqueado), `requireAdmin`, regla del último admin,
  auto-degradación.
- **Integración con BD**: el gestor edita X; **no** publica X; **no** elimina X;
  **no** lee Y; **no** entra a `/admin/users`; `listAlbums` filtrado.
- **Server Actions**: un gestor que invoca publicar recibe `forbidden`; un gestor
  que invoca una acción de otro álbum recibe `forbidden`; un usuario normal recibe
  `forbidden`.
- **Componentes**: nav filtrado, accesibilidad del diálogo, `ConfirmAction` en
  revocar.
- **Explícito**: demostrar la **denegación en servidor**, no sólo que la UI oculte
  el botón.

---

## h) Decisiones pendientes (15), con valor por defecto

| # | Decisión | Valor por defecto |
|---|---|---|
| 1 | ¿El gestor puede crear álbumes nuevos? | **NO** |
| 2 | ¿El gestor ve la lista completa o sólo la suya? | **Sólo la suya** (lista filtrada, no 403) |
| 3 | ¿El gestor puede publicar / volver a borrador? | **NO** |
| 4 | ¿El gestor puede eliminar el álbum? | **NO** |
| 5 | ¿El gestor puede asignar otros gestores? | **NO** |
| 6 | ¿Un admin general puede ser gestor de un álbum? | **Sí** (redundante pero inofensivo) |
| 7 | ¿Un gestor bloqueado conserva su fila en `album_managers`? | **Sí**; el acceso se niega por `status` y al desbloquear recupera |
| 8 | ¿Auditoría en tabla nueva o ampliando el `CHECK`? | **Tabla nueva** `album_manager_events` |
| 9 | ¿`users.role` sigue siendo `user \| admin`? | **Sí**, sin cambios |
| 10 | Al degradar un gestor a usuario normal, ¿se borran sus asignaciones? | **No**, se conservan |
| 11 | Nombre visible del rol | **"Gestor de álbum"** |
| 12 | ¿El gestor ve el conteo de colecciones del álbum? | **Sí**, agregado sin datos personales |
| 13 | ¿El gestor ve la lista de gestores de su álbum? | **Sí**, sólo lectura |
| 14 | ¿Límite de gestores por álbum? | **Sin límite** |
| 15 | ¿Se notifica al usuario al ser asignado? | **No** (fuera de alcance) |

---

## Cierre

Propuesta **aplazada y fuera del MVP**. No implementar sin una nueva aprobación
explícita del usuario. Este documento no autoriza rama, migración ni código.
