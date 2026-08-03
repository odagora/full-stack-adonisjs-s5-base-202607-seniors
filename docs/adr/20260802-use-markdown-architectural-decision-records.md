# Use Markdown Architectural Decision Records

- Status: accepted
- Date: 2026-08-01
- Tags: doc

## Context and Problem Statement

Queremos registrar las decisiones de arquitectura tomadas en este proyecto.
¿Qué formato y estructura deberían seguir estos registros?

## Considered Options

- [MADR](https://adr.github.io/madr/) 2.1.2 con el patch de Log4brains
- [MADR](https://adr.github.io/madr/) 2.1.2 – El Markdown Architectural Decision Records original
- [Michael Nygard's template](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) – La primera encarnación del término "ADR"
- [Sustainable Architectural Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions) – Los Y-Statements
- Otras plantillas listadas en <https://github.com/joelparkerhenderson/architecture_decision_record>
- Sin forma – Sin convenciones para el formato ni la estructura del archivo

## Decision Outcome

Chosen option: "MADR 2.1.2 with Log4brains patch", porque

- Las suposiciones implícitas deberían hacerse explícitas.
  La documentación de diseño es importante para que otras personas puedan entender las decisiones más adelante.
  Ver también [A rational design process: How and why to fake it](https://doi.org/10.1109/TSE.1986.6312940).
- El formato MADR es liviano y encaja con nuestro estilo de desarrollo.
- La estructura de MADR es comprensible y facilita su uso y mantenimiento.
- El proyecto MADR está vivo (mantenimiento activo).
- La versión 2.1.2 era la más reciente disponible al momento de empezar a documentar ADRs.
- El patch de Log4brains agrega más funcionalidades, como los tags.

El "patch de Log4brains" realiza las siguientes modificaciones a la plantilla original:

- Cambia el formato del nombre de archivo de los ADR (`NNN-adr-name` pasa a `YYYYMMDD-adr-name`), para evitar conflictos durante los merges de Git.
- Agrega un estado `draft`, para habilitar la escritura colaborativa.
- Agrega un campo `Tags`.

## Links

- Relates to [Use Log4brains to manage the ADRs](../20260802-use-log4brains-to-manage-the-adrs/)
