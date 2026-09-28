# Production Workflow — App Album

Reglas operativas para trabajar con **producción real** y una **marcha blanca
controlada**.

> Regla base: `main` es producción. Todo lo demás se desarrolla en ramas y se
> valida en Preview antes de mergear.

---

## 1. Estado de producción

### Aplicación

| Ítem | Valor |
| --- | --- |
| Hosting | Vercel |
| URL productiva | `https://app-album-blond.vercel.app` |
| Production branch | `main` |
| Deploy | automático en cada push/merge a `main` |
| Previews | ramas distintas de `main` |

### Base de datos

| Ítem | Valor |
| --- | --- |
| Motor | PostgreSQL gestionado en Neon |
| Branch productiva | `production` |
| Migraciones | Drizzle (`drizzle/`) |
| Schema changes manuales | prohibidos salvo emergencia documentada |

### Health

```bash
curl -s https://app-album-blond.vercel.app/api/health
```

- Esperado: `{"status":"ok"}` con HTTP `200`.
- HTTP `503` (`{"status":"unavailable"}`) significa que la base de datos no
  responde. No expone host, base, versiones ni secretos.

---

## 2. Regla principal de Git

**No se desarrolla directamente en `main`.**

```text
main
  └─ producción estable

feat/*  fix/*  chore/*  docs/*
  └─ desarrollo
        ↓
      push
        ↓
   Vercel Preview
        ↓
       QA
        ↓
   merge a main
        ↓
  producción automática
```

Excepción: correcciones críticas urgentes, y sólo con revisión explícita.

### Nomenclatura de ramas

```text
feat/<descripcion>
fix/<descripcion>
chore/<descripcion>
docs/<descripcion>
```

Ejemplos: `feat/collection-comparison`, `fix/share-layout-mobile`,
`chore/update-drizzle`, `docs/qa-guide`.

---

## 3. Antes de mergear a `main`

Mínimo obligatorio:

```bash
npm run lint
npm run test
npm run build
git diff --check
```

Si el cambio toca **schema, repository, migraciones o lógica de datos**, además
hay que ejecutar los tests contra PostgreSQL real:

```bash
DATABASE_URL="postgresql://app_album:app_album_local@localhost:55432/app_album" \
AUTH_SECRET="<secreto-local-de-32+-caracteres>" \
npm run test
```

**No se mergea con tests fallando.**

---

## 4. Migraciones

Vercel **no** ejecuta migraciones en el deploy. El orden es:

1. generar la migración local (`npm run db:generate`);
2. revisar el SQL generado;
3. probar contra un PostgreSQL local limpio;
4. commit;
5. **antes** del deploy productivo, aplicar contra Neon `production`;
6. confirmar que quedó aplicada;
7. desplegar el código compatible.

```bash
npx neon-env run -- npm run db:migrate
```

`neon-env` inyecta las variables del branch declarado en `.neon` (hoy
`production`). Verifica el branch antes de ejecutar.

> ⚠️ Nunca ejecutar una migración destructiva sin backup previo confirmado.

---

## 5. Variables productivas

Actuales:

- `DATABASE_URL`
- `AUTH_SECRET`

`NODE_ENV` lo gestiona la plataforma.

Reglas:

- no versionar secretos;
- no copiar el secreto local a producción;
- no pegar secretos en issues, README, logs ni commits;
- Vercel mantiene las variables productivas;
- `.env.local` es sólo local;
- `.neon` no se versiona.

---

## 6. Neon

- Proyecto enlazado mediante el archivo `.neon` (`orgId`, `projectId`, `branch`).
- Branch productiva: `production`.
- `.env.local` se rellena desde Neon para desarrollo local.
- `DATABASE_URL` **pooled** para runtime.
- `DATABASE_URL_UNPOOLED` disponible para tareas puntuales si fuese necesario.

No crear branches productivas nuevas sin necesidad. Las branches temporales
sirven para pruebas y previews (el `neon.ts` les asigna `ttl: 7d`).

---

## 7. Vercel

- `main` = producción; cualquier otra rama = preview.
- No hacer pruebas destructivas en producción.
- Validar el Preview antes de mergear.
- Rollback de aplicación: volver al deployment anterior desde Vercel.
- No automatizar migraciones dentro del deploy (todavía).

---

## 8. Marcha blanca

