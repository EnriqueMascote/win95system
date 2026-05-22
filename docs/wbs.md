# Work Breakdown Structure (WBS) - RetroCheck 95

Este documento define la estructura jerárquica de desglose de trabajo para el desarrollo de RetroCheck 95.

```
RetroCheck 95 (Proyecto)
├── 1. Planificación e Infraestructura Inicial
│   ├── 1.1 Definición de Requerimientos y Diseño
│   └── 1.2 Configuración del Repositorio y Estructura Concurrente (Vite + Express)
├── 2. Desarrollo del Backend (Servidor Express)
│   ├── 2.1 Módulo de Almacenamiento JSON (Manejador de archivos locales)
│   ├── 2.2 Endpoint de Detección de IP Local (OS Network Interfaces)
│   ├── 2.3 APIs para Clases y Estudiantes (CRUD)
│   ├── 2.4 Módulo de Sesiones de Asistencia y Check-in de Estudiantes
│   └── 2.5 Generador de Reportes y Endpoint de Exportación CSV
├── 3. Desarrollo del Frontend (Escritorio Windows 95)
│   ├── 3.1 Diseño del Sistema CSS Retro (Colores, biselado 3D, tipografía MS Sans Serif, scrollbars)
│   ├── 3.2 Componente Base de Ventana (Window.jsx - Arrastrable, botones de control, menús)
│   ├── 3.3 Barra de Tareas (Taskbar.jsx) y Menú Inicio (StartMenu.jsx) con reloj funcional
│   ├── 3.4 Escritorio Base (Desktop.jsx) con manejo de estados de ventanas abiertas e iconos doble clic
│   ├── 3.5 Módulo de Administración de Clases (ClassManager.jsx)
│   ├── 3.6 Módulo de Administración de Estudiantes (StudentManager.jsx)
│   ├── 3.7 Módulo de Reportes e Historial (Reports.jsx)
│   └── 3.8 Módulo de Sesión de Asistencia Activa (AttendanceSession.jsx) con QR Code dinámico
├── 4. Desarrollo del Portal del Estudiante (Netscape Portal)
│   ├── 4.1 UI del Portal Móvil estilo Netscape Navigator
│   ├── 4.2 Formulario de Check-in con validaciones
│   └── 4.3 Manejador de Registro de Asistencia Local y Evitación de Duplicados
├── 5. Pruebas e Integración
│   ├── 5.1 Pruebas de Conectividad en Red Local (Pruebas cruzadas Laptop -> Móvil)
│   ├── 5.2 Pruebas de Persistencia JSON y Concurrencia de Peticiones
│   └── 5.3 Pruebas de Usabilidad del Escritorio y Drag-and-Drop
└── 6. Cierre y Documentación Final
    ├── 6.1 Guías de Instalación y Ejecución
    └── 6.2 Manual de Operación Rápida para el Profesor
```

---

## Detalle de Hitos Clave

- **Hito 1 (Infraestructura básica)**: Servidores backend y frontend corriendo de forma concurrente, con persistencia JSON inicializable.
- **Hito 2 (Interfaz de Escritorio)**: Simulación de escritorio Windows 95 con ventanas arrastrables y funcionales (abrir/cerrar/minimizar).
- **Hito 3 (Conectividad Estudiante-Profesor)**: Código QR funcional que usa la IP local real. El estudiante puede ingresar desde su móvil en la misma red Wi-Fi y su registro aparece en tiempo real en la pantalla del profesor.
- **Hito 4 (Reportes y Cierre)**: Generación de reportes de asistencia acumulados y exportación a archivos CSV.
