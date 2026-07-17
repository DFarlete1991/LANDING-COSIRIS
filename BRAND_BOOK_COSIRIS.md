# Brand Book: Cosiris

## 1. Misión y Personalidad (basado en el copy actual)

### Misión percibida en producto y copy

Cosiris se posiciona como un partner de crecimiento para inmobiliarias y propietarios que necesitan un sistema digital de captación, no acciones aisladas.

Ejes de misión detectados en el copy:

- Captación predecible y sistematizada: "La captación es un sistema".
- Especialización vertical: foco explícito en sector inmobiliario.
- Digitalización con resultados de negocio: lead cualificado, seguimiento, automatización y cierre.
- Cercanía operativa: "Te contactamos en menos de 24 h", "sin compromiso", "sin permanencia".

### Personalidad de marca

Rasgos dominantes:

- Estratégica y técnica: habla de sistema, proceso, embudo, cualificación, automatización, IA.
- Cercana y directa: segunda persona, frases cortas, promesas concretas.
- Pragmática y orientada a resultados: "clientes reales, resultados reales", "estrategia, sistema y resultados".
- Transparente: rechazo explícito de "fórmulas mágicas" y lenguaje "sin filtros".

Tono verbal recomendado (consistente con el código actual):

- Claro, accionable y con verbo de movimiento: empezar, solicitar, captar, digitalizar.
- Mezcla de autoridad + proximidad.
- Enfocado en dolor real del usuario inmobiliario (captación, tiempo, seguimiento).

## 2. Logotipo (uso correcto y rutas de assets)

### Assets detectados

Ubicación de marca:

- public/assets/logo_orange.png
- public/assets/logo_white.png
- public/assets/logo_black.png

Uso real en la interfaz:

- logo_orange.png en navegación principal, navegación de formularios y footer.
- logo_orange.png también como favicon.

### Reglas de uso

- Fondo claro: usar logo_orange.png (es el estándar actual).
- Fondo oscuro: usar logo_white.png para mejorar contraste.
- Versiones monocromas o impresas: usar logo_black.png sobre fondos muy claros.
- Mantener proporción original: siempre con ancho automático (w-auto) y altura controlada (h-9, h-10, h-11 según contexto).
- Evitar aplicar sombras, filtros o deformaciones sobre el logotipo.

### Tamaños de referencia observados

- Header desktop/mobile: h-9 a h-11.
- Navbar principal y footer: h-10.
- Favicon: logo_orange.png.

## 3. Paleta de Colores

### Colores de sistema (Tailwind + CSS variables)

| Rol | Hex | RGB | Uso sugerido |
|---|---|---|---|
| Primary | #FF8000 | rgb(255, 128, 0) | CTA principal, badges de acción, acentos de conversión |
| Primary Hover | #E67300 | rgb(230, 115, 0) | Hover/active de CTA principal |
| Foreground / Ink | #0F172A | rgb(15, 23, 42) | Titulares, texto principal, iconos base |
| Background | #FFFFFF | rgb(255, 255, 255) | Fondo principal |
| Secondary | #F1F5F9 | rgb(241, 245, 249) | Botones secundarios, superficies suaves |
| Accent | #F8FAFC | rgb(248, 250, 252) | Fondos de apoyo, estados hover sutiles |
| Border / Input | #E2E8F0 | rgb(226, 232, 240) | Bordes de inputs, cards y contenedores |
| Ink Muted | #64748B | rgb(100, 116, 139) | Texto secundario y metadata |
| Ink Faint | #CBD5E1 | rgb(203, 213, 225) | Líneas, separadores, decorativo |
| Dot | #D1D5DB | rgb(209, 213, 219) | Patrones puntuales y texturas |
| Destructive | #DC2626 | rgb(220, 38, 38) | Errores, estados destructivos |
| Surface | #FAFAFA | rgb(250, 250, 250) | Bloques de contenido y cards suaves |

### Variantes de acento detectadas en uso directo

