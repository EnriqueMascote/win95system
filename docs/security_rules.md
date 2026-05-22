# Reglas de Seguridad - RetroCheck 95

Dado que **RetroCheck 95** corre localmente en la máquina del profesor y expone puertos a cualquier persona conectada a la misma red Wi-Fi local (p. ej., estudiantes en el salón de clases), es fundamental seguir estas reglas de seguridad para evitar accesos indebidos o alteración de datos.

---

## 1. Seguridad en la Red Local (Wi-Fi de la Clase)

- **Exposición del Servidor**:
  - El servidor Express se enlaza a la interfaz de red local `0.0.0.0` para permitir conexiones entrantes de dispositivos móviles.
  - **Recomendación**: El profesor debe asegurarse de que la red Wi-Fi de la clase sea de confianza. No se recomienda usar redes Wi-Fi públicas abiertas sin control (como aeropuertos o cafeterías) donde cualquier atacante en la misma red podría escanear puertos y acceder a la interfaz del profesor.
- **Acceso Restringido al Dashboard**:
  - Las rutas de administración del profesor (`/api/classes`, `/api/reports`, etc.) no requieren autenticación compleja en esta versión local (V1.0), pero el frontend solo mostrará la consola de profesor en la dirección `localhost` o `127.0.0.1`.
  - **Control en Backend**: Se implementará un middleware simple que restrinja peticiones destructivas (como borrar clases o alumnos) asegurando que provengan únicamente de la misma máquina (`127.0.0.1` o `localhost`), o en su defecto, que requieran una clave de seguridad local preestablecida.

---

## 2. Validación de Entradas de Datos (Input Validation)

- **Sanitización**:
  - Todas las entradas del formulario del estudiante (ID de Estudiante y Nombre) deben ser sanitizadas en el servidor para evitar ataques de inyección de rutas (p. ej. IDs conteniendo `../` para acceder a otros archivos del sistema).
  - El ID del estudiante debe coincidir estrictamente con una expresión regular que valide caracteres alfanuméricos simples (por ejemplo, `/^[a-zA-Z0-9_-]+$/`).
- **Control de Inyecciones HTML**:
  - El nombre del estudiante y el ID deben ser tratados como texto plano en el frontend de React para evitar ataques XSS (Cross-Site Scripting) cuando el profesor los visualiza en su lista en tiempo real.

---

## 3. Prevención de Suplantación e Intentos Múltiples

- **Un Registro por Sesión**:
  - Una vez que un ID de estudiante se ha registrado en una sesión de asistencia activa, el backend bloqueará cualquier intento posterior de registrar el mismo ID en la misma sesión, devolviendo un error `400 Bad Request`.
  - Se guardará un token o bandera en el `localStorage` del dispositivo del estudiante después de realizar un registro exitoso. Si el estudiante intenta ingresar de nuevo, el frontend le mostrará directamente la pantalla de "Asistencia Ya Registrada" sin realizar peticiones de red innecesarias.
