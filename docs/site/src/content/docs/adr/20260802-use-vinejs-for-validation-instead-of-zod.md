---
title: "Use VineJS for validation instead of Zod"
---


- Status: accepted
- Deciders: Equipo FlowSync
- Date: 2026-08-02
- Tags: backend, validation

Technical Story: FlowSync es la aplicación del máster AI4Devs.

## Context and Problem Statement

FlowSync necesita validar el input de las peticiones HTTP (registro, login,
recursos protegidos) en el backend de AdonisJS. ¿Qué librería de validación
debemos usar para minimizar la fricción de integración con el framework y el
ORM ya elegidos?

## Decision Drivers

- AdonisJS 7 incluye VineJS de forma nativa como su librería de validación por defecto.
- Necesidad de integración directa con Lucid ORM (p. ej. reglas de unicidad contra la base de datos, como el email en `signupValidator`).
- Minimizar dependencias externas y capas de adaptación en el starter kit.
- Rendimiento de la validación, dado que se ejecuta en cada request.

## Considered Options

- VineJS
- Zod

## Decision Outcome

Chosen option: "VineJS", porque viene integrado nativamente en AdonisJS 7 y
tiene integración directa con Lucid ORM, mientras que usar Zod habría
requerido adaptadores manuales para conectarlo con el ciclo de vida de
validación del framework (`request.validateUsing`) y con las reglas que
consultan la base de datos.

### Positive Consequences

- Cero dependencias ni adaptadores adicionales: `#validators/*` usa directamente la API de AdonisJS.
- Reglas de validación con acceso nativo a Lucid (p. ej. `unique` contra la tabla `users` en `signupValidator`), sin código de integración propio.
- Los mensajes de error y el formato de respuesta de validación siguen la convención estándar de AdonisJS, consistente en todo el proyecto.
- `@vinejs/vine` implementa el spec de Standard Schema, lo que permite además que herramientas del ecosistema (p. ej. `@foadonis/openapi`) introspeccionen los validators para generar documentación OpenAPI sin configuración extra.

### Negative Consequences

- El equipo queda acoplado al ecosistema de AdonisJS: VineJS es mucho menos usado fuera de este framework que Zod, lo que reduce la transferibilidad del conocimiento a otros proyectos.
- Menor cantidad de recursos, ejemplos y integraciones de terceros en comparación con Zod, que tiene un ecosistema más grande y maduro.

## Pros and Cons of the Options

### VineJS

- Good, because viene integrado nativamente en AdonisJS 7, sin instalación ni configuración adicional.
- Good, because tiene integración directa con Lucid ORM para reglas que consultan la base de datos.
- Good, because implementa Standard Schema, lo que habilita interoperabilidad con otras herramientas del ecosistema sin adaptadores.
- Bad, because es una librería específica del ecosistema AdonisJS, con menor adopción fuera de él.

### Zod

- Good, because es la librería de validación más popular y usada en el ecosistema TypeScript en general.
- Good, because el conocimiento es transferible a proyectos fuera de AdonisJS.
- Bad, because no tiene integración nativa con AdonisJS ni con Lucid: habría requerido escribir y mantener adaptadores manuales para conectarlo con `request.validateUsing` y con reglas de unicidad contra la base de datos.
- Bad, because introduce una dependencia y una capa de integración adicional que AdonisJS ya resuelve out-of-the-box con VineJS.

## Links

- Relates to [Use SQLite with better-sqlite3 instead of PostgreSQL](../20260802-use-sqlite-with-better-sqlite3-instead-of-postgresql/)
