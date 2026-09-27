import postgres from "postgres";
import { normalizeBootstrapIdentifier } from "./bootstrap-admin-lib.mjs";

let identifier;
try {
  identifier = normalizeBootstrapIdentifier(process.argv[2]);
} catch (error) {
  console.error(error.message);
  console.error("Uso: npm run admin:bootstrap -- <username-o-email>");
  process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL es obligatoria.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
try {
  const changed = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(741903)`;
    const rows = await tx`
      select id, username, role, status
      from users
      where username = ${identifier} or email = ${identifier}
      limit 2
      for update
    `;
    if (rows.length !== 1) {
      throw new Error(rows.length === 0 ? "Usuario no encontrado." : "Identificador ambiguo.");
    }
    const user = rows[0];
    if (user.role === "admin" && user.status === "active") return user;

    await tx`
      update users set role = 'admin', status = 'active', updated_at = now()
      where id = ${user.id}
    `;
    if (user.role !== "admin") {
      await tx`
        insert into user_admin_events
          (actor_user_id, actor_label, target_user_id, action, previous_value, new_value)
        values
          (null, 'bootstrap-cli', ${user.id}, 'role_change', ${user.role}, 'admin')
      `;
    }
    if (user.status !== "active") {
      await tx`
        insert into user_admin_events
          (actor_user_id, actor_label, target_user_id, action, previous_value, new_value)
        values
          (null, 'bootstrap-cli', ${user.id}, 'unblock', ${user.status}, 'active')
      `;
    }
    return { ...user, role: "admin", status: "active" };
  });
  console.log(`Usuario ${changed.username} configurado como admin activo.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "No se pudo promover el usuario.");
  process.exitCode = 1;
} finally {
  await sql.end();
}
