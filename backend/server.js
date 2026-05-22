const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'retrocheck95_local_secret_key_2026';

// -------------------------------------------------------------
// SECURITY HEADERS & CORS Configuration (OWASP A05:2021)
// -------------------------------------------------------------
// Disable contentSecurityPolicy for Vite dev server proxy compatibility, keep other protections
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*', // Allow all local connections in class Wi-Fi context
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit.log');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// SECURITY AUDIT LOGGER (OWASP A09:2021 / MITRE T1071 / T1562)
// -------------------------------------------------------------
function logAuditEvent(actor, action, target, status, details = '') {
  const timestamp = new Date().toISOString();
  // Sanitize values to prevent log injection
  const safeActor = String(actor).replace(/[\r\n]/g, '');
  const safeAction = String(action).replace(/[\r\n]/g, '');
  const safeTarget = String(target).replace(/[\r\n]/g, '');
  const safeStatus = String(status).replace(/[\r\n]/g, '');
  const safeDetails = String(details).replace(/[\r\n]/g, '');

  const logEntry = `${timestamp} | ACTOR: ${safeActor} | ACTION: ${safeAction} | TARGET: ${safeTarget} | STATUS: ${safeStatus} | DETAILS: ${safeDetails}\n`;
  try {
    fs.appendFileSync(AUDIT_LOG_FILE, logEntry, 'utf8');
  } catch (err) {
    console.error('Failed to write to audit log:', err);
  }
}

// -------------------------------------------------------------
// ACCOUNT LOCKOUT REGISTRY & LOGIC (OWASP A07:2021 / MITRE T1110)
// -------------------------------------------------------------
const loginAttempts = {};

function handleLoginAttempt(userId, success) {
  const cleanId = String(userId).toLowerCase().trim();
  const now = Date.now();

  if (!loginAttempts[cleanId]) {
    loginAttempts[cleanId] = { count: 0, lockUntil: 0 };
  }

  const attempt = loginAttempts[cleanId];
  if (success) {
    attempt.count = 0;
    attempt.lockUntil = 0;
  } else {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
      logAuditEvent(userId, 'ACCOUNT_LOCKOUT', 'auth', 'LOCKED', 'Locked due to 5 consecutive failed login attempts');
    }
  }
}

function isUserLocked(userId) {
  const cleanId = String(userId).toLowerCase().trim();
  const now = Date.now();
  const attempt = loginAttempts[cleanId];
  if (attempt && attempt.lockUntil > now) {
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// INPUT VALIDATION HELPERS (OWASP A03:2021)
// -------------------------------------------------------------
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const TEXT_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-()]+$/;

function validateInput(value, regex) {
  if (typeof value !== 'string') return false;
  return regex.test(value);
}

// Escape CSV formula injection characters (OWASP A03:2021)
function sanitizeCSVField(val) {
  if (typeof val !== 'string') return val;
  const cleaned = val.replace(/[\r\n]/g, ' ');
  if (cleaned.startsWith('=') || cleaned.startsWith('+') || cleaned.startsWith('-') || cleaned.startsWith('@')) {
    return `'${cleaned}`;
  }
  return cleaned;
}

// -------------------------------------------------------------
// PERSISTENCE FUNCTIONS
// -------------------------------------------------------------
function initJSONFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Hashed mock users database initialization (OWASP A02:2021)
const defaultUsers = [
  { id: "admin", name: "Administrador General", role: "admin", passwordHash: bcrypt.hashSync("admin95", 10) },
  { id: "prof_gomez", name: "Prof. Roberto Gómez", role: "teacher", passwordHash: bcrypt.hashSync("gomez95", 10) },
  { id: "prof_rodriguez", name: "Dra. Patricia Rodríguez", role: "teacher", passwordHash: bcrypt.hashSync("rodriguez95", 10) },
  { id: "20230001", name: "Carlos Pérez", role: "student", passwordHash: bcrypt.hashSync("student95", 10) },
  { id: "20230002", name: "María Gómez", role: "student", passwordHash: bcrypt.hashSync("student95", 10) },
  { id: "20230003", name: "José Hernández", role: "student", passwordHash: bcrypt.hashSync("student95", 10) },
  { id: "20230004", name: "Ana Ruiz", role: "student", passwordHash: bcrypt.hashSync("student95", 10) }
];

const defaultClasses = [
  {
    id: "clase-mat-101",
    name: "Matemáticas I",
    schedule: "Lunes y Miércoles 08:00 - 10:00",
    teacherId: "prof_gomez",
    teacherName: "Prof. Roberto Gómez",
    students: [
      { id: "20230001", name: "Carlos Pérez" },
      { id: "20230002", name: "María Gómez" }
    ]
  },
  {
    id: "clase-his-201",
    name: "Historia de México",
    schedule: "Martes y Jueves 10:00 - 12:00",
    teacherId: "prof_rodriguez",
    teacherName: "Dra. Patricia Rodríguez",
    students: [
      { id: "20230003", name: "José Hernández" },
      { id: "20230004", name: "Ana Ruiz" }
    ]
  }
];

initJSONFile(USERS_FILE, defaultUsers);
initJSONFile(CLASSES_FILE, defaultClasses);
initJSONFile(SESSIONS_FILE, []);
initJSONFile(ATTENDANCE_FILE, []);

// Get Local IPv4 Address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// -------------------------------------------------------------
// RATE LIMITERS (OWASP A04:2021)
// -------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // Max 30 attempts per 15 minutes per IP
  message: { success: false, error: 'Demasiados intentos de inicio de sesión desde esta IP. Inténtelo en 15 minutos.' }
});

const checkinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 10, // Max 10 checkins per IP per minute
  message: { success: false, error: 'Has excedido el límite de registros. Por favor, espera un minuto.' }
});

// -------------------------------------------------------------
// AUTHORIZATION MIDDLEWARES (OWASP A01:2021)
// -------------------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Acceso denegado. Se requiere credencial activa.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Sesión expirada o credencial corrupta.' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logAuditEvent(req.user ? req.user.id : 'unknown', 'UNAUTHORIZED_ACCESS_ATTEMPT', req.originalUrl, 'BLOCKED', `Required roles: ${JSON.stringify(roles)}`);
      return res.status(403).json({ success: false, error: 'Permisos insuficientes para esta operación.' });
    }
    next();
  };
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Auth Endpoint with Hashed Passwords, Lockout, and JWT Issue
app.post('/api/login', loginLimiter, (req, res) => {
  const { userId, password } = req.body;
  
  if (!userId || !password) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  const cleanUserId = String(userId).trim().toLowerCase();

  // Check account lockout
  if (isUserLocked(cleanUserId)) {
    logAuditEvent(cleanUserId, 'LOGIN_ATTEMPT', 'auth', 'BLOCKED', 'Locked account login attempt');
    return res.status(423).json({ 
      success: false, 
      error: 'Esta cuenta ha sido bloqueada temporalmente por seguridad. Inténtalo más tarde.' 
    });
  }

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id.toLowerCase() === cleanUserId);

  if (!user || !user.passwordHash) {
    handleLoginAttempt(cleanUserId, false);
    logAuditEvent(cleanUserId, 'LOGIN', 'auth', 'FAILURE', 'User not found or no password hash');
    return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
  }

  // Compare bcrypt password hash
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);

  if (passwordMatch) {
    handleLoginAttempt(cleanUserId, true);
    
    // Generate secure JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    logAuditEvent(user.id, 'LOGIN', 'auth', 'SUCCESS', `Role: ${user.role}`);

    // Exclude password hash from response
    const { passwordHash, ...userPayload } = user;
    res.json({ 
      success: true, 
      token, 
      user: userPayload 
    });
  } else {
    handleLoginAttempt(cleanUserId, false);
    logAuditEvent(cleanUserId, 'LOGIN', 'auth', 'FAILURE', 'Incorrect password');
    res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
  }
});

