# Alcance del Proyecto (Scope) - RetroCheck 95

Este documento define las características y componentes que se incluirán en la versión 1.0 (En Alcance) y aquellas ideas que quedan postergadas para futuras actualizaciones (Fuera de Alcance).

## 1. Dentro del Alcance (En Alcance V1.0)

### 1.1 Sistema de Roles y Autenticación Retro
- **Pantalla de Inicio de Sesión de Windows 95**:
  - Diálogo de inicio de sesión clásico con campos "Usuario" y "Contraseña" (simulada para desarrollo local).
  - Usuarios preestablecidos para demostración:
    - **Administrador**: `admin`
    - **Profesor**: `prof_gomez`, `prof_rodriguez`
    - **Estudiante**: `20230001`, `20230002` (acceso directo a consulta de historial)
  - Carga dinámica del escritorio y sus iconos correspondientes según el rol autenticado.

### 1.2 Personalización Visual: Esquemas de Color (Modo Claro / Modo Oscuro)
- **Propiedades de Pantalla (Display Properties)**:
  - Ventana interactiva accesible desde un icono del escritorio o haciendo clic derecho en el fondo y seleccionando "Propiedades".
  - Permite cambiar el esquema de colores de la interfaz de manera global:
    - **Windows Standard (Modo Claro)**: Fondo gris clásico, bordes en relieve 3D, inputs en blanco y barra de títulos en azul marino.
    - **Windows Dark Slate (Modo Oscuro)**: Fondo gris oscuro/carbón, textos claros, inputs negros, bordes sombreados oscuros y barra de títulos violeta/azul oscuro.
  - Persistencia de la selección del tema en `localStorage`.

### 1.3 Portal del Administrador (Admin Panel)
- **Panel de Visión Global del Sistema ("Monitor de Sistema")**:
  - Cuadro resumen con indicadores globales: total de clases registradas, profesores activos, estudiantes registrados y porcentaje global de asistencia.
  - Gráficos de barra retro 3D.
- **Gestión de Clases y Asignación de Horarios ("Programador de Tareas")**:
  - Crear nuevas materias y asignar profesor y horario.
- **Gestión de Profesores y Estudiantes**:
  - CRUD básico en JSON de profesores y estudiantes.

### 1.4 Portal del Profesor (Teacher Panel)
- **Toma de Asistencia en Horas Asignadas**:
  - El profesor inicia la sesión para su clase activa dentro de su horario asignado.
  - Generación de código QR con IP dinámica.
  - Monitoreo en tiempo real de check-ins de estudiantes con anulación manual (Presente, Tarde, Ausente, Excusa).
- **Reportes e Historial**:
  - Historial de sesiones y descarga en formato CSV.

### 1.5 Portal del Estudiante (Student Portal / Netscape Navigator)
- **Check-in Móvil**:
  - Escanear código QR y registrar presencia.
- **Consulta de Historial**:
  - Pestaña de historial en Netscape donde el alumno consulta sus asistencias y faltas por clase, con porcentajes de cumplimiento escolar.

---

## 2. Fuera del Alcance (Futuras Versiones)
- Sincronización en base de datos remota.
- Validación de ubicación geográfica (GPS).
- Carga de justificantes médicos escaneados.
- Inicio de sesión escolar con Active Directory o Google Workspace.
