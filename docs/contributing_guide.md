# Guía de Contribución - RetroCheck 95

¡Gracias por querer contribuir a **RetroCheck 95**! Para mantener la coherencia técnica y visual del proyecto, sigue estas directrices al desarrollar nuevas funciones.

---

## 🎨 Directrices de Diseño (Windows 95 Aesthetics)

Para lograr el "efecto Windows 95", todos los nuevos componentes de interfaz deben respetar el sistema de diseño establecido en `index.css`:

1. **Colores Estrictos**:
   - Fondo de escritorio: `#008080` (Teal/Verde Azulado de Windows 95).
   - Fondo de ventanas y controles: `#c0c0c0` (Gris claro de Windows).
   - Texto: Negro (`#000000`) o Gris Oscuro (`#808080`) para estados deshabilitados.
   - Barra de títulos activa: `#000080` (Azul oscuro) con letras blancas en negrita.
   - Barra de títulos inactiva: `#808080` (Gris medio) con letras gris claro.

2. **Bordes Biselados (Efecto 3D)**:
   - Las ventanas y botones sobresalen de la pantalla utilizando sombras con colores complementarios.
   - **Borde saliente (Botones y tarjetas)**: Borde superior/izquierdo blanco y gris claro, borde inferior/derecho gris oscuro y negro.
   - **Borde hundido (Campos de entrada y áreas de texto)**: Borde superior/izquierdo gris oscuro y negro, borde inferior/derecho blanco y gris claro.
   - Evitar bordes redondeados (`border-radius: 0` en todos los elementos).

3. **Tipografía**:
   - Usar tipografía tipo Sans-Serif estricta (por ejemplo, `MS Sans Serif`, `Tahoma`, `Arial`).
   - El tamaño de fuente base debe ser de `12px` o `14px` para mantener la escala clásica de resolución de pantalla pequeña de la época (p. ej., 800x600).

---

## 💻 Pautas de Desarrollo del Código

### Backend (Express)
- Escribe código modular. Mantener la lógica de negocio en helpers separados cuando sea posible.
- **Acceso a Archivos JSON**: Utiliza operaciones síncronas (`fs.writeFileSync`, `fs.readFileSync`) o maneja adecuadamente las promesas con bloqueos de archivos en operaciones críticas para prevenir la corrupción de datos JSON bajo concurrencia.
- Los endpoints de la API deben retornar respuestas consistentes en JSON:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
  O en caso de error:
  ```json
  {
    "success": false,
    "error": "Mensaje explicativo del error"
  }
  ```

### Frontend (React)
- **CSS Vanilla**: No uses frameworks CSS como Tailwind, Bootstrap o Sass. Toda la personalización de estilos debe residir en `src/index.css`.
- **Estados en Ventanas**: Las ventanas del escritorio son administradas por el estado global de `Desktop.jsx` (lista de ventanas abiertas, z-index, estado minimizado).
- Usa componentes funcionales y Hooks de React de forma limpia y declarativa.
- **Estructura semántica**: Utiliza elementos HTML clásicos como `<button>`, `<fieldset>`, `<legend>`, `<select>`, `<table>` y `<label>` para garantizar que las clases CSS de estilo retro se apliquen correctamente a los elementos nativos.
