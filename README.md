# App Album

Aplicación Next.js (App Router) con autenticación, cuentas con email/contacto,
roles y estado, sesión sellada, administración de usuarios y catálogo maestro
de álbumes, páginas y láminas.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + ESLint
- PostgreSQL con `postgres` + Drizzle ORM
- Validación con Zod
- Hashing con Argon2id (`@node-rs/argon2`)
- Sesión con `iron-session`
- Tests con Vitest

## Requisitos

- Node.js 20+ (`engines.node` en `package.json`)
- PostgreSQL 14+ (para migraciones y ejecución real)

## Variables de entorno

Se validan en `src/lib/env.ts`, que es *server-only*. Ambas son obligatorias:

- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `AUTH_SECRET`: secreto de al menos 32 caracteres para sellar la cookie.

Genera el secreto con:

```bash
openssl rand -base64 48
```

Copia el ejemplo y completa los valores (`.env.example` mantiene los valores
vacíos a propósito):

```bash
cp .env.example .env
```

### Build y runtime

- `npm run build` (y `next build`) importa `src/lib/env.ts` durante el
  type-check y la recolección de rutas, por lo que **`DATABASE_URL` y
  `AUTH_SECRET` deben estar presentes en el entorno de build**, no sólo en
  runtime. En Vercel, defínelas en *Project → Settings → Environment
  Variables* para los entornos *Production*, *Preview* y *Development*.
- En runtime, el servidor necesita las mismas dos variables. No se conecta a
  la base de datos durante el build: la conexión es perezosa (`src/lib/db/client.ts`).

### Neon (PostgreSQL gestionado)

1. Crea un proyecto y una base de datos en Neon.
2. Copia la cadena de conexión *pooled* y úsala como `DATABASE_URL`
   (`postgres://user:password@host/db?sslmode=require`).
3. Aplica la migración explícitamente (ver abajo) antes de desplegar.

### Vercel

- Framework detectado: Next.js. No requiere configuración especial.
- Define `DATABASE_URL` y `AUTH_SECRET` en las variables de entorno.
- **La migración no se ejecuta en el build.** Aplícala de forma explícita
  (localmente o en un paso de CI) contra la base de datos de destino.

## Migración

La migración inicial vive en `drizzle/0000_init_users.sql`. La migración
`drizzle/0001_crazy_shiver_man.sql` amplía `users` y crea la trazabilidad
`user_admin_events`. La migración `drizzle/0002_bored_slapstick.sql` agrega el
catálogo administrativo (`albums`, `album_sections`, `stickers` y
`album_admin_events`) sin modificar ni recrear las tablas existentes. Para conservar usuarios existentes, asigna a cada cuenta
legacy un email reservado y único `legacy+<uuid>@invalid.example` con tipo
`other`; luego el email queda obligatorio y único. Esas direcciones no son
reales ni se usan para enviar correo.

```bash
npm run db:generate   # regenera migraciones desde el schema (no-op si está sincronizado)
npm run db:migrate    # aplica las migraciones pendientes
```

`db:migrate` es un paso **explícito y separado del build**; nunca se ejecuta
automáticamente al desplegar.

## Ejecución

```bash
npm run dev
```

Rutas disponibles:

- `/` — portada con enlaces.
- `/register` — alta con username, email, tipo de contacto y contraseña.
- `/login` — inicio de sesión con mensaje de error genérico; cuentas bloqueadas
  no pueden iniciar ni mantener acceso.
- `/app` — área protegida; redirige a `/login` sin sesión. El botón de cierre
  de sesión usa la Server Action `logoutAction`.
- `POST /logout` — endpoint documentado para clientes que no pueden enviar una
  Server Action; destruye la sesión y redirige a `/login`.
- `/admin/users` — listado y gestión de rol/estado, sólo para admins activos.
- `/admin/albums` — catálogo maestro administrativo y conteos derivados.
- `/admin/albums/new` — creación de álbum en estado `draft`.
- `/admin/albums/[id]` — editor del álbum en tres bloques: Álbum, Páginas y
  Láminas.

## Catálogo maestro

Los slugs se generan desde el título y resuelven colisiones con sufijos
numéricos. Las posiciones de páginas y láminas son únicas por álbum y se
administran con acciones subir/bajar. Los códigos de lámina son texto y son
únicos sólo dentro de cada álbum. Una FK compuesta impide asociar una lámina a
una página de otro álbum.

En la interfaz, las páginas se llaman **Página / Páginas**. Internamente siguen
viviendo en la tabla `album_sections` y en el tipo `AlbumSection`; el renombre es
sólo de producto y no requiere migración.

