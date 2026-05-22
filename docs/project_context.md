# Contexto del Proyecto y Estructura Técnica - RetroCheck 95

Este documento define la arquitectura técnica del sistema, los esquemas de datos guardados en archivos JSON, y las firmas de los endpoints de la API.

---

## 1. Estructura de Directorios

```
Nuevo-Proj/
├── package.json                   # Dependencias de desarrollo raíz (concurrently, etc.)
├── README.md                      # Documentación del proyecto
├── docs/                          # Archivos de planificación y documentación
│   ├── vision.md
│   ├── alcance.md
│   ├── wbs.md
│   ├── backlog.md
│   ├── project_context.md
│   ├── contributing_guide.md
│   ├── security_rules.md
│   └── agent_log.md
├── backend/                       # Servidor Node.js / Express
│   ├── package.json
│   ├── server.js                  # Lógica del servidor, detección de IP y APIs
│   └── data/                      # Almacenamiento JSON persistente
│       ├── users.json             # Cuentas de usuario (admin, profesores, alumnos)
│       ├── classes.json           # Información de materias, horarios y rosters de alumnos
│       ├── sessions.json          # Registro de sesiones activas y pasadas
│       └── attendance.json        # Detalle de registros de asistencias tomadas
└── frontend/                      # React + Vite Client
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css              # Estilos del sistema de diseño Windows 95
        ├── utils/
        │   └── api.js             # Funciones auxiliares de conexión API
        └── components/            # Componentes React
            ├── Login.jsx          # Ventana de Login de Windows 95
            ├── Desktop.jsx        # Pantalla del escritorio del profesor/admin
            ├── Taskbar.jsx        # Barra de tareas inferior y reloj
            ├── StartMenu.jsx      # Menú de inicio clásico
            ├── Window.jsx         # Ventana arrastrable contenedora
            ├── DisplayProperties.jsx # Cambiador de temas (Claro / Oscuro)
            ├── AdminPanel.jsx     # Dashboard global para administrador
            ├── Scheduler.jsx      # Asignación de profesores y horarios a clases
            ├── ClassManager.jsx   # Gestor de clases
            ├── StudentManager.jsx # Gestor de listas de alumnos
            ├── AttendanceSession.jsx # Panel de sesión de asistencia + código QR
            ├── Reports.jsx        # Reportes históricos e importación/exportación
            └── StudentCheckIn.jsx # Vista del estudiante adaptada a móviles (Netscape)
```

---

## 2. Esquemas de Datos (Archivos JSON)

### 2.1 `backend/data/users.json`
Almacena todos los usuarios que pueden iniciar sesión en el sistema.
```json
[
  {
    "id": "admin",
    "name": "Administrador General",
    "role": "admin"
  },
  {
    "id": "prof_gomez",
    "name": "Prof. Roberto Gómez",
    "role": "teacher"
  },
  {
    "id": "prof_rodriguez",
    "name": "Dra. Patricia Rodríguez",
    "role": "teacher"
  },
  {
    "id": "20230001",
    "name": "Carlos Pérez",
    "role": "student"
  },
  {
    "id": "20230002",
    "name": "María Gómez",
    "role": "student"
  }
]
```

### 2.2 `backend/data/classes.json`
Almacena las materias, su horario asignado, el profesor asignado y el roster de estudiantes inscritos.
```json
[
  {
    "id": "clase-mat-101",
    "name": "Matemáticas I",
    "schedule": "Lunes y Miércoles 08:00 - 10:00",
    "teacherId": "prof_gomez",
    "teacherName": "Prof. Roberto Gómez",
    "students": [
      { "id": "20230001", "name": "Carlos Pérez" },
      { "id": "20230002", "name": "María Gómez" }
    ]
  }
]
```

### 2.3 `backend/data/sessions.json`
Almacena el registro de las sesiones de asistencia.
```json
[
  {
    "id": "sesion-9a8b7c6d",
    "classId": "clase-mat-101",
    "className": "Matemáticas I",
    "teacherId": "prof_gomez",
    "date": "2026-05-22T08:05:00.000Z",
    "status": "active", // "active" o "completed"
    "ipAddress": "192.168.1.10"
  }
]
```

### 2.4 `backend/data/attendance.json`
Almacena el registro detallado de las firmas de asistencia.
```json
[
  {
    "sessionId": "sesion-9a8b7c6d",
    "classId": "clase-mat-101",
    "className": "Matemáticas I",
    "studentId": "20230001",
    "studentName": "Carlos Pérez",
    "timestamp": "2026-05-22T08:06:12.000Z",
    "status": "Presente" // "Presente", "Tarde", "Excusa", "Ausente"
  }
]
```

---

## 3. Endpoints de la API

### 3.1 Autenticación
- **`POST /api/login`**: Valida que un `userId` exista en `users.json`. Retorna `{ success: true, user: { id, name, role } }`.

### 3.2 Administración (Admins únicamente)
- **`GET /api/admin/summary`**: Retorna estadísticas de uso globales:
  ```json
  {
    "totalClasses": 1,
    "totalTeachers": 2,
    "totalStudents": 2,
    "averageAttendance": 85.5
  }
  ```
- **`POST /api/admin/assign-class`**: Permite asignar un profesor y horario a una clase existente. Body: `{ classId, teacherId, schedule }`.
- **`GET /api/admin/teachers`**: Retorna el listado de profesores para asignación.

### 3.3 Profesor
- **`GET /api/teacher/:teacherId/classes`**: Retorna el listado de clases asignadas a ese profesor.
- **`GET /api/sessions/active?teacherId=:teacherId`**: Retorna la sesión activa creada por el profesor si existe.
- **`POST /api/sessions/start`**: Inicia una sesión de asistencia para una clase. Body: `{ classId, teacherId }`.
- **`POST /api/sessions/:sessionId/end`**: Completa la sesión y marca automáticamente como "Ausente" a los alumnos del roster que no registraron asistencia.

### 3.4 Estudiante
- **`POST /api/checkin`**: Registra asistencia. Body: `{ sessionId, studentId }`. (Valida que el estudiante pertenezca al roster de la clase y no tenga asistencia ya registrada).
- **`GET /api/student/:studentId/history`**: Obtiene el historial de asistencias del estudiante en formato detallado por materia.
