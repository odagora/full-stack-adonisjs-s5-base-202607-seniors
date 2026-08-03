# Prompt: publicar el sitio de documentación en GitHub Pages

Versión corregida del prompt técnico original que evaluamos al principio de
este ejercicio ("Genera un GitHub Actions workflow que: 1. Se dispare en push
a main... 4. Use Node 22, npm ci..."). Mantiene la misma estructura numerada
y concreta, pero incorpora todo lo que ese primer prompt no cubría y que
terminamos necesitando en la práctica (permisos, entorno de GitHub Pages,
monorepo, verificación real del sitio publicado, staleness de contenido
generado).

## Prompt

```text
Genera un GitHub Actions workflow que:

1. Se dispare en push a main cuando cambien archivos en docs/site/ o el
   propio workflow, con opción de disparo manual.
2. Instale dependencias y haga build del sitio Astro + Starlight desde
   docs/site/ (es un monorepo — no asumas que el proyecto vive en la raíz,
   usa su lockfile propio).
3. Publique en GitHub Pages con upload-pages-artifact y deploy-pages,
   incluyendo los permisos y el "environment" que esas acciones necesitan
   para publicar (sin eso, el deploy falla aunque el build compile bien).
4. Use la versión de Node que ya usa el proyecto (revísala, no la
   inventes) y npm ci contra el lockfile de docs/site/.
5. Evite ejecuciones simultáneas si hay pushes seguidos a main.

Antes de escribirlo, pregúntame lo que no puedas confirmar revisando el
repo: a qué repositorio real se publica (si hay más de un remoto
configurado, no lo asumas) y cuál va a ser la URL final del sitio. Si el
sitio depende de contenido generado o sincronizado desde otra parte del
proyecto, agrega una forma de detectar automáticamente si quedó
desactualizado, en vez de confiar en que alguien se acuerde de
regenerarlo.

Dime también, en detalle, qué configuración manual tengo que hacer yo
en GitHub por fuera del código para que la publicación funcione — no lo
dejes implícito.

Un workflow "exitoso" no garantiza que el sitio funcione: antes de dar la
tarea por terminada, entra tú mismo a la URL pública ya publicada,
navégala y confirma que se ve bien, que los links internos y los assets
cargan, y que no hay nada roto. Si algo falla, arréglalo y vuelve a
verificar ahí, no solo en local.

Prefiere siempre la solución más simple, y pregúntame si te falta
información en vez de asumir.
```

## Notas de diseño del prompt

- **Misma estructura que el prompt original, pero completa.** El primer
  prompt que probamos tenía 4 puntos técnicos razonables (disparo, build,
  publicación, Node/npm) pero ninguno mencionaba permisos, `environment`,
  el hecho de que el proyecto es un monorepo, ni la corrección del `base`
  de Astro contra la URL real de publicación — todos gaps que encontramos
  recién al analizar el workflow generado a partir de esa versión. Esta
  versión conserva la forma (una lista numerada de requisitos técnicos del
  workflow) pero cierra esos huecos.

- **Node "el que usa el resto del proyecto", no un número fijo.** El
  original pedía "Node 22" a secas — un número arbitrario que terminó
  siendo inconsistente con el resto del repo (que fija Node 24 en otras
  partes). Pedir que se revise la versión real en vez de hardcodear un
  número evita ese tipo de desalineación silenciosa.

- **Sigue preguntando antes de asumir, aunque el prompt ya sea técnico.**
  Ser específico sobre el mecanismo (GitHub Actions, upload-pages-artifact,
  deploy-pages) no resuelve las decisiones que dependen del usuario: a qué
  repositorio publicar (hay más de un remoto en este proyecto) y qué URL
  final va a tener el sitio. Un prompt técnico no está exento de este
  chequeo — de hecho, cuanto más específico es el prompt, más fácil es que
  alguien asuma que "ya está todo definido" y se salte estas preguntas.

- **Pide la lista de configuración manual fuera del código, explícita.**
  Publicar en GitHub Pages requiere habilitar algo en la configuración del
  repositorio que ningún workflow puede hacer por sí mismo. Si el prompt no
  lo pide de forma explícita, es fácil terminar con un workflow que se ve
  bien pero falla en producción por un permiso que nadie habilitó a mano.

- **Separa "compila" de "está publicado y funciona".** Es la instrucción
  más importante del prompt, y la que el prompt original no tenía en
  absoluto. Un build exitoso no garantiza que el sitio funcione: en el
  camino encontramos justamente un caso así — un link con una ruta vieja
  hardcodeada que compilaba perfecto y solo se notó navegando el sitio real
  ya publicado. Por eso el prompt exige esa verificación final contra la
  URL pública, no contra el build local.

- **Cierra igual que los otros dos prompts de la serie** (preferir la
  solución más simple, preguntar en vez de asumir) para mantener el mismo
  criterio en los tres, más allá de que este tenga una estructura más
  técnica que los otros dos.