// 2. Admin Portal: Summary stats
app.get('/api/admin/summary', authenticateToken, requireRole(['admin']), (req, res) => {
  const users = readJSON(USERS_FILE);
  const classes = readJSON(CLASSES_FILE);
  const sessions = readJSON(SESSIONS_FILE);
  const attendance = readJSON(ATTENDANCE_FILE);

  const totalClasses = classes.length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalStudents = users.filter(u => u.role === 'student').length;

  const completedSessions = sessions.filter(s => s.status === 'completed');
  let globalRate = 0;
  if (completedSessions.length > 0) {
    let totalRatesSum = 0;
    completedSessions.forEach(session => {
      const cls = classes.find(c => c.id === session.classId);
      const rosterCount = cls ? cls.students.length : 0;
      if (rosterCount > 0) {
        const presentsCount = attendance.filter(
          a => a.sessionId === session.id && (a.status === 'Presente' || a.status === 'Tarde')
        ).length;
        totalRatesSum += (presentsCount / rosterCount) * 100;
      }
    });
    globalRate = parseFloat((totalRatesSum / completedSessions.length).toFixed(1));
  } else {
    globalRate = 100.0;
  }

  res.json({
    success: true,
    data: {
      totalClasses,
      totalTeachers,
      totalStudents,
      averageAttendance: globalRate
    }
  });
});

// 3. Admin Portal: Teachers list
app.get('/api/admin/teachers', authenticateToken, requireRole(['admin']), (req, res) => {
  const users = readJSON(USERS_FILE);
  const teachers = users.filter(u => u.role === 'teacher').map(({ passwordHash, ...t }) => t);
  res.json({ success: true, data: teachers });
});

// 4. Admin Portal: Assign Class schedule and teacher
app.post('/api/admin/assign-class', authenticateToken, requireRole(['admin']), (req, res) => {
  const { classId, teacherId, schedule } = req.body;

  if (!classId || !teacherId) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
  }

  if (!validateInput(classId, ID_REGEX) || !validateInput(teacherId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Identificadores con formato inválido.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const classIdx = classes.findIndex(c => c.id === classId);
  if (classIdx === -1) {
    return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
  }

  const users = readJSON(USERS_FILE);
  const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
  if (!teacher) {
    return res.status(404).json({ success: false, error: 'Profesor no registrado.' });
  }

  classes[classIdx].teacherId = teacher.id;
  classes[classIdx].teacherName = teacher.name;
  if (schedule) {
    if (!validateInput(schedule, TEXT_REGEX)) {
      return res.status(400).json({ success: false, error: 'Horario con caracteres inválidos.' });
    }
    classes[classIdx].schedule = schedule;
  }

  writeJSON(CLASSES_FILE, classes);
  logAuditEvent(req.user.id, 'ASSIGN_CLASS_TEACHER', classId, 'SUCCESS', `Assigned teacher ${teacherId} with schedule ${schedule}`);
  res.json({ success: true, data: classes[classIdx] });
});

// 5. General Class List & Creation
app.get('/api/classes', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  const classes = readJSON(CLASSES_FILE);
  res.json({ success: true, data: classes });
});

