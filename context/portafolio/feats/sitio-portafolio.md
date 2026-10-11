# Sitio portafolio de Lourdes Portales

## Resumen

Sitio estático en Angular 20 para la marca personal de Lourdes Portales (marketing, estrategia digital, branding y contenido audiovisual). Se despliega en Vercel automáticamente con cada push a `main` en `github.com/VReyna7/portafolio_lou`.

La marca del sitio es Lourdes. Los proyectos (por ejemplo, Editorial Manu) son trabajos que ella realizó y solo se exhiben. El formulario de contacto es para que marcas o personas la contacten a ella.

## Secciones

| Sección | Componente | Fuente en `site.json` |
| --- | --- | --- |
| Inicio | `src/app/components/hero` | `profile` |
| Herramientas | `src/app/components/tools` | `tools` |
| Proyectos (galería) | `src/app/components/projects` | `projects` |
| Ficha de proyecto | `src/app/components/project-detail` | proyecto seleccionado |
| Contacto | `src/app/components/contact` | `contact` |

## Decisiones técnicas

- Todo el contenido vive en `public/content/site.json` y se carga en tiempo de ejecución con `ContentService`. Cambiar textos o agregar proyectos no requiere tocar código.
- Sin backend: el formulario envía a Web3Forms, que reenvía el mensaje al correo de Lourdes.
- Los proyectos se abren en un `<dialog>` nativo dentro de la misma página (sin rutas por proyecto), en el componente `ProjectDetail`. La ficha muestra solo: banda de título, "Mi rol", "El proyecto" y "Proceso y evidencias" (pasos numerados alternando imagen y texto). No tiene formulario ni correo.
- Paleta: blanco, un solo morado de marca (`--violet`) y negro (`--ink`) como segundo color. Herramientas es una banda negra de ancho completo, el pie de página es negro y los subtítulos llevan una raya morada.
- Las herramientas se muestran con siglas, no con logos oficiales, para no usar marcas registradas.
- Animaciones con GSAP (ver sección Animaciones).
- Angular 20 en lugar de la versión más reciente porque el Node local es 22.16 y las versiones nuevas de la CLI piden Node 22.22 o superior.

## Animaciones

- `src/app/animations/gsap.ts`: registra ScrollTrigger y SplitText una sola vez y expone `prefersReducedMotion()`. Si el sistema pide menos movimiento, no se anima nada.
- `src/app/animations/reveal.directive.ts`: directiva `appReveal` que hace aparecer una sección al entrar en pantalla. Recibe un selector para escalonar sus hijos, por ejemplo `appReveal=".section__title, .card"`. Los proyectos nuevos la heredan sin cambios.
- Inicio: línea de tiempo de entrada; el eslogan va en cursiva, a todo el ancho debajo de la foto y del resumen, y se revela palabra por palabra.
- Proyecto: la ventana entra con escala, la banda de título se despliega y los bloques caen en cascada. Cada paso de evidencia se revela al hacer scroll dentro de la ventana (ScrollTrigger con `scroller` = el dialog): la imagen se descubre con un barrido lateral alternado y un zoom de salida, y el número y el texto entran desde el lado opuesto. Una barra superior en el color del proyecto marca el progreso de lectura. Las animaciones de scroll se crean después de cargar las imágenes (máximo 1.5 s de espera) para que las posiciones sean correctas. Al cerrar (botón, clic fuera o Escape) sale animada y todo se revierte, así que al reabrir se anima de nuevo.
- Contacto: el mensaje de "enviado" aparece con un rebote corto.
- Los efectos hover usan las propiedades CSS `translate` y `rotate`, no `transform`, para no chocar con GSAP.

## Cómo agregar un proyecto

1. Abrir `public/content/site.json`.
2. Copiar un bloque dentro de `projects` y pegarlo después del último (separado por coma).
3. Editar los campos:

| Campo | Uso |
| --- | --- |
| `slug` | Identificador único, en minúsculas y con guiones (`campana-redes-cafe`). |
| `title` | Nombre del trabajo. |
| `category` | Tipo de trabajo (Branding, Redes sociales, Campaña...). |
| `summary` | Una o dos líneas para la tarjeta y la banda de título. |
| `cover` | Imagen de portada de la tarjeta (se muestra completa sobre fondo negro). Vacío la oculta. |
| `role` | Qué hizo Lourdes ("Mi rol"). |
| `tasks` | Opcional. Lista de funciones que se muestra con viñetas debajo de `role`. |
| `description` | Texto de "El proyecto". |
| `driveUrl` | Enlace a más material. Vacío oculta el botón. |
| `accent` | Color del proyecto en hexadecimal (`#8a1f2b`): tarjeta, banda, números y barra de progreso. |
| `evidence` | Pasos del proceso, en orden: lista de `title`, `description` e `image`. Opcionales: `video`, `poster`, `speed`, `ratio` y `sound` (ver Videos). |

4. Para imágenes, guardarlas en `public/projects/<slug>/` y referenciarlas como `projects/<slug>/archivo.jpg`. Si `image` está vacío se muestra un bloque de color con el título.
5. Commit y push a `main`. Vercel publica en uno o dos minutos.

