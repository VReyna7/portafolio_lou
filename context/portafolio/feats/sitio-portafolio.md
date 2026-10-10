# Sitio portafolio de Lourdes Portales

## Resumen

Sitio estático en Angular 20 para la marca personal de Lourdes Portales (marketing, estrategia digital, branding y contenido audiovisual). Se despliega en Vercel automáticamente con cada push a `main` en `github.com/VReyna7/portafolio_lou`.

La marca del sitio es Lourdes. Los proyectos (por ejemplo, Editorial Manu) son trabajos que ella realizó y solo se exhiben. El formulario de contacto es para que marcas o personas la contacten a ella.

## Secciones

| Sección | Componente | Fuente en `site.json` |
| --- | --- | --- |
| Inicio | `src/app/components/hero` | `profile` |
| Herramientas | `src/app/components/tools` | `tools` |
| Proyectos | `src/app/components/projects` | `projects` |
| Contacto | `src/app/components/contact` | `contact` |

## Decisiones técnicas

- Todo el contenido vive en `public/content/site.json` y se carga en tiempo de ejecución con `ContentService`. Cambiar textos o agregar proyectos no requiere tocar código.
- Sin backend: el formulario envía a Web3Forms, que reenvía el mensaje al correo de Lourdes.
- Los proyectos se abren en un `<dialog>` nativo dentro de la misma página (sin rutas por proyecto). El detalle no tiene formulario ni correo.
- Las herramientas se muestran con siglas, no con logos oficiales, para no usar marcas registradas.
- Animaciones con GSAP (ver sección Animaciones).
- Angular 20 en lugar de la versión más reciente porque el Node local es 22.16 y las versiones nuevas de la CLI piden Node 22.22 o superior.

## Animaciones

- `src/app/animations/gsap.ts`: registra ScrollTrigger y SplitText una sola vez y expone `prefersReducedMotion()`. Si el sistema pide menos movimiento, no se anima nada.
- `src/app/animations/reveal.directive.ts`: directiva `appReveal` que hace aparecer una sección al entrar en pantalla. Recibe un selector para escalonar sus hijos, por ejemplo `appReveal=".section__title, .card"`. Los proyectos nuevos la heredan sin cambios.
- Inicio: línea de tiempo de entrada; el eslogan va en cursiva, a todo el ancho debajo de la foto y del resumen, y se revela palabra por palabra.
- Proyecto: la ventana entra con escala y desplazamiento, luego su contenido en cascada. Al cerrar (botón, clic fuera o Escape) sale animada antes de cerrarse.
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
| `summary` | Una o dos líneas para la tarjeta. |
| `period` | Duración. |
| `role` | Qué hizo Lourdes. |
| `team` | Lista de integrantes. Dejar `[]` si fue individual. |
| `objective`, `description`, `justification` | Textos del detalle. |
| `driveUrl` | Enlace a más material. Vacío oculta el botón. |
| `accent` | Color de la tarjeta en hexadecimal (`#8a1f2b`). |
| `evidence` | Lista de `title`, `description` e `image`. |

4. Para imágenes, guardarlas en `public/projects/<slug>/` y referenciarlas como `projects/<slug>/archivo.jpg`. Si `image` está vacío se muestra un bloque de color con el título.
5. Commit y push a `main`. Vercel publica en uno o dos minutos.

## Configuración pendiente

- `contact.web3formsKey`: crear una clave gratuita en https://web3forms.com con el correo de Lourdes y pegarla aquí. Mientras esté vacía, el formulario muestra "disponible muy pronto" y el botón queda deshabilitado. La clave es pública por diseño; Web3Forms solo envía al correo asociado.
- `contact.email` y `contact.whatsapp` (formato internacional, por ejemplo `50370000000`): opcionales, se muestran como enlaces directos.
- `profile.photo`: guardar la foto en `public/profile/lourdes.jpg` y poner `profile/lourdes.jpg`. Sin foto se muestra un monograma.
- Imágenes de evidencias de Editorial Manu y `driveUrl`.
- Conectar el repositorio en Vercel (Add New Project, importar `VReyna7/portafolio_lou`). `vercel.json` ya define build y salida.

## Riesgos y casos borde

- Un JSON mal formado (coma faltante) deja el sitio en "Cargando portafolio...". Validar el archivo antes de hacer push (por ejemplo, con el editor o jsonlint).
- Web3Forms gratuito tiene un límite mensual de envíos; suficiente para un portafolio personal.
- El `slug` debe ser único porque se usa como clave de la galería.
- GSAP suma unos 125 kB al paquete inicial (462 kB en total). El aviso de Angular salta en 500 kB; si se agregan más librerías, conviene cargar GSAP en diferido.