| Hex | RGB | Uso actual |
|---|---|---|
| #FF8A00 | rgb(255, 138, 0) | CTA destacado en sección autoridad |
| #FF9533 | rgb(255, 149, 51) | Hover de CTA en sección evolución |
| #FF4D00 | rgb(255, 77, 0) | Gradiente de timeline/evolución |
| #FF0000 | rgb(255, 0, 0) | CTA puntual de YouTube en página gracias |

### Criterio de aplicación

- Orange-first: el naranja es el color de conversión, no de decoración masiva.
- Texto largo y títulos en escala slate/ink.
- Fondos muy limpios (blanco, slate-50, negro) para maximizar contraste del naranja.
- Mantener consistencia: priorizar #FF8000 + #E67300 frente a múltiples variantes naranjas en nuevos desarrollos.

## 4. Tipografía

### Stack tipográfico real

- Primaria: Montserrat.
- Fallbacks: Inter, system-ui, sans-serif.
- Carga: Google Fonts (Montserrat 400, 500, 600, 700, 800, 900).

### Pesos observados

- 400: texto largo y descriptivo.
- 500/600: subtítulos, chips y labels.
- 700/800/900: titulares, métricas y CTA.

### Parámetros de legibilidad global

- Render optimizado: optimizeLegibility.
- Suavizado de fuente: antialiased en html y layouts principales.
- Headings base: line-height 1.1, letter-spacing negativo ligero.

### Escala tipográfica H1-H6 y Body (derivada del uso real)

| Nivel | Clase/tamaño frecuente | Uso actual |
|---|---|---|
| H1 | text-4xl a text-6xl (mobile a desktop) | Hero principales y cabeceras de página |
| H2 | text-2xl a text-5xl | Secciones clave y módulos de servicio |
| H3 | text-xl a text-2xl | Cards, bloques intermedios, subtítulos fuertes |
| H4 | text-lg a text-xl | Subbloques y encabezados de formulario |
| H5 | text-base a text-lg | Uso limitado; recomendado para microsecciones |
| H6 | text-sm a text-base | Etiquetas y encabezados menores |
| Body | text-sm a text-base (ocasional text-lg) | Copy funcional, párrafos y FAQ |

Notas:

- H5 y H6 no tienen un patrón semántico fuerte en todo el código; conviene normalizar su uso en nuevas páginas.
- La marca usa tracking alto en etiquetas uppercase (badges, labels, microcopy de categoría).

## 5. Sistema de Grilla y Espaciado

### Grilla y contenedores

Patrones de layout recurrentes:

- Contenedor principal por sección: max-w-4xl, max-w-5xl, max-w-6xl, max-w-7xl.
- Estructura responsive basada en utilidades Tailwind (sm, md, lg).
- Secciones en grid 1/2/3 columnas según tipo de contenido.
- Uso frecuente de centrado con mx-auto + padding horizontal px-4 o px-6.

### Spacing tokens detectados

Extensiones en configuración:

- spacing 18 = 4.5rem
- spacing 22 = 5.5rem
- spacing 4xl = 56rem
- spacing 5xl = 64rem

Patrones de ritmo vertical observados:

- Secciones: py-16, py-20, py-24, py-28, py-36.
- Bloques internos: p-4, p-6, p-8, p-10.
- CTAs y controles: py-3, py-3.5, py-4, py-5.
- Gaps frecuentes: gap-2, gap-3, gap-4, gap-6, gap-8, gap-10.

### Principios de composición actuales

- Alto uso de tarjetas con bordes suaves y sombra ligera.
- Separadores horizontales y líneas verticales como guía visual.
- Dot-grid y gradientes sutiles para profundidad sin saturar.

## 6. Guía de Componentes (estilos base para UI)

### Botones

Base oficial (componente reusable):

- Variantes: default, destructive, outline, secondary, ghost, link.
- Tamaños: default, sm, lg, icon.
- Accesibilidad: focus-visible con ring configurado.

Patrón de CTA de negocio (muy repetido fuera del componente base):