app.post('/api/classes', authenticateToken, requireRole(['admin']), (req, res) => {
  const { name, schedule } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Se requiere el nombre de la clase.' });
  }

  if (!validateInput(name, TEXT_REGEX) || (schedule && !validateInput(schedule, TEXT_REGEX))) {
    return res.status(400).json({ success: false, error: 'Nombre o horario con formato inválido.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const newClass = {
    id: `clase-${Date.now().toString(36)}`,
    name,
    schedule: schedule || 'No asignado',
    teacherId: null,
    teacherName: 'No asignado',
    students: []
  };

  classes.push(newClass);
  writeJSON(CLASSES_FILE, classes);
  logAuditEvent(req.user.id, 'CREATE_CLASS', newClass.id, 'SUCCESS', `Class: ${name}`);
  res.json({ success: true, data: newClass });
});

// 6. Manage Students in Class Roster (Admin / Teacher)
app.post('/api/classes/:classId/students', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  const { classId } = req.params;
  const { students } = req.body; // Expect array of { id, name }

  if (!validateInput(classId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'ID de clase inválido.' });
  }

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ success: false, error: 'Se requiere un arreglo de estudiantes.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const classIdx = classes.findIndex(c => c.id === classId);
  if (classIdx === -1) {
    return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
  }

  const users = readJSON(USERS_FILE);
  let usersUpdated = false;

  for (const student of students) {
    const cleanId = String(student.id).trim();
    const cleanName = String(student.name).trim();

    if (!cleanId || !cleanName) continue;

    if (!validateInput(cleanId, ID_REGEX) || !validateInput(cleanName, TEXT_REGEX)) {
      return res.status(400).json({ success: false, error: `Estudiante ${cleanId} tiene un formato de ID o Nombre inválido.` });
    }

    const roster = classes[classIdx].students;
    if (!roster.some(s => s.id === cleanId)) {
      roster.push({ id: cleanId, name: cleanName });
    }

    // Add to global users with default student password if not exists
    if (!users.some(u => u.id === cleanId)) {
      users.push({ 
        id: cleanId, 
        name: cleanName, 
        role: 'student', 
        passwordHash: bcrypt.hashSync("student95", 10) 
      });
      usersUpdated = true;
    }
  }

  writeJSON(CLASSES_FILE, classes);
  if (usersUpdated) {
    writeJSON(USERS_FILE, users);
  }

  logAuditEvent(req.user.id, 'ADD_STUDENTS_TO_CLASS', classId, 'SUCCESS', `Added ${students.length} students`);
  res.json({ success: true, data: classes[classIdx] });
});

