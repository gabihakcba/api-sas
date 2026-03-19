# AGENTS.md (Backend)

## Project Overview

API REST construida con la última versión de NestJS, utilizando Prisma ORM (versión más reciente) conectado a una base de datos PostgreSQL.

## Code Style Guidelines

- **TypeScript y DTOs:** Prohibido el uso de `any`. Toda entrada de datos a los controladores debe estar tipada y validada estrictamente utilizando clases DTO con `class-validator` y `class-transformer`.
- **Arquitectura:** Seguir el patrón de diseño modular de NestJS (Module -> Controller -> Service).

## Security Considerations & "Gotchas" de Negocio

- [cite_start]**Soft Deletes (Prohibido borrar):** La base de datos implementa borrado lógico con el campo `borrado Boolean @default(false)`[cite: 221]. **Bajo ninguna circunstancia** utilices el comando `prisma.model.delete()`. Para eliminar registros, utiliza siempre `prisma.model.update()` seteando `borrado: true`. Se recomienda implementar Prisma Client Extensions para filtrar automáticamente los registros borrados en las consultas.
- [cite_start]**Históricos y Trazabilidad:** Al realizar un "Pase de Rama" (ej. de Unidad a Caminantes [cite: 10, 11]) o reasignar un cargo adulto, NO sobrescribas el registro activo en `MiembroRama` o `EquipoArea`. [cite_start]Debes actualizar el registro actual asignando la `fecha_egreso` o `fecha_fin`[cite: 230, 236], y crear un NUEVO registro insertando la `fecha_ingreso` actual. El histórico debe permanecer intacto.
- [cite_start]**RBAC y Scopes Dinámicos:** El sistema maneja permisos dinámicos en `CuentaRole` usando un `id_scope` polimórfico[cite: 274]. Como Prisma no valida esta integridad referencial polimórfica nativamente, debes crear _Custom Guards_ en NestJS que intercepten la petición, lean el `tipo_scope`, y validen contra la tabla correspondiente (Rama, Área, etc.) antes de autorizar la acción.
- [cite_start]**Privacidad de Actas:** La tabla `TemarioConsejo` posee el campo booleano `sin_mp`[cite: 269]. Todo endpoint público o de exportación de actas destinado a representantes juveniles debe filtrar y excluir obligatoriamente los registros donde este valor sea `true`.
- [cite_start]**Aislamiento de Cajas Chicas:** Cada rama gestiona su propia cuenta de manera independiente[cite: 258]. [cite_start]Los servicios financieros deben validar que un educador de una rama específica solo pueda registrar transacciones (`Pago` [cite: 247]) en la `CuentaDinero` vinculada estrictamente al `id_rama` de su asignación actual.

* **Data Scoping y Filtrado Automático (RBAC):** Ningún endpoint de lectura (`GET`) debe devolver colecciones completas de la base de datos por defecto. Todo servicio debe leer el `SCOPE` y los permisos del usuario autenticado (extraídos del request/JWT) e inyectar obligatoriamente una cláusula `where` en Prisma para filtrar los datos. Por ejemplo, si un usuario consulta el endpoint `get-all-protagonistas` y su scope está limitado a una rama específica (ej. Caminantes), Prisma debe filtrar y retornar únicamente los registros vinculados a ese `id_rama`. Solo los usuarios con scope `GLOBAL` o rol de Administrador pueden omitir este filtro.
* **Paginación obligatoria en listados:** Todo endpoint que devuelva colecciones o listados multi-registro debe paginarse en backend por defecto. El tamaño inicial estándar es `10` registros por página; no se deben devolver colecciones completas salvo que el caso de uso lo justifique explícitamente.
* **Contrato de paginación consistente:** Todo listado paginado debe responder con una estructura `{ data, meta }`, donde `meta` siga el contrato compartido `PaginatedResponseMeta` con `page`, `limit`, `total` y `totalPages`.

### Uso Obligatorio de Guards y Helper de Scope

- **`RolesGuard`:** Se utiliza para autorizar por rol declarado en el endpoint mediante `@Roles(...)`. Debe permitir bypass inmediato si el usuario posee `ADM`, `OWN` o `JEFATURA`.
- **`PermissionsGuard`:** Se utiliza para autorizar por permiso funcional declarado con `@CheckPermissions(...)`. Responde a la pregunta "puede realizar esta acción sobre este recurso".
- **`ScopesGuard`:** Se utiliza para autorizar por alcance contextual (`AREA`, `RAMA`, etc.) declarado con `@ScopeAccess(...)`. Responde a la pregunta "puede hacerlo sobre esta rama o esta área concreta". Este guard **no filtra resultados**, solo autoriza o rechaza la request.
- **`ScopeFilterService`:** Se utiliza dentro de los servicios para construir cláusulas `where` de Prisma a partir de `request.user.scopes`. Este helper **no se aplica automáticamente**; cada servicio debe invocarlo explícitamente cuando haga lecturas o búsquedas sensibles por scope.

### Cuándo usar cada pieza

- **Endpoints `POST`, `PATCH`, `DELETE` sobre recursos scoped:** Deben combinar `JwtAuthGuard`, `PermissionsGuard` y `ScopesGuard` cuando la operación dependa de `id_rama`, `id_area` o un identificador equivalente.
- **Endpoints `GET` de colecciones o búsquedas:** Deben usar el `ScopeFilterService` para inyectar un `where` restringido por scope. No alcanza con usar solo `ScopesGuard`, porque el guard no limita los registros devueltos.
- **Endpoints `GET` por id único:** Si el id pertenece a un recurso scoped, se recomienda usar ambas cosas:
  - `ScopesGuard` para validar acceso contextual cuando el endpoint expone explícitamente `idRama`, `idArea` u otro target de scope.
  - `ScopeFilterService` o validación equivalente en el servicio para asegurar que el registro consultado realmente pertenece al alcance del usuario.

### Regla operativa

- Si un usuario `JEFATURA_RAMA` con `scope RAMA = Caminantes` hace un `GET /protagonistas`, el filtrado a solo protagonistas de Caminantes **solo ocurrirá** si el servicio del endpoint usa `ScopeFilterService.forProtagonistas(user)` y fusiona ese resultado en el `where` de Prisma.
- Si el endpoint usa únicamente `ScopesGuard`, la request puede quedar autorizada, pero el servicio todavía podría devolver datos fuera de scope si no aplica el helper.
- Los usuarios con rol `ADM`, `OWN` o `JEFATURA`, o con scope `GLOBAL`, `GRUPO` u `OWN`, pueden omitir restricciones de scope en guards y helpers.

## Build and Test Commands

- Instalar dependencias: `npm install`
- Generar cliente Prisma: `npx prisma generate`
- Migraciones de base de datos: `npx prisma migrate dev`
- Iniciar en desarrollo: `npm run start:dev`
