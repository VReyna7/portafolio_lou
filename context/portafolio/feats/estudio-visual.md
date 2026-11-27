# Estudio visual (`/estudio`)

Rediseño del panel de edición. Vive solo en la rama `dev`; `main` conserva el formulario anterior.

## Resumen

El panel pasa de un formulario largo a un editor con vista previa en vivo, al estilo Wix:

- La vista previa renderiza los componentes reales del sitio (`app-projects`, `app-certifications`, `app-experience`) con el borrador, así que cada cambio se ve al instante.
- Tocar una tarjeta de la vista previa abre su edición. En celular es un panel inferior (bottom sheet) con tres tamaños; en escritorio (>= 960px) es una columna lateral.
- Pensado primero para celular (Lourdes lo usa instalado como app).

La API no cambia: `GET/PUT /api/content`, `/api/auth/*`, `/api/media`.

## Flujo de uso

1. Entrar con enlace al correo (pantalla de acceso con pasos y confirmación animada).
2. Ver el sitio con sus cambios. Pestañas Proyectos / Diplomados / Experiencia hacen scroll a cada sección.
3. Tocar una tarjeta (o "Agregar") y editar en el panel. Los campos se agrupan en pestañas cortas.
4. Guardar. El estado "Sin guardar / Todo guardado" siempre está visible.
5. Quitar algo muestra "Deshacer" en lugar de un `window.confirm`.

## Pasos de implementación

1. `store.ts`: `StudioStore` (provisto por `Editor`) con borrador, selección, CRUD genérico por tipo (proyecto, diploma, experiencia), deshacer y subida de archivos.
2. `studio-preview`: vista previa, clic capturado para seleccionar, decoración accesible, botones "Agregar" y editar sección.
3. `studio-sheet`: panel con encabezado (mover, quitar, cerrar, tamaño) y formularios por tipo.
4. Formularios: `project-form` (Datos, Evidencias, Estilo), `diploma-form`, `job-form`, `section-form`.
5. Utilidades de UI: `ui-icon`, `file-field` (zona de subida con previsualización), `fields.css` (estilos de campos compartidos), `dom.ts`.
6. `editor.ts/html/css`: autenticación, guardado, barra superior, pestañas, avisos y primer recorrido.

## Archivos afectados

Nuevos en `src/app/editor/`: `store.ts`, `dom.ts`, `ui-icon.ts`, `file-field.*`, `fields.css`, `gate.css` (pantalla de acceso, separada de `editor.css` por el presupuesto de estilos), `studio-preview.*`, `studio-sheet.*`, `studio-toasts.*` (avisos, deshacer y confirmación de salida), `project-form.*`, `diploma-form.ts`, `job-form.ts`, `section-form.ts`.

Modificados:

- `src/app/editor/editor.ts`, `editor.html`, `editor.css`
- `src/app/animations/gsap.ts`: `setPreviewMode()` y `systemReducedMotion()`.
- `src/app/components/projects/projects.html`, `certifications/certifications.html`, `experience/experience.html`: atributos `data-edit` y `data-index` (inertes en el sitio público); `track $index` en diplomas.

## Decisiones técnicas

- **Componentes reales en la vista previa** en lugar de maquetas: lo que se ve es lo que se publica, sin mantener dos diseños.
- **Animaciones del sitio apagadas en el editor** con `setPreviewMode(true)`: ScrollTrigger usa `window` como scroller y la vista previa hace scroll en su propio contenedor, lo que dejaría las tarjetas ocultas.
- **Clic en fase de captura** sobre la vista previa: detiene el clic antes de que el componente abra su modal y selecciona el elemento.
- **Store por componente** (`providers` en `Editor`) en vez de servicio global: se destruye al salir de `/estudio`.
- **Deshacer de un nivel** con instantánea del borrador; se descarta con cualquier otra edición.
- **Accesibilidad**: botones reales, `aria-label` en iconos, `aria-live` en avisos, foco al panel cuando se abre con teclado, `prefers-reduced-motion` respetado, campos de 16px (evita zoom en iOS), objetivos táctiles >= 44px.
- **Sin dependencias nuevas**: iconos SVG locales, GSAP ya instalado.

## Pendientes

- Arrastrar para reordenar (hoy: botones "Mover antes / después").
- Editar el hero, herramientas y contacto desde el panel (la API solo acepta proyectos, diplomados y experiencia).
- Redimensionar fotos en el navegador antes de subir.

## Riesgos y casos límite

- Los estilos de `.section` se compactan en la vista previa; el espaciado final del sitio es un poco mayor.
- Cambiar el título de un proyecto cambia su `slug` mientras sea automático; la tarjeta se vuelve a crear (se re-aplica la selección).
- Un borrador inválido en el overlay sigue bloqueando la edición (comportamiento original).
- El panel lateral cubre parte de la vista previa en celular; el scroll compensa con `padding-bottom` según el tamaño del panel.
- Probar en Safari iOS: `100dvh`, `inert` y `setPointerCapture`.