- Fondo #FF8000.
- Texto blanco, bold, frecuentemente uppercase.
- Hover #E67300.
- Bordes redondeados md.
- Sombra cálida en botones de alto impacto.

### Inputs y formularios

Base recurrente (modales y forms):

- Fondo slate-50.
- Borde slate-200.
- Radio rounded-md.
- Texto sm medium.
- Focus ring naranja con opacidad suave.
- Estado error en rojo con mensaje text-xs.

Patrones avanzados:

- Autocomplete de provincia y dirección con dropdown flotante.
- Selección de servicios y empleados con chips/botones toggle.
- Validación client-side antes de envío.

### Cards

Patrón dominante:

- Fondo blanco o slate-50.
- Border slate-100/200.
- Radius xl o 2xl.
- Sombra ligera con incremento en hover.
- Microinteracción hover: elevación y/o cambio de borde hacia naranja.

### Navegación

- Header sticky con blur y transparencia en scroll.
- Menú desktop con enlaces tipo ghost + CTA Empezar.
- Menú mobile fullscreen con acciones prioritarias al final.

### Modales y overlays

- Backdrop oscuro con blur.
- Panel centrado con radius xl, border suave y sombra profunda.
- Cierre por tecla Escape y click en backdrop (cuando corresponde).

### Motion system

- Uso combinado de motion/react y framer-motion.
- Curva recurrente: cubic-bezier (0.19, 1, 0.22, 1).
- Entradas por fade + y-offset + blur.
- Jerarquía de delays para narrativas de sección.

## 7. Reglas de Implementación (futuros desarrollos)

### Reglas de diseño

- Mantener Montserrat como fuente primaria para continuidad de marca.
- Usar #FF8000 como color de acción principal y #E67300 para hover.
- Priorizar tokens definidos en Tailwind antes que hex hardcodeados.
- Mantener estética limpia: superficies claras, alto contraste y acento cálido.
- Conservar el patrón de cards con bordes suaves y microelevación.

### Reglas de contenido

- Voz: estratégica, clara y cercana.
- Evitar claims abstractos; priorizar resultado tangible y tiempo de respuesta.
- Mantener lenguaje sectorial inmobiliario (captación, leads, zona, valoración, digitalización).

### Reglas de componentes

- Reutilizar el componente Button base en nuevas vistas para evitar divergencias visuales.
- Extraer clases repetidas de input/CTA a utilidades compartidas cuando se creen nuevos formularios.
- Conservar estados completos: hover, focus-visible, disabled, error y loading.

### Reglas técnicas

- Unificar progresivamente animaciones en una sola librería para reducir complejidad (actualmente conviven motion/react y framer-motion).
- Reducir variaciones de naranja no tokenizadas (#FF8A00, #FF9533, etc.) salvo casos justificados.
- Mantener navegación interna consistente con pushState + dispatch popstate en rutas SPA.

### Checklist obligatorio para nuevas páginas

- Definir hero con propuesta de valor clara en 1-2 frases.
- Incluir CTA primario naranja visible above the fold.
- Mantener contenedor max-width coherente con el resto del sitio.
- Aplicar tokens de color y tipografía existentes.
- Validar accesibilidad mínima: foco visible, contraste y labels de formulario.

## Fuentes auditadas (código)

- tailwind.config.js
- src/index.css
- index.html
- src/components/ui/button.tsx
- src/components/pages/landing-navbar.tsx
- src/components/Footer.tsx
- src/components/ContactModal.tsx
- src/components/pages/ServiciosPage.tsx
- src/components/pages/NosotrosPage.tsx
- src/components/pages/VenderPage.tsx
- src/components/pages/ValoracionPage.tsx
- src/components/ui/hero-1.tsx
- src/components/ui/hero-title.tsx
- src/components/ui/difference-section.tsx
- src/components/ui/evolution-section.tsx
- src/components/ui/shared-landing-sections.tsx
- src/components/ui/valoracion-blocks.tsx
- src/components/ui/form-navbar.tsx
- public/assets/logo_orange.png
- public/assets/logo_white.png
- public/assets/logo_black.png