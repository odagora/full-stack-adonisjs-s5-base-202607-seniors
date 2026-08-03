# Notas para el formador — divergencia intencional spec ↔ código

> ⚠️ **Documento interno para el mentor. NO es material para los alumnos.**
> Explica la trampa didáctica del ejercicio de **auditoría de documentación** de la
> Sesión 5. Si lo lees siendo alumno: no mires la solución todavía 🙂.

## Qué divergencia se introdujo

La especificación describe un endpoint que **no existe en el código**:

- **Spec (dice que existe):** `GET /api/v1/users/active` — "usuarios vistos en las
  últimas 24 horas".
  - Archivo: [`openspec/specs/users/spec.md`](../openspec/specs/users/spec.md),
    requirement **"Listado de usuarios activos"** (con sus 3 scenarios).
- **Código (no lo implementa):** `backend/app/controllers/users_controller.ts` solo
  tiene los métodos `index` (`GET /api/v1/users`) y `show` (`GET /api/v1/users/:id`).
  No hay método `active` ni ruta `/users/active` en `backend/start/routes.ts`.

Es decir: la spec promete una capability que el backend **no expone**. El esquema de
datos *sí* la soporta (el campo `last_seen_at` existe en el modelo `User` y en la
migración `..._create_users_table.ts`, y el login lo actualiza), lo que hace la
divergencia realista y auditable: "el dato está, el endpoint no".

## Por qué es a propósito

Es el objetivo del ejercicio **pre-S5 de auditoría de documentación**: los alumnos
comparan la documentación viva (PRD, specs de OpenSpec, OpenAPI) contra el código real y
deben **detectar y reportar** las divergencias. `GET /api/v1/users/active` es la
divergencia spec↔código plantada a conciencia.

> Nota: existen además "trampas" más sutiles heredadas del propio PRD v1.0
> (`docs/PRD.md`), pensadas para el análisis de requisitos:
>
> - §1 lista *notificaciones push* como **out of scope** explícito.
> - §3.3 deja el **criterio de ordenación** del listado sin definir (a decidir en
>   refinamiento).
> - §3.3 exige un **estado vacío** cuando el usuario no tiene tareas.
>
> Estas pertenecen al PRD y no se deben "corregir"; forman parte del material a auditar.

## Qué NO hacer

- **NO** implementes `GET /api/v1/users/active` para "arreglar" la divergencia. Eliminarla
  rompe el ejercicio: es justo lo que los alumnos tienen que encontrar.
- **NO** borres ni edites el requirement "Listado de usuarios activos" de la spec de
  `users`.
- **NO** modifiques el PRD (`docs/PRD.md`): es el PRD canónico v1.0 del que derivan las
  historias de usuario del Ejercicio 4.

## Verificación rápida de que la divergencia sigue intacta

```bash
# La spec SÍ documenta el endpoint:
git grep -n "active" -- openspec/

# El código NO lo implementa: no hay método `active` ni ruta /users/active.
git grep -n "async active" -- backend/app/controllers/users_controller.ts   # vacío
git grep -n "users/active" -- backend/start/routes.ts                        # vacío
```

> Ojo: `git grep -n "active" -- backend/app/controllers/users_controller.ts`
> **sí** devuelve una línea, pero es un **comentario** heredado del template
> ("NOTA PARA EL FORMADOR: el endpoint … se implementa EN VIVO en la Sesión 3"),
> no una implementación. Ese comentario no se toca: forma parte del starter.

En la demo en vivo (Sesión 3) el mentor implementa `GET /api/v1/users/active` en directo
con el flujo Explore-Plan-Execute; por eso las ramas `demo/s05-*` parten de esta misma
divergencia documentada.