## Videos

- Se sirven desde el propio sitio (no YouTube): para clips cortos el iframe de YouTube pesa más que el video comprimido y no se puede integrar al diseño.
- Siempre arrancan en silencio, en bucle y sin controles. El archivo solo se descarga cuando el paso entra en pantalla dentro de la ficha (`preload="none"` + ScrollTrigger) y se pausa al salir. Con "reducir movimiento" no se reproducen solos y se muestran los controles nativos.
- `sound: true` muestra una barra mínima de controles (solo para archivos que conservan su pista de audio): reiniciar, activar/silenciar y, mientras el video suena, un deslizador de volumen (inicia en 80 %, compartido entre videos). Solo un video puede sonar a la vez: activar uno silencia el anterior. Al cerrar la ficha todo vuelve a silencio.
- En iPhone/iPad Safari no permite cambiar `volume` desde la página (se controla con los botones físicos); el deslizador no tiene efecto ahí, pero silenciar y reiniciar sí funcionan.
- `ratio` define la proporción del video (`"9 / 16"` para reels). Sin él se usa 3:4. El ancho máximo es 360 px y nunca más de 40vh, para que un reel quepa en pantallas bajas.
- `speed` ajusta la velocidad sin recodificar; el carrusel de Manu usa `1.5`. No conviene en videos con voz.
- Comprimir antes de subir (H.264, `faststart`). Sin audio, ~720 px:
  `ffmpeg -i original.mp4 -an -vf "scale=720:-2" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart video.mp4`
  Reels con audio (como Supérate), 540 px y audio mono liviano:
  `ffmpeg -i original.mp4 -vf "scale=540:-2" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -c:a aac -b:a 64k -ac 1 -movflags +faststart video.mp4`
  Póster: `ffmpeg -ss 1.5 -i original.mp4 -frames:v 1 -vf "scale=540:-2" -q:v 7 poster.jpg`.
- Carrusel de Editorial Manu: de 4.8 MB a 604 KB. Seis reels de Supérate: de ~52 MB a ~21 MB (2.2 a 6 MB cada uno).
- Freno a descargas: menú contextual desactivado y `controlslist="nodownload"`. Es solo disuasivo (cualquier archivo público se puede descargar); la protección real es el rate limit del firewall.

## Firewall (rate limit de videos)

- Regla "Rate limit videos" en Vercel: rutas que terminan en `.mp4`, 120 peticiones por IP cada 60 s. Una visita normal que ve los 6 reels hace ~20 peticiones (el navegador pide por rangos).
- Estado: preparada en modo `log` (solo registra, no bloquea). Para activarla: `vercel firewall publish --yes`.
- Plan: revisar el tráfico unos días en el panel de Firewall de Vercel; si no hay falsos positivos, cambiar la acción a `deny` (o `rate_limit`). El tráfico bloqueado por el firewall no se cobra.
- Tráfico: el plan gratuito de Vercel incluye 100 GB/mes; si se supera, pausa el proyecto en lugar de cobrar.

## Configuración pendiente

- `contact.web3formsKey`: crear una clave gratuita en https://web3forms.com con el correo de Lourdes y pegarla aquí. Mientras esté vacía, el formulario muestra "disponible muy pronto" y el botón queda deshabilitado. La clave es pública por diseño; Web3Forms solo envía al correo asociado.
- `contact.email` y `contact.whatsapp` (formato internacional, por ejemplo `50370000000`): opcionales, se muestran como enlaces directos.
- Fotos sin fondo en `public/profile/`: `lourdes-perfil.webp` (inicio, `profile.photo`) y `lourdes-contacto.png` (contacto, `contact.photo`). Se muestran sin marco ni recorte. Son de unos 420 px de ancho; si se reemplazan por versiones más grandes se verán más nítidas en pantallas retina. Si `profile.photo` queda vacío, se muestra un monograma.
- Editorial Manu: `driveUrl`. Los archivos actuales están en `public/projects/editorial-manu/` (imagotipo, separadores, camisetas, video del carrusel y su póster).
- ¡Supérate! Raíces: `driveUrl`. Archivos en `public/projects/superate/` (logo, 6 reels y sus pósters). Las descripciones de cada video se pueden afinar con Lourdes.
- Conectar el repositorio en Vercel (Add New Project, importar `VReyna7/portafolio_lou`). `vercel.json` ya define build y salida.

## Riesgos y casos borde

- Un JSON mal formado (coma faltante) deja el sitio en "Cargando portafolio...". Validar el archivo antes de hacer push (por ejemplo, con el editor o jsonlint).
- Web3Forms gratuito tiene un límite mensual de envíos; suficiente para un portafolio personal.
- El `slug` debe ser único porque se usa como clave de la galería.
- GSAP suma unos 125 kB al paquete inicial (462 kB en total). El aviso de Angular salta en 500 kB; si se agregan más librerías, conviene cargar GSAP en diferido.
