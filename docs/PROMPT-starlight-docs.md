# Prompt: configurar el sitio de documentación (Starlight)

Prompt genérico, a nivel de usuario, para reproducir la configuración de
`docs/site/astro.config.mjs` (sidebar de ADRs, referencia de API
autogenerada, portada real, etc.) partiendo de un proyecto Starlight recién
inicializado con el contenido de ejemplo por defecto.

## Prompt

```text
Tengo un proyecto Astro con el tema Starlight ya instalado en docs/site/,
todavía con el contenido de ejemplo por defecto. Quiero convertirlo en el
sitio de documentación real de mi proyecto. Necesito:

1. Que la portada, al entrar al sitio, muestre directamente la
   documentación del proyecto (con menú lateral visible) — no la pantalla
   de bienvenida genérica de Starlight.

2. Una sección en el menú lateral con las decisiones de arquitectura
   (ADRs) que ya tengo documentadas en otras carpetas del repo, para no
   duplicar ese trabajo manualmente. La sección tiene que reflejar sola
   los ADRs que haya en cada momento — si agrego o saco uno, no debería
   tener que tocar la configuración del sitio para que el menú se
   actualice. Si ese contenido ya tiene su propio título dentro del texto
   (no solo en metadata), asegurate de que no quede duplicado
   visualmente.

3. Una sección con la documentación de mi API, generada automáticamente
   a partir del contrato real de mi backend (no escrita a mano), con un
   nombre descriptivo en el menú.

4. Sacar del menú cualquier sección de ejemplo que no esté usando
   todavía (guías, referencia genérica, etc.) para no confundir con
   contenido de relleno.

5. El link de GitHub del sitio debe apuntar al repositorio real del
   proyecto.

6. El sitio eventualmente se va a publicar en GitHub Pages, pero el
   deploy en sí es un paso posterior — por ahora que funcione bien en
   desarrollo local, dejando lo necesario preparado para cuando se defina
   dónde se publica.

Te adjunto el astro.config.mjs de una versión anterior de este mismo
sitio, como referencia de a dónde quiero llegar — pero no lo copies
literal: verificá que cada parte siga aplicando a mi proyecto actual
(paquetes instalados, nombres, URLs) y preguntame antes de asumir algo
que no esté confirmado ahí.

Antes de tocar nada: preguntame lo que necesites para tomar estas
decisiones (URL del repo, si integro la doc de la API ahora o después,
si traigo las decisiones de arquitectura ya escritas, cómo se llama el
proyecto, etc.) — no asumas nada que yo no haya confirmado, ni siquiera
lo que parezca sugerido por el archivo de referencia.

Una vez implementado: probá que todo funcione de verdad (que el sitio
compile sin errores ni advertencias raras, y que se vea bien en el
navegador) antes de darlo por terminado. Si para lograr algo de esto
hace falta generar o sincronizar contenido desde otras partes del repo,
dejalo como algo que yo pueda volver a correr cuando ese contenido
cambie, no como un paso que se hace una sola vez y ya.

Si hay más de una forma válida de resolver algo, preferí la que no
agregue piezas nuevas al proyecto (dependencias, plugins, pasos extra de
build) por sobre la que sí, mientras el resultado final sea el mismo.
Ante la duda, resolvelo con lo que ya estás escribiendo o con la
herramienta que ya está instalada, antes que sumar una nueva.
```

## Notas de diseño del prompt

- **Nivel de usuario, no de implementación**: describe resultados
  observables (qué debe verse, qué debe actualizarse solo, qué no debe
  duplicarse) en vez de nombrar paquetes o mecanismos concretos
  (`autogenerate`, `starlight-openapi`, plugins remark, etc.). Cualquier
  solución técnica que cumpla el comportamiento descrito es válida.
- **Pide preguntar antes de asumir**: la URL del repo, el nombre del
  proyecto, y si se integra la doc de la API ahora o después son
  decisiones que le corresponden al usuario, no al agente.
- **Pide verificación real**: build sin errores/warnings y revisión
  visual en navegador — este paso es el que efectivamente detecta bugs
  no evidentes en el build (como un título duplicado) sin necesidad de
  anticiparlos explícitamente en el prompt.
- **Prefiere simplicidad**: ante dos soluciones válidas, la que no suma
  una dependencia o pieza nueva al pipeline gana — evita que un problema
  chico derive en una implementación más compleja de lo necesario.
- **El archivo de referencia adjunto es orientativo, no vinculante**: se
  usa para mostrar "a dónde se quiere llegar", pero el prompt pide
  explícitamente no copiarlo literal y validar cada parte contra el
  proyecto actual.