app.delete('/api/classes/:classId/students/:studentId', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  const { classId, studentId } = req.params;

  if (!validateInput(classId, ID_REGEX) || !validateInput(studentId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Formato de identificador inválido.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const classIdx = classes.findIndex(c => c.id === classId);

  if (classIdx === -1) {
    return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
  }

  classes[classIdx].students = classes[classIdx].students.filter(s => s.id !== studentId);
  writeJSON(CLASSES_FILE, classes);
  logAuditEvent(req.user.id, 'REMOVE_STUDENT_FROM_CLASS', classId, 'SUCCESS', `Removed student: ${studentId}`);
  res.json({ success: true, data: classes[classIdx] });
});

// 7. Teacher specific classes
app.get('/api/teacher/:teacherId/classes', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  const { teacherId } = req.params;

  if (!validateInput(teacherId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Formato de profesor inválido.' });
  }

  // BOLA check (Broken Object Level Authorization): Teacher can only fetch their own classes unless they are admin
  if (req.user.role === 'teacher' && req.user.id !== teacherId) {
    logAuditEvent(req.user.id, 'BOLA_VIOLATION_ATTEMPT', teacherId, 'BLOCKED', 'Attempted to retrieve classes for another teacher');
    return res.status(403).json({ success: false, error: 'Acceso denegado a las clases de otro profesor.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const teacherClasses = classes.filter(c => c.teacherId === teacherId);
  res.json({ success: true, data: teacherClasses });
});

// 8. Attendance Sessions: Get active session (secured and trimmed for student privacy)
app.get('/api/sessions/active', authenticateToken, (req, res) => {
  const { teacherId } = req.query;

  if (teacherId && !validateInput(teacherId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'ID de profesor inválido.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  let activeSession = null;
  
  if (teacherId) {
    activeSession = sessions.find(s => s.status === 'active' && s.teacherId === teacherId);
  } else {
    activeSession = sessions.find(s => s.status === 'active');
  }

  if (!activeSession) {
    return res.json({ success: true, active: false });
  }

  // Fetch the roster students
  const classes = readJSON(CLASSES_FILE);
  const cls = classes.find(c => c.id === activeSession.classId);
  
  // Data minimization: if requester is a student, we DO NOT return the grid of other student checkins
  if (req.user.role === 'student') {
    // Only return that there is an active session, its name, and if this specific student is checked in
    const attendance = readJSON(ATTENDANCE_FILE);
    const checkedIn = attendance.some(a => a.sessionId === activeSession.id && a.studentId === req.user.id);
    
    return res.json({
      success: true,
      active: true,
      session: {
        id: activeSession.id,
        classId: activeSession.classId,
        className: activeSession.className,
        date: activeSession.date,
        ipAddress: activeSession.ipAddress
      },
      checkedIn // simple boolean status for this student
    });
  }

  // Fetch registered attendances for teachers/admins
  const attendance = readJSON(ATTENDANCE_FILE);
  const sessionRecords = attendance.filter(a => a.sessionId === activeSession.id);
  const students = cls ? cls.students : [];

  const currentAttendanceGrid = students.map(student => {
    const record = sessionRecords.find(r => r.studentId === student.id);
    return {
      id: student.id,
      name: student.name,
      status: record ? record.status : 'Ausente',
      timestamp: record ? record.timestamp : null
    };
  });

  res.json({
    success: true,
    active: true,
    session: activeSession,
    attendance: currentAttendanceGrid
  });
});

// 8b. Session attendance details query (Teachers / Admin)
app.get('/api/sessions/:sessionId/attendance', authenticateToken, requireRole(['teacher', 'admin']), (req, res) => {
  const { sessionId } = req.params;
  if (!validateInput(sessionId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Identificador de sesión inválido.' });
  }

  const attendance = readJSON(ATTENDANCE_FILE);
  const records = attendance.filter(a => a.sessionId === sessionId);
  res.json({ success: true, data: records });
});

// 9. Attendance Sessions: Start Session (Teacher)
app.post('/api/sessions/start', authenticateToken, requireRole(['teacher']), (req, res) => {
  const { classId, teacherId } = req.body;

  if (!classId || !teacherId) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
  }

  if (!validateInput(classId, ID_REGEX) || !validateInput(teacherId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Identificadores inválidos.' });
  }

  // BOLA: Teacher can only start sessions for themselves
  if (req.user.id !== teacherId) {
    logAuditEvent(req.user.id, 'SESSION_START_VIOLATION', classId, 'BLOCKED', `Attempted to start session for teacher ${teacherId}`);
    return res.status(403).json({ success: false, error: 'No puedes iniciar sesión a nombre de otro profesor.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  const activeSessionIdx = sessions.findIndex(s => s.status === 'active' && s.teacherId === teacherId);
  if (activeSessionIdx !== -1) {
    return res.status(400).json({ 
      success: false, 
      error: 'Ya tienes una sesión de asistencia activa. Debes finalizarla primero.' 
    });
  }

  const classes = readJSON(CLASSES_FILE);
  const cls = classes.find(c => c.id === classId && c.teacherId === teacherId);
  if (!cls) {
    return res.status(404).json({ success: false, error: 'Clase no encontrada o no asignada a este profesor.' });
  }

  const localIp = getLocalIpAddress();
  const sessionId = `session-${Date.now().toString(36)}`;
  
  const newSession = {
    id: sessionId,
    classId: cls.id,
    className: cls.name,
    teacherId,
    date: new Date().toISOString(),
    status: 'active',
    ipAddress: localIp
  };

  sessions.push(newSession);
  writeJSON(SESSIONS_FILE, sessions);
  logAuditEvent(req.user.id, 'START_SESSION', sessionId, 'SUCCESS', `Class: ${cls.name}`);

  res.json({
    success: true,
    session: newSession,
    qrUrl: `http://${localIp}:${PORT}/checkin/${sessionId}`
  });
});

// 10. Attendance Sessions: Update manual override status (Teacher/Admin)
app.post('/api/sessions/:sessionId/override', authenticateToken, requireRole(['teacher', 'admin']), (req, res) => {
  const { sessionId } = req.params;
  const { studentId, status } = req.body;

  if (!validateInput(sessionId, ID_REGEX) || !studentId || !status) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros o formato de sesión inválido.' });
  }

  if (!validateInput(studentId, ID_REGEX) || !validateInput(status, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Formato de matrícula o estado inválido.' });
  }

  const allowedStatuses = ['Presente', 'Tarde', 'Excusa', 'Ausente'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Estado de asistencia inválido.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Sesión no encontrada.' });
  }

  // BOLA: If requester is teacher, check if they own the session
  if (req.user.role === 'teacher' && session.teacherId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Acceso denegado. No eres el titular de esta sesión.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const cls = classes.find(c => c.id === session.classId);
  if (!cls) {
    return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
  }

  const student = cls.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Estudiante no matriculado en esta clase.' });
  }

  const attendance = readJSON(ATTENDANCE_FILE);
  const recordIdx = attendance.findIndex(a => a.sessionId === sessionId && a.studentId === studentId);

  if (status === 'Ausente') {
    if (recordIdx !== -1) {
      attendance.splice(recordIdx, 1);
    }
  } else {
    const record = {
      sessionId,
      classId: session.classId,
      className: session.className,
      studentId,
      studentName: student.name,
      timestamp: recordIdx !== -1 ? attendance[recordIdx].timestamp : new Date().toISOString(),
      status
    };

    if (recordIdx !== -1) {
      attendance[recordIdx] = record;
    } else {
      attendance.push(record);
    }
  }

  writeJSON(ATTENDANCE_FILE, attendance);
  logAuditEvent(req.user.id, 'MANUAL_OVERRIDE', studentId, 'SUCCESS', `Set ${status} in session ${sessionId}`);
  res.json({ success: true });
});

// 11. Attendance Sessions: End (Teacher)
app.post('/api/sessions/:sessionId/end', authenticateToken, requireRole(['teacher']), (req, res) => {
  const { sessionId } = req.params;

  if (!validateInput(sessionId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'ID de sesión inválido.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  const sessionIdx = sessions.findIndex(s => s.id === sessionId);

  if (sessionIdx === -1) {
    return res.status(404).json({ success: false, error: 'Sesión no encontrada.' });
  }

  // BOLA checks
  if (sessions[sessionIdx].teacherId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'No tienes permisos para cerrar la sesión de otro profesor.' });
  }

  // End the session
  sessions[sessionIdx].status = 'completed';
  writeJSON(SESSIONS_FILE, sessions);

  // Persist "Ausente" records for students who did not check in
  const session = sessions[sessionIdx];
  const classes = readJSON(CLASSES_FILE);
  const cls = classes.find(c => c.id === session.classId);
  const students = cls ? cls.students : [];
  const attendance = readJSON(ATTENDANCE_FILE);
  
  students.forEach(student => {
    const hasRecord = attendance.some(a => a.sessionId === sessionId && a.studentId === student.id);
    if (!hasRecord) {
      attendance.push({
        sessionId,
        classId: session.classId,
        className: session.className,
        studentId: student.id,
        studentName: student.name,
        timestamp: new Date().toISOString(),
        status: 'Ausente'
      });
    }
  });

  writeJSON(ATTENDANCE_FILE, attendance);
  logAuditEvent(req.user.id, 'END_SESSION', sessionId, 'SUCCESS');

  res.json({ success: true, session: sessions[sessionIdx] });
});

// 12. Student: Submit dynamic Check-in (Token validated / BOLA compliant)
app.post('/api/checkin', checkinLimiter, authenticateToken, requireRole(['student']), (req, res) => {
  const { sessionId, studentId } = req.body;

  if (!sessionId || !studentId) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros obligatorios.' });
  }

  if (!validateInput(sessionId, ID_REGEX) || !validateInput(studentId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Parámetros con formato inválido.' });
  }

  // BOLA: Student token MUST match the student ID they are checking in with
  if (req.user.id !== studentId) {
    logAuditEvent(req.user.id, 'IDOR_CHECKIN_ATTEMPT', studentId, 'BLOCKED', `Tried checking in with target student ID ${studentId}`);
    return res.status(403).json({ success: false, error: 'Intento de suplantación bloqueado. Solo puedes registrar tu propio ID.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: 'La sesión de asistencia no existe.' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ success: false, error: 'La sesión de asistencia ha expirado o está cerrada.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const cls = classes.find(c => c.id === session.classId);
  if (!cls) {
    return res.status(404).json({ success: false, error: 'La materia asociada ya no existe.' });
  }

  // Verify student is actually enrolled in this class roster
  const student = cls.students.find(s => s.id.toLowerCase() === studentId.trim().toLowerCase());
  if (!student) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tu matrícula no está inscrita en la lista de esta materia. Contacta al profesor.' 
    });
  }

  // Check duplicate registration
  const attendance = readJSON(ATTENDANCE_FILE);
  const alreadyChecked = attendance.some(
    a => a.sessionId === sessionId && a.studentId.toLowerCase() === student.id.toLowerCase()
  );

  if (alreadyChecked) {
    return res.status(400).json({ success: false, error: 'Ya has registrado tu asistencia en esta sesión.' });
  }

  const record = {
    sessionId,
    classId: session.classId,
    className: session.className,
    studentId: student.id,
    studentName: student.name,
    timestamp: new Date().toISOString(),
    status: 'Presente'
  };

  attendance.push(record);
  writeJSON(ATTENDANCE_FILE, attendance);
  logAuditEvent(student.id, 'STUDENT_CHECKIN', sessionId, 'SUCCESS', `Class: ${session.className}`);

  res.json({
    success: true,
    data: {
      studentName: student.name,
      className: session.className,
      timestamp: record.timestamp
    }
  });
});

// 13. Student Portal: Check Personal History records (secured to own records only)
app.get('/api/student/:studentId/history', authenticateToken, (req, res) => {
  const { studentId } = req.params;

  if (!validateInput(studentId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Identificador de estudiante inválido.' });
  }

  // BOLA check: Students can only access their own history
  if (req.user.role === 'student' && req.user.id !== studentId) {
    logAuditEvent(req.user.id, 'BOLA_HISTORY_ATTEMPT', studentId, 'BLOCKED', 'Attempted to view history of another student');
    return res.status(403).json({ success: false, error: 'Acceso denegado a información externa.' });
  }

  const classes = readJSON(CLASSES_FILE);
  const sessions = readJSON(SESSIONS_FILE);
  const attendance = readJSON(ATTENDANCE_FILE);

  const enrolledClasses = classes.filter(c => c.students.some(s => s.id === studentId));

  const history = enrolledClasses.map(cls => {
    const classSessions = sessions.filter(s => s.classId === cls.id && s.status === 'completed');
    const totalSessions = classSessions.length;

    let presents = 0;
    let lates = 0;
    let excuses = 0;
    let absents = 0;

    const records = classSessions.map(session => {
      const record = attendance.find(a => a.sessionId === session.id && a.studentId === studentId);
      const status = record ? record.status : 'Ausente';

      if (status === 'Presente') presents++;
      else if (status === 'Tarde') lates++;
      else if (status === 'Excusa') excuses++;
      else if (status === 'Ausente') absents++;

      return {
        sessionId: session.id,
        date: session.date,
        status
      };
    });

    const attendanceRate = totalSessions > 0 ? parseFloat(((presents + lates + excuses) / totalSessions * 100).toFixed(1)) : 100.0;

    return {
      classId: cls.id,
      className: cls.name,
      schedule: cls.schedule,
      teacherName: cls.teacherName,
      totalSessions,
      presents,
      lates,
      excuses,
      absents,
      attendanceRate,
      records
    };
  });

  res.json({ success: true, data: history });
});

// 14. Historical sessions list (Professors and Admins)
app.get('/api/reports/sessions', authenticateToken, requireRole(['teacher', 'admin']), (req, res) => {
  const { classId } = req.query;

  if (classId && !validateInput(classId, ID_REGEX)) {
    return res.status(400).json({ success: false, error: 'Formato de clase inválido.' });
  }

  const sessions = readJSON(SESSIONS_FILE);
  const classes = readJSON(CLASSES_FILE);
  const attendance = readJSON(ATTENDANCE_FILE);

  const completedSessions = sessions.filter(
    s => s.status === 'completed' && (!classId || s.classId === classId)
  );

  const data = completedSessions.map(session => {
    const cls = classes.find(c => c.id === session.classId);
    const rosterCount = cls ? cls.students.length : 0;
    const sessionRecords = attendance.filter(a => a.sessionId === session.id);
    
    const presents = sessionRecords.filter(r => r.status === 'Presente').length;
    const lates = sessionRecords.filter(r => r.status === 'Tarde').length;
    const excuses = sessionRecords.filter(r => r.status === 'Excusa').length;
    const absents = sessionRecords.filter(r => r.status === 'Ausente').length;

    return {
      id: session.id,
      classId: session.classId,
      className: session.className,
      date: session.date,
      rosterCount,
      presents,
      lates,
      excuses,
      absents
    };
  });

  res.json({ success: true, data });
});

// 15. Export report as CSV (escapes formula injections)
app.get('/api/reports/export/:classId', authenticateToken, requireRole(['teacher', 'admin']), (req, res) => {
  const { classId } = req.params;

  if (!validateInput(classId, ID_REGEX)) {
    return res.status(400).send('Identificador de clase inválido.');
  }

  const classes = readJSON(CLASSES_FILE);
  const sessions = readJSON(SESSIONS_FILE);
  const attendance = readJSON(ATTENDANCE_FILE);

  const cls = classes.find(c => c.id === classId);
  if (!cls) {
    return res.status(404).send('Clase no encontrada.');
  }

  const classSessions = sessions.filter(s => s.classId === classId && s.status === 'completed');
  
  // Build header, applying CSV sanitation
  let csvContent = `${sanitizeCSVField('Matricula')},${sanitizeCSVField('Nombre Estudiante')}`;
  classSessions.forEach(s => {
    const formattedDate = new Date(s.date).toLocaleDateString('es-MX', {
      month: '2-digit',
      day: '2-digit'
    });
    csvContent += `,${sanitizeCSVField(formattedDate)}`;
  });
  csvContent += `,${sanitizeCSVField('Porcentaje Asistencia')}\n`;

  // Build rows, applying CSV sanitation to each field
  cls.students.forEach(student => {
    let row = `"${sanitizeCSVField(student.id)}","${sanitizeCSVField(student.name)}"`;
    let presents = 0;
    
    classSessions.forEach(session => {
      const record = attendance.find(a => a.sessionId === session.id && a.studentId === student.id);
      const status = record ? record.status : 'Ausente';
      if (status === 'Presente' || status === 'Tarde' || status === 'Excusa') {
        presents++;
      }
      row += `,"${sanitizeCSVField(status)}"`;
    });

    const rate = classSessions.length > 0 ? ((presents / classSessions.length) * 100).toFixed(1) : '100.0';
    row += `,${rate}%\n`;
    csvContent += row;
  });

  logAuditEvent(req.user.id, 'EXPORT_REPORTS_CSV', classId, 'SUCCESS');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=reporte_${classId}.csv`);
  res.send(Buffer.from('\uFEFF' + csvContent, 'utf-8')); // Add BOM for Excel
});

// -------------------------------------------------------------
// Serve static client bundle in Production
// -------------------------------------------------------------
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` RetroCheck 95 Backend Running Locally!`);
  console.log(` - Local Portal: http://localhost:${PORT}`);
  console.log(` - Network Access: http://${getLocalIpAddress()}:${PORT}`);
  console.log(`================================================`);
});
