# Sección de diplomados (certificaciones)

## Resumen

Sección final del sitio, debajo de Contacto, para mostrar los diplomados de Lourdes. Es la de menor peso visual: banda de fondo suave (`--paper`), centrada y compacta. Son pocas piezas (2 diplomas en imagen), así que se muestran como papeles sobre una mesa en lugar de una lista o una cinta en movimiento (con 2 piezas la cinta se vería repetitiva).

## Comportamiento

- Los diplomas reposan inclinados en sentidos opuestos (-4° y 3°) con sombra suave.
- Al entrar en pantalla caen desde arriba girando hasta su lugar (GSAP + ScrollTrigger, `back.out`, una sola vez).
- Al pasar el mouse (o con foco de teclado) se enderezan y se acercan un poco.
- Clic: se abren en grande en un `<dialog>` nativo para poder leerlos; se cierra con la X, clic fuera o Escape.
- Con "reducir movimiento" no hay caída ni transiciones.
- Sin imagen (`image` vacío) se dibuja una maqueta de diploma con el nombre e institución, útil como boceto.

## Archivos

- `src/app/components/certifications/` (componente `Certifications`).
- `src/app/models/site-content.ts`: `Certification`, `CertificationsSection` y `SiteContent.certifications` (opcional).
- `src/app/app.html` / `app.ts`: se monta después de `app-contact` solo si hay elementos.
- `public/content/site.json`: bloque `certifications`.

## Datos (`site.json`)

| Campo | Uso |
| --- | --- |
| `certifications.title` | Título de la sección ("Diplomados"). |
| `certifications.description` | Línea corta debajo del título. Vacío la oculta. |
| `items[].title` | Nombre del diplomado. |
| `items[].issuer` | Institución. |
| `items[].year` | Opcional. |
| `items[].image` | Imagen del diploma en `public/certifications/`, por ejemplo `certifications/diplomado-1.jpg`. Vacío muestra la maqueta. |

Si se elimina el bloque `certifications` o queda sin `items`, la sección no se muestra.

## Decisiones técnicas

- La inclinación de reposo usa la propiedad CSS `rotate` sobre el papel, y GSAP anima el `<li>` contenedor: así la animación de entrada y el hover no compiten por `transform`.
- Visor propio y simple (no se reutiliza `ProjectDetail`, que está pensado para proyectos con pasos y videos).
- Imágenes con `loading="lazy"`: al ser la última sección, no afectan la carga inicial.

## Contenido actual

- `certifications/meta-marketing-digital.jpg`: Ruta de aprendizaje sobre Marketing Digital con herramientas de Meta (Meta y Ministerio de Economía, 2024). 63 KB.
- `certifications/udb-casas.jpg`: Certificación de inglés CASAS, puntaje 232 (Universidad Don Bosco, 2026). 70 KB.
- Ambas convertidas de PNG a JPG calidad 80 a 1024 px de ancho; bajar más la calidad hace ilegible el texto en el visor.

## Pendiente

- Nada obligatorio. Para agregar otro diploma: guardar la imagen comprimida en `public/certifications/` y sumar un elemento a `items`.

## Riesgos y casos borde

- Diplomas en formato vertical: la maqueta asume horizontal (1.414:1); con imagen real se respeta su proporción.
- Escaneos muy pesados harían lenta la apertura del visor; por eso conviene comprimirlos.
- Datos personales visibles en el diploma (por ejemplo, número de documento): revisar antes de publicar.