**Estado: MVP en marcha blanca.**

Público inicial: personas de confianza, grupo pequeño, QA funcional.

Mensaje operativo para testers:

> Esta plataforma está en marcha blanca. Puede presentar errores y los datos
> podrían reiniciarse antes del lanzamiento definitivo.

No se implementa banner en este bloque.

---

## 9. Qué deben probar los testers

### Cuenta

- [ ] registro
- [ ] login
- [ ] logout

### Colección

- [ ] explorar álbumes
- [ ] agregar álbum
- [ ] marcar láminas
- [ ] aumentar / reducir duplicados
- [ ] alternar mosaico / lista
- [ ] quitar colección

### Compartir

- [ ] activar enlace
- [ ] copiar
- [ ] abrir en incógnito
- [ ] revisar faltantes
- [ ] revisar repetidas
- [ ] desactivar
- [ ] confirmar que deja de funcionar

### Responsive

- [ ] desktop
- [ ] móvil si es posible

---

## 10. QA interno admin

Sólo testers internos autorizados deben probar:

- crear álbum;
- editar metadata;
- páginas;
- creación masiva;
- selección bulk;
- asignación de página;
- publicación / despublicación.

**No entregar admin a testers externos.**

---

## 11. Reportar bugs

```text
Título:
Entorno:
URL:
Usuario:
Pasos:
Resultado esperado:
Resultado real:
Captura:
Severidad:
```

Severidades:

| Severidad | Definición |
| --- | --- |
| `BLOCKER` | impide usar el flujo principal |
| `HIGH` | corrupción, seguridad o fallo importante |
| `MEDIUM` | el flujo funciona con un problema relevante |
| `LOW` | detalle menor |
| `UX` | diseño/usabilidad sin fallo funcional |

---

## 12. Features durante la marcha blanca

Prioridad:

1. bugs
2. seguridad
3. estabilidad
4. UX importante
5. mejoras pequeñas

Evitar: features grandes, cambios de arquitectura, servicios nuevos sin
necesidad y refactors amplios. Una feature nueva espera, salvo que resuelva un
bloqueo real de QA.

---

## 13. Datos productivos

- no borrar datos productivos por conveniencia;
- no resetear la base sin aprobación;
- no cargar fixtures de desarrollo;
- no usar datos personales innecesarios;
- no crear usuarios demo automáticos.

Si se necesita limpieza, **documentarla antes**.

---

## 14. Backups

Neon debe mantener backups/PITR según las capacidades del plan.

Antes de una migración destructiva, una limpieza masiva o un cambio
estructural: **confirmar que existe un backup disponible**.

---

## 15. Incidentes

Orden recomendado:

1. revisar `/api/health`;
2. revisar deployment y logs de Vercel;
3. revisar Neon;
4. identificar si el problema es de app o de base de datos;
5. rollback de Vercel si hubo un cambio reciente;
6. no modificar datos manualmente salvo necesidad.

Registrar causa y solución.

---

## 16. Rollback

**Aplicación:** volver al deployment anterior desde Vercel.

**Base de datos:** no hacer downgrade automático de migraciones. Restaurar un
backup sólo si fuese necesario y deliberado.

---

## 17. Limitaciones conocidas del MVP

- sin recuperación de contraseña;
- sin comparación de colecciones;
- sin chat;
- sin geolocalización;
- sin notificaciones;
- UI aún en fase de pulido;
- la marcha blanca puede implicar cambios de datos antes del lanzamiento
  definitivo.

---

## 18. Workflow diario recomendado

```bash
git checkout main
git pull

git checkout -b fix/nombre-del-ajuste

# desarrollar

npm run lint
npm run test
npm run build

git add ...
git commit -m "fix: ..."

git push -u origin fix/nombre-del-ajuste
```

Luego:

1. revisar el Preview de Vercel;
2. QA;
3. merge a `main`;
4. verificar el deploy productivo;
5. probar `/api/health`.

---

## 19. Check post-deploy

Después de cada deploy productivo:

- [ ] `/api/health` → `200`
- [ ] home carga
- [ ] login funciona
- [ ] `/app` funciona
- [ ] si hubo cambio en sharing, probar un enlace
- [ ] si hubo cambio en base de datos, validar la operación afectada

No requiere QA completo en cada deploy pequeño.