Publicar exige al menos una página y una lámina. Sólo se puede eliminar un
álbum `draft` vacío. Eliminar una página **nunca** elimina sus láminas: se
desasocian a `section_id = null` ("Sin página asignada") y las posiciones de las
páginas restantes se compactan, todo dentro de una transacción. Las operaciones
crear, publicar, volver a draft y eliminar álbum quedan registradas en
`album_admin_events`. No existe todavía catálogo público ni colecciones de
usuarios.

### Tema claro/oscuro

El tema se resuelve con variables CSS semánticas (`background`, `surface`,
`text`, `muted`, `border`, `input`, `primary`, `danger`, `success`) expuestas a
Tailwind en `tailwind.config.ts` con `darkMode: "class"`. La preferencia se
guarda en `localStorage` bajo `app-album-theme`; en la primera visita se usa
`prefers-color-scheme`. Un script inline en `<head>` aplica la clase antes del
primer render para evitar el flash de tema incorrecto.

### Creación masiva

El editor de álbum permite crear láminas por rango numérico (`1..10`, `A1..A10`)
o por lista de códigos (uno por línea), y páginas por rango (`Página 1..20`).
Los límites por operación son 300 láminas y 100 páginas. La validación ocurre
antes de persistir y la inserción es transaccional, por lo que un conflicto de
código no deja lotes parciales.

## Bootstrap del primer administrador

Después de aplicar migraciones, promueve de forma explícita una cuenta ya
existente usando su username o email normalizado:

```bash
npm run admin:bootstrap -- <username-o-email>
```

El comando requiere `DATABASE_URL`, activa la cuenta, registra los cambios en
`user_admin_events` como `bootstrap-cli` y no crea usuarios ni acepta
credenciales. Las mutaciones desde `/admin/users` también se auditan. Una
transacción con advisory lock serializa estas operaciones e impide degradar o
bloquear al último administrador activo.

## Runtime

Todas las rutas que tocan la base de datos, el hashing o la sesión declaran
`export const runtime = "nodejs"`. **No se usa Edge runtime**: `@node-rs/argon2`
es un módulo nativo y `iron-session` requiere APIs de Node.

## Verificaciones

```bash
npm run lint
npm run test
npm run build
```

Los tests cubren reglas de credenciales, hashing Argon2id (incluido el hash
dummy de tiempo constante), el servicio de autenticación con un repositorio en
memoria y las opciones de sesión (sin base de datos).

## Arquitectura de autenticación

- `src/lib/auth/repository.ts` define la interfaz `UserRepository`.
- `src/lib/auth/drizzle-repository.ts` la implementa con Drizzle.
- `src/lib/auth/service.ts` contiene la lógica de registro/login y depende sólo
  de la interfaz, por lo que es testeable sin base de datos.
- `src/lib/auth/session.ts` gestiona la cookie sellada (HttpOnly, SameSite lax,
  Secure en producción, expiración de 7 días) y guarda únicamente el `userId`.
- `src/lib/auth/current-user.ts` resuelve la identidad server-side desde
  PostgreSQL en cada petición; si el usuario ya no existe, devuelve `null` y
  `/app` redirige a `/login`. Nunca muta cookies durante el render: la cookie
  huérfana se trata como no autenticada y expira sola (o la elimina el logout).
- `src/lib/auth/resolve-current-user.ts` contiene la decisión pura y testeable
  (sin `next/headers`, `server-only` ni base de datos) que usa `current-user.ts`.

El registro maneja de forma segura la carrera de duplicados: si dos peticiones
crean el mismo usuario a la vez, la restricción única de la base de datos gana y
se traduce en un error de usuario no disponible. El login devuelve siempre el
mismo mensaje genérico para no filtrar si el usuario existe.

### Sesiones selladas y revocación

La cookie es un payload **sellado** (cifrado y autenticado) con `AUTH_SECRET`;
el cliente no puede leer ni modificar su contenido. La identidad se revalida
contra la base de datos en cada petición, de modo que un usuario eliminado deja
de tener acceso de inmediato.

No existe un registro central de sesiones individuales. Sin embargo, la cuenta
se revalida en PostgreSQL en cada petición: bloquearla invalida inmediatamente
su autorización aunque conserve una cookie sellada. Cambiar `AUTH_SECRET`
invalida todas las sesiones a la vez.

## Alcance

Este hito no incluye funcionalidades fuera de M0 (sin álbumes, sin subida de
archivos, sin tablas adicionales).
