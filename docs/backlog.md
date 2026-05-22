# Backlog del Producto - RetroCheck 95

Este es el backlog con las tareas y requerimientos para el desarrollo de RetroCheck 95, categorizado por prioridad e indicando su estado.

---

## 🔴 Alta Prioridad (Críticos para el MVP)

- [ ] **Configurar Entorno Base (Raíz, Backend, Frontend)**
  - Crear estructura de carpetas, instalar dependencias iniciales (`express`, `cors`, `concurrently`, `qrcode.react`, etc.).
  - Configurar scripts concurrentes en el root para `npm start` / `npm run dev`.
  - *Estado*: Pendiente
- [ ] **Manejador de Datos JSON en Backend**
  - Implementar funciones de lectura/escritura seguras para `classes.json`, `users.json`, `sessions.json` y `attendance.json`.
  - Crear datos mock iniciales.
  - *Estado*: Pendiente
- [ ] **Detección de IP Local Dinámica**
  - Desarrollar módulo Node para obtener la dirección IPv4 del adaptador de red activo.
  - *Estado*: Pendiente
- [ ] **Diseño del Sistema CSS de Windows 95 (Temas Soportados)**
  - Definir la paleta de colores oficial mediante Variables CSS para soportar temas.
  - Implementar bordes biselados 3D y tipografía MS Sans Serif.
  - Agregar botones, checkboxes y scrollbars retro.
  - *Estado*: Pendiente
- [ ] **Esquema de Colores: Modo Claro / Modo Oscuro**
  - Crear estilos para el tema "Windows Standard" (Claro) y "Windows Dark Slate" (Oscuro).
  - Persistencia del esquema seleccionado en `localStorage`.
  - *Estado*: Pendiente
- [ ] **Ventana de Propiedades de Pantalla (Display Properties)**
  - Desarrollar la ventana de configuración visual para seleccionar el esquema de colores de fondo, emulando la interfaz clásica de Windows 95.
  - *Estado*: Pendiente
- [ ] **Componente de Pantalla de Login de Windows 95**
  - Interfaz de diálogo de inicio de sesión clásico de Windows 95.
  - Validar credenciales simuladas contra `users.json`.
  - *Estado*: Pendiente
- [ ] **Componente Window.jsx Arrastrable**
  - Desarrollar la estructura clásica de una ventana de Windows 95.
  - Añadir soporte para arrastrar la ventana mediante su barra de título (drag and drop).
  - Gestionar controles de minimizar, maximizar y cerrar.
  - *Estado*: Pendiente
- [ ] **Flujo de Check-in de Estudiantes (QR & Netscape)**
  - Interfaz del estudiante con estilo retro de Netscape.
  - Formulario que valide el ID del estudiante y registre la asistencia en la sesión activa.
  - Prevención de registros duplicados en el backend y frontend (localStorage).
  - *Estado*: Pendiente
- [ ] **Consulta de Historial del Estudiante**
  - Interfaz en el portal del estudiante para consultar sus asistencias y faltas por clase.
  - Mostrar tabla de récords de asistencia detallada y porcentaje de asistencia acumulado por materia.
  - *Estado*: Pendiente

---

## 🟡 Prioridad Media (Completitud de Funciones)

- [ ] **Mapeo de Escritorio y Taskbar por Rol**
  - Barra de tareas inferior fija con botón "Inicio", Start Menu adaptado por rol y reloj.
  - Doble clic en iconos del escritorio y clic derecho en escritorio para abrir Propiedades.
  - *Estado*: Pendiente
- [ ] **Panel de Administrador (Visión Global)**
  - Cuadrícula con KPIs del sistema (total de clases, total de profesores, total de alumnos, tasa de asistencia global).
  - Gráficos 3D retro que muestren las asistencias por clase.
  - *Estado*: Pendiente
- [ ] **Programador de Asignaciones (Scheduler)**
  - Formulario del Administrador para asignar materias a profesores y definir horarios específicos.
  - *Estado*: Pendiente
- [ ] **Gestión de Roster de Estudiantes**
  - Agregar/eliminar alumnos de los rosters y soporte de carga por lote.
  - *Estado*: Pendiente
- [ ] **Gestión de Clases**
  - Formulario para crear y editar materias.
  - Mostrar la lista de materias guardadas en el explorador de archivos retro (estilo "Mi PC").
  - *Estado*: Pendiente
- [ ] **Módulo de Sesión Activa del Profesor**
  - Generar el código QR de sesión apuntando a la IP local del profesor.
  - Implementar polling en la UI del profesor para actualizar en tiempo real los alumnos registrados.
  - Permitir modificar el estado manualmente y finalizar la sesión.
  - *Estado*: Pendiente
- [ ] **Visualización de Reportes e Historial (Profesor)**
  - Tabla que muestre todas las sesiones guardadas en el historial.
  - Vista detallada de cada sesión con el listado de asistencias.
  - Estadísticas básicas: tasa de asistencia por clase y por estudiante.
  - *Estado*: Pendiente
- [ ] **Exportación a CSV**
  - Botón en la ventana de reportes que descargue un archivo CSV formateado con las asistencias de la clase/sesión.
  - *Estado*: Pendiente

---

## 🟢 Baja Prioridad (Extras y Ajustes Futuros)

- [ ] **Simulador de Internet Explorer**
  - Ventana en el escritorio del profesor para simular la vista del estudiante.
  - *Estado*: Pendiente
- [ ] **Efectos de Sonido Retro**
  - Reproducir el sonido clásico de inicio de Windows 95 al abrir el sistema o al iniciar sesión.
  - Efecto de sonido de error clásico de Windows.
  - *Estado*: Pendiente
- [ ] **Papelera de Reciclaje Funcional**
  - Enviar elementos eliminados a la papelera. Permitir "Restaurar" o "Vaciar papelera".
  - *Estado*: Pendiente
