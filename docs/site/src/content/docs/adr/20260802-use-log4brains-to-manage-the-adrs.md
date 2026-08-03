---
title: "Use Log4brains to manage the ADRs"
---


- Status: accepted
- Date: 2026-08-01
- Tags: dev-tools, doc

## Context and Problem Statement

Queremos registrar las decisiones de arquitectura tomadas en este proyecto.
¿Qué herramienta(s) deberíamos usar para gestionar estos registros?

## Considered Options

- [Log4brains](https://github.com/thomvaill/log4brains): base de conocimiento de arquitectura (línea de comandos + generador de sitio estático)
- [ADR Tools](https://github.com/npryce/adr-tools): línea de comandos para crear ADRs
- [ADR Tools Python](https://bitbucket.org/tinkerer_/adr-tools-python/src/master/): línea de comandos para crear ADRs
- [adr-viewer](https://github.com/mrwilson/adr-viewer): generador de sitio estático
- [adr-log](https://adr.github.io/adr-log/): línea de comandos para generar una tabla de contenidos de ADRs

## Decision Outcome

Chosen option: "Log4brains", porque incluye las funcionalidades de todas las demás herramientas, y más.
