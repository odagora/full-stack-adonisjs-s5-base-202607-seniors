---
title: "Use SQLite with better-sqlite3 instead of PostgreSQL"
---


- Status: accepted
- Deciders: Equipo FlowSync
- Date: 2026-08-02
- Tags: backend, database, infra

Technical Story: FlowSync es la aplicación del máster AI4Devs.

## Context and Problem Statement

FlowSync necesita una base de datos relacional para el backend en AdonisJS.
¿Qué motor de base de datos debemos usar durante el desarrollo (y como base
del starter kit) para minimizar la fricción de setup del equipo sin renunciar
a un ORM productivo?

## Decision Drivers

- Cero overhead de infraestructura para levantar el entorno de desarrollo local (sin Docker, sin servicios externos).
- Soporte nativo y de primera clase en Lucid ORM (el ORM ya elegido para el proyecto).
- Velocidad de onboarding para estudiantes del máster que clonan el repo por primera vez.
- No es una prioridad, en esta etapa, soportar escritura concurrente a escala ni tipos de datos avanzados de PostgreSQL.

## Considered Options

- SQLite + better-sqlite3
- PostgreSQL

## Decision Outcome

Chosen option: "SQLite + better-sqlite3", porque no requiere infraestructura
adicional (no hay que instalar, levantar ni configurar un servidor de base de
datos) y Lucid ORM lo soporta de forma nativa sin drivers ni configuración
extra, lo que reduce al mínimo la fricción de onboarding del máster.

### Positive Consequences

- Cualquiera puede clonar el repo y correr `npm run migration:run` sin instalar ni configurar un servidor de base de datos.
- El archivo de base de datos (`tmp/db.sqlite3`) es autocontenido, fácil de resetear (`npm run migration:fresh`) y de inspeccionar.
- No hay dependencias de infraestructura (Docker, servicios cloud) para desarrollo ni para CI.

### Negative Consequences

- No hay soporte para arrays nativos ni para otros tipos de datos avanzados de PostgreSQL (JSONB, tipos enumerados nativos, etc.).
- No es apta para escritura concurrente a escala: SQLite serializa las escrituras, lo cual descarta este setup para un entorno de producción con múltiples procesos escribiendo simultáneamente.
- Si el proyecto necesita escalar a producción real, será necesaria una migración futura a PostgreSQL (o similar), incluyendo la revisión de cualquier columna o consulta que dependa de comportamiento específico de SQLite.

## Pros and Cons of the Options

### SQLite + better-sqlite3

- Good, because no requiere levantar ni mantener un servidor de base de datos separado.
- Good, because Lucid ORM lo soporta de forma nativa, sin configuración adicional.
- Good, because simplifica el onboarding de los estudiantes del máster.
- Bad, because no soporta arrays nativos ni tipos de datos avanzados de PostgreSQL.
- Bad, because no soporta escritura concurrente a escala (limitación para un uso en producción real).

### PostgreSQL

- Good, because es un motor apto para producción, con soporte de escritura concurrente y tipos de datos avanzados (arrays, JSONB, etc.).
- Good, because es el motor más usado en el ecosistema AdonisJS/Lucid para producción.
- Bad, because requiere infraestructura adicional (Docker o un servicio gestionado) tanto en desarrollo como en CI.
- Bad, because incrementa la fricción de onboarding para quienes recién clonan el repo.

## Links

- Relates to [Use Markdown Architectural Decision Records](../../../docs/adr/20260802-use-markdown-architectural-decision-records.md)
