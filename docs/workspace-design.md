---
name: TRASU workspace
description: Extensión institucional del espacio de trabajo existente
colors:
  primary: "#124b82"
  primary-focus: "#1762a6"
  navigation: "#102f4b"
  navigation-text: "#d0e0ee"
  text: "#17212b"
  text-secondary: "#536574"
  surface: "#ffffff"
  canvas: "#f4f6f8"
typography:
  headline:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: 1.45
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
---

# TRASU — extensión visual del espacio de trabajo

## Overview

Modo Operate: precisión, consistencia y orientación voluntaria. Extiende la
identidad original, no crea una marca ni una plantilla comercial. La portada
y el acceso mantienen su composición previa. Fuente: `src/workspace.css` y
componentes existentes; no sustituye el documento base `../DESIGN.md`.

## Colors

Azul profundo diferencia navegación de trabajo. Azul institucional identifica
acción y selección; verde, ámbar y rojo mantienen estados semánticos existentes.
No utilizar color como única señal.

## Typography

Una sola familia: Source Sans 3. Título principal 2rem; 1.75rem en pantallas
estrechas. Cuerpo 15px; controles 14px y datos auxiliares 12–13px. Referencias y
recuentos con cifras tabulares. No introducir tipografía decorativa.

## Layout

Cabecera existente de 68px, navegación de 248px y contenido flexible. Espacio de
página de 28px/32px en escritorio y 22px/16px en móvil. Filtros envuelven al faltar
espacio; tablas mantienen región de desplazamiento con nombre accesible. El
encabezado de detalle se apila en móvil para no estrechar la referencia.

## Elevation & Depth

Paneles planos con borde fino. Sombra solo donde hay superposición transitoria,
como el menú de estados simulados. El acompañante pertenece al flujo: no es
flotante ni tapa acciones.

## Shapes

Conservar radios de 6, 10 y 14px de la base. Botones de trabajo con altura mínima
de 40px; navegación de 48px. Sin esquinas, sombras o contenedores paralelos.

## Components

- Navegación: texto azul claro sobre fondo profundo; selección azul pálido con
  texto oscuro. En móvil se oculta también de la navegación de teclado al cerrar.
- Ayuda: entrada consistente en cabecera; acceso secundario en navegación.
- Cada pantalla tiene una entrada compacta «Explorar esta pantalla». Su recorrido
  local solo se expande al elegirlo y se adapta a elementos realmente disponibles.
- Guía: activación explícita, un paso, pausa, cierre e indicaciones ampliables.
  «Mostrar en pantalla» enfoca sin pulsar. Resaltado de 2px y foco de 3px.
- Simulaciones: error y vacío recogidos en un desplegable de demostración.
- Formulario: etiqueta independiente del error; `aria-describedby` asocia la
  explicación sin convertirla en parte del nombre del campo.
- Diálogo: nativo; vuelve al control original si conserva identidad y disponibilidad,
  o al encabezado cuando el resultado ya retiró ese control.

## Do's and Don'ts

- Mantener contraste y foco visible, también en colores forzados.
- Respetar movimiento reducido; no añadir animaciones de entrada al trabajo.
- No repetir ayudas debajo de cada acción de tabla.
- No marcar una operación como realizada por avanzar en la guía.
- No canonizar las etiquetas superiores repetidas de módulos heredados: su
  presencia remanente no constituye una regla para nuevas pantallas.
