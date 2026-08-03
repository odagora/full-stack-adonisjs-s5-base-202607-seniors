# Prompt: workflow de calidad de la documentación

Versión corregida del workflow de referencia que evaluamos ("Docs · Quality":
jobs de `markdownlint-cli2`, `lychee` y `vale`). Misma lógica que el prompt de
deploy: estructura numerada y técnica, pero incorporando lo que encontramos al
implementarlo (drift de contenido generado, cobertura completa de links, y
por qué `markdownlint`/`vale` no deben activarse como bloqueantes sin ajustar
antes su configuración al contenido real del repo).

## Prompt

```text
Genera un GitHub Actions workflow de calidad de documentación que:

1. Se dispare en pull_request cuando cambien archivos de documentación —
   incluyendo las fuentes reales de ese contenido si viven en más de una
   carpeta en un monorepo, no solo en un directorio central — y permita
   disparo manual.
2. Verifique que el contenido de documentación generado o sincronizado
   desde otra fuente (por ejemplo, algo exportado desde el código) esté al
   día: que el check falle si hay diferencia respecto a la fuente real,
   sin generar ni commitear nada automáticamente. Esto solo tiene sentido
   comparado contra el diff de un PR puntual, no en una corrida periódica.
3. Chequee que no haya links rotos, cubriendo tanto el texto fuente como
   el sitio ya buildeado. Un link puede estar bien escrito en el texto y
   romperse recién después del build, por rutas o configuración que se
   aplican en ese paso. Además de correr en cada PR, programá este chequeo
   también de forma periódica (por ejemplo, semanal): un link externo se
   puede romper con el tiempo sin que nadie toque el repo, así que
   revisarlo solo cuando hay cambios no alcanza.
4. Si agregas lint de formato de markdown o de prosa, no lo actives como
   bloqueante todavía: confirma conmigo primero si la configuración por
   defecto tiene sentido para el contenido real de este repo (podría
   generar ruido en vez de errores reales), y en qué idioma está escrita
   la documentación real antes de elegir herramientas o estilos pensados
   para otro idioma.

Antes de escribirlo, pregúntame lo que no puedas confirmar revisando el
repo: dónde vive la fuente real de cada tipo de contenido generado (puede
haber más de un lugar en un monorepo) y cómo se obtiene el contrato real
contra el que hay que comparar (por ejemplo, si hace falta levantar algún
servicio para generarlo).

Dime también si los checks necesitan algún permiso o configuración
adicional del repositorio para poder reportar resultados en el PR — no lo
asumas.

No des la tarea por terminada solo porque el workflow corre sin errores
de sintaxis: prueba con un cambio real que debería hacer fallar cada
check y confirma que lo detecta, y también corre cada check contra el
estado actual del repo para confirmar que pasa limpio, sin falsos
positivos. Un workflow que "corre bien" pero nunca falla cuando debería
no sirve de nada — y uno que falla por motivos que no son errores reales
tampoco.

Prefiere siempre la solución más simple, y pregúntame si te falta
información en vez de asumir.
```

## Notas de diseño del prompt

- **Misma estructura que el workflow de referencia, corregida con lo que
  encontramos al implementarlo.** El original tenía 3 jobs (markdown,
  links, prosa) razonables en el papel, pero ninguno contemplaba que el
  contenido de documentación de este repo se genera/sincroniza desde otras
  partes del proyecto y puede quedar desactualizado en silencio, ni que un
  link puede pasar el chequeo del texto fuente y romperse recién en el
  sitio ya buildeado.

- **Pide detectar drift, no generar contenido en CI.** El punto 2 pide
  explícitamente que el check falle ante una diferencia, sin generar ni
  commitear nada — mantiene la reproducibilidad del build (una decisión
  que ya habíamos tomado antes) en vez de convertir el CI en la fuente de
  verdad del contenido.

- **Pide cobertura de links en dos capas, no una.** Chequear solo el
  markdown fuente no alcanza para atrapar rutas rotas que dependen de
  configuración aplicada en el build (como un path base mal armado): hace
  falta también chequear el sitio ya generado.

- **Pide un trigger periódico solo para los links, no para todo.** El
  drift de contenido generado (punto 2) no tiene sentido fuera de un PR —
  no hay nada nuevo que comparar si nadie tocó el repo. Los links sí
  pueden romperse solos con el tiempo (un sitio externo que cae), así que
  ese chequeo necesita correr también sin que haya un PR de por medio. El
  prompt separa esto explícitamente para no terminar con un cron que
  corre jobs que no aplican fuera de ese contexto.

- **No activa lint de formato/prosa a ciegas.** A diferencia de los otros
  tres jobs, acá el prompt pide explícitamente confirmar antes de activar
  nada como bloqueante — la config por defecto de estas herramientas
  puede no encajar con el contenido real (reglas de markdown muy
  estrictas, o un estilo de prosa pensado para un idioma distinto al que
  realmente se usa en la documentación). Es la lección más cara de esta
  ronda: mejor preguntar antes de prender un check que puede fallar por
  ruido, no por errores reales.

- **Pide permisos de reporte en el PR de forma explícita.** Publicar
  resultados de un check dentro de un pull request suele requerir
  permisos que no vienen dados por defecto — mismo patrón que la lista de
  configuración manual del prompt de deploy, aplicado acá a nivel de
  permisos del workflow en vez de configuración externa en GitHub.

- **Verificación real en las dos direcciones, no solo una.** Adaptación
  del mismo principio del prompt de deploy ("no alcanza con que compile,
  hay que ver el sitio publicado funcionando"). Pedir solo que el check
  falle cuando corresponde no alcanza: la mayoría del tiempo real de esta
  ronda se fue en falsos positivos (una URL de base mal armada en la
  config del propio check, una página de error 404 marcada como link
  roto, un glob que colaba archivos de dependencias) que solo aparecen
  al correr el check contra contenido que sabemos que está bien. Sin esa
  segunda verificación, es fácil terminar con un check que "funciona"
  porque siempre falla — por el motivo equivocado.

- **Mismo cierre que los otros dos prompts de la serie** (preferir la
  solución más simple, preguntar en vez de asumir), para mantener el
  mismo criterio en los tres.
