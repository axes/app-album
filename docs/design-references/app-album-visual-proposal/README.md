# App Álbum — Visual Proposal Reference

Esta carpeta contiene referencias visuales externas utilizadas para definir y validar la línea gráfica de App Álbum.

## Archivos esperados

- `reference.html`
- `reference-light.png`
- `reference-dark.png`

## Propósito

Estos archivos son snapshots históricos de referencia visual.

No forman parte del código productivo, no representan la paleta productiva vigente y no deben usarse directamente como implementación ni como fuente de tokens.

La fuente manual única de color es `scripts/ui-tokens.ts`. La referencia vigente de la paleta productiva Albaricoque Mora queda documentada en:

- `docs/UI_STYLE_GUIDE.md`

y reflejada en:

- `/dev/ui`;
- el export generado por `npm run ui:export` bajo `artifacts/ui-reference/`;
- `src/styles/tokens.css`, artefacto productivo generado y verificado byte por byte.

## Uso

Para trabajos de diseño y revisión visual, estas referencias pueden usarse como objetivo de comparación para:

- paleta;
- tipografía;
- radios;
- sombras;
- densidad;
- componentes;
- estados;
- layout;
- navegación;
- motion.

## Estado desde UI-07A

Las referencias de esta carpeta permanecen deliberadamente sin modificar para conservar el contexto histórico. UI-07A adopta Albaricoque Mora mediante tokens semánticos centralizados; cualquier validación actual debe realizarse contra `/dev/ui`, el export portable y `docs/UI_STYLE_GUIDE.md`, no contra los colores incrustados en estos snapshots.

La revisión visual manual de light/dark y breakpoints continúa pendiente cuando no existe navegador disponible en el entorno de validación.
