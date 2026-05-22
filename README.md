# RetroCheck 95 - Sistema de Asistencia de Clases

¡Bienvenido a **RetroCheck 95**! Un sistema interactivo de control de asistencia para clases escolares diseñado con la estética nostálgica y detallada de **Windows 95**.

Este proyecto está diseñado para funcionar en una red local (Wi-Fi de la clase). El profesor inicia el servidor en su laptop y expone un portal. La pantalla del profesor muestra un código QR dinámico con su dirección IP local. Los estudiantes escanean el código QR con sus dispositivos móviles y registran su asistencia a través de una interfaz estilo **Netscape Navigator**.

---

## 🚀 Características Clave

1. **Escritorio de Control (Profesor)**:
   - Panel simulador de Escritorio de Windows 95.
   - Administración de Clases ("Mi PC").
   - Administración de Estudiantes ("Papelera de Reciclaje" / Roster).
   - Generación de Reportes de Asistencia ("Bloc de Notas").
   - Sesión de Asistencia en Tiempo Real ("Vecindario de Red") con código QR dinámico.

2. **Check-In Móvil (Estudiante)**:
   - Interfaz web móvil responsive con estilo Netscape Navigator.
   - Autenticación rápida por Matrícula/ID del estudiante.
   - Registro instantáneo y sincronizado por red local.

---

## 🛠️ Tecnologías y Arquitectura

- **Frontend**: React + Vite (Vanilla CSS para el estilo retro Windows 95/Netscape).
- **Backend**: Express + Node.js (Servidor web ultra-ligero que auto-detecta la IP local).
- **Base de Datos**: Archivos JSON locales (`backend/data/`) para almacenamiento inmediato sin dependencias de instalación.

---

## 📂 Documentación del Proyecto

Toda la documentación técnica y organizativa se encuentra en la carpeta `/docs`:

- **[Visión del Proyecto](docs/vision.md)**: Objetivos, valor y justificación.
- **[Alcance del Proyecto](docs/alcance.md)**: Lo que está dentro y fuera del alcance de la V1.
- **[Work Breakdown Structure (WBS)](docs/wbs.md)**: Desglose jerárquico de las tareas de desarrollo.
- **[Backlog del Producto](docs/backlog.md)**: Tareas, prioridades y estados.
- **[Contexto del Proyecto](docs/project_context.md)**: Estructura técnica y diseño de APIs.
- **[Guía de Contribución](docs/contributing_guide.md)**: Pautas de desarrollo y estilos de código.
- **[Reglas de Seguridad](docs/security_rules.md)**: Validación de inputs y consideraciones de red local.
- **[Bitácora de Agentes](docs/agent_log.md)**: Registro histórico del trabajo e iteraciones de los asistentes IA.

---

## 💻 Instrucciones de Ejecución (Desarrollo)

### Requisitos Previos
- Node.js (v16 o superior).
- Dispositivos de prueba (laptop y teléfono móvil) conectados a la misma red Wi-Fi.

### Instalación y Arranque
1. Clonar o descargar este repositorio en tu workspace.
2. Ejecutar la instalación de dependencias en la raíz:
   ```bash
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```
   Esto levantará el servidor backend (puerto 5000) y el servidor frontend de Vite (puerto 5173) de manera concurrente.
4. Para simular el entorno del estudiante en la misma red local, abre la URL que se muestra en el panel de sesión del profesor (usará la IP local de tu máquina).
