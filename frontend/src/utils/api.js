// -------------------------------------------------------------
// Client-Side Mock Database & API Wrapper
// This allows RetroCheck 95 to run 100% locally on Netlify (Serverless)
// using browser localStorage as a persistent database mock.
// -------------------------------------------------------------

const DELAY_MS = 250; // Mock network delay to show loading windows

// Helper to read/write from localStorage
function readDb(key, defaultVal) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultVal;
  }
}

function writeDb(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Initial Mock Databases
const defaultUsers = [
  { id: "admin", name: "Administrador General", role: "admin", password: "admin95" },
  { id: "prof_gomez", name: "Prof. Roberto Gómez", role: "teacher", password: "gomez95" },
  { id: "prof_rodriguez", name: "Dra. Patricia Rodríguez", role: "teacher", password: "rodriguez95" },
  { id: "20230001", name: "Carlos Pérez", role: "student", password: "student95" },
  { id: "20230002", name: "María Gómez", role: "student", password: "student95" },
  { id: "20230003", name: "José Hernández", role: "student", password: "student95" },
  { id: "20230004", name: "Ana Ruiz", role: "student", password: "student95" }
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

// Initialize DBs if they do not exist
const users = readDb('retrocheck_users', defaultUsers);
const classes = readDb('retrocheck_classes', defaultClasses);
readDb('retrocheck_sessions', []);
readDb('retrocheck_attendance', []);
readDb('retrocheck_audit_logs', []);
readDb('retrocheck_lockouts', {});

// Simulated Audit Logger
function logAuditEvent(actor, action, target, status, details = '') {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | ACTOR: ${actor} | ACTION: ${action} | TARGET: ${target} | STATUS: ${status} | DETAILS: ${details}`;
  const logs = readDb('retrocheck_audit_logs', []);
  logs.push(logEntry);
  writeDb('retrocheck_audit_logs', logs);
  console.log('🛡️ SECURITY AUDIT:', logEntry);
}

// Simulated network latency
const sleep = (ms = DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms));

// Mock JWT Helper
function generateMockJWT(payload) {
  // Simple Base64 mock token
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + (8 * 60 * 60); // 8 hours
  const body = btoa(JSON.stringify({ ...payload, exp }));
  const signature = "mock_signature_win95";
  return `${header}.${body}.${signature}`;
}

function getRequesterFromToken() {
  const token = localStorage.getItem('retrocheck_token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('retrocheck_token');
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Security Input Sanitization (OWASP A03:2021)
function validateId(id) {
  const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
  return ID_REGEX.test(id);
}

function sanitizeCSVField(val) {
  if (typeof val !== 'string') return val;
  const cleaned = val.replace(/[\r\n]/g, ' ');
  if (cleaned.startsWith('=') || cleaned.startsWith('+') || cleaned.startsWith('-') || cleaned.startsWith('@')) {
    return `'${cleaned}`;
  }
  return cleaned;
}

export const api = {
  // 1. Authenticate with Hashed Lockout Checks (MITRE T1110)
  login: async (userId, password) => {
    await sleep();
    const cleanId = String(userId).trim().toLowerCase();
    
    if (!cleanId || !password) {
      throw new Error('Usuario y contraseña requeridos.');
    }

    // Check account lockouts
    const lockouts = readDb('retrocheck_lockouts', {});
    const lockout = lockouts[cleanId];
    if (lockout && lockout.lockUntil > Date.now()) {
      logAuditEvent(cleanId, 'LOGIN_ATTEMPT', 'auth', 'BLOCKED', 'Locked account login attempt');
      throw new Error('Esta cuenta ha sido bloqueada temporalmente por seguridad. Inténtalo más tarde.');
    }

    const currentUsers = readDb('retrocheck_users', defaultUsers);
    const user = currentUsers.find(u => u.id.toLowerCase() === cleanId);

    if (!user) {
      // Register failed attempt
      const attempts = lockout ? lockout.count + 1 : 1;
      const lockUntil = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
      lockouts[cleanId] = { count: attempts, lockUntil };
      writeDb('retrocheck_lockouts', lockouts);
      
      if (attempts >= 5) {
        logAuditEvent(cleanId, 'ACCOUNT_LOCKOUT', 'auth', 'LOCKED', 'Locked due to 5 consecutive failed login attempts');
      }
      logAuditEvent(cleanId, 'LOGIN', 'auth', 'FAILURE', 'User not found');
      throw new Error('Credenciales inválidas.');
    }

    // Password check
    if (user.password === password) {
      // Clear lockouts on success
      lockouts[cleanId] = { count: 0, lockUntil: 0 };
      writeDb('retrocheck_lockouts', lockouts);

      // Generate token
      const token = generateMockJWT({ id: user.id, name: user.name, role: user.role });
      localStorage.setItem('retrocheck_token', token);

      logAuditEvent(user.id, 'LOGIN', 'auth', 'SUCCESS', `Role: ${user.role}`);
      
      const { password: _, ...userPayload } = user;
      return { success: true, token, user: userPayload };
    } else {
      // Register failed attempt
      const attempts = lockout ? lockout.count + 1 : 1;
      const lockUntil = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
      lockouts[cleanId] = { count: attempts, lockUntil };
      writeDb('retrocheck_lockouts', lockouts);
      
      if (attempts >= 5) {
        logAuditEvent(cleanId, 'ACCOUNT_LOCKOUT', 'auth', 'LOCKED', 'Locked due to 5 consecutive failed login attempts');
      }
      logAuditEvent(cleanId, 'LOGIN', 'auth', 'FAILURE', 'Incorrect password');
      throw new Error('Credenciales inválidas.');
    }
  },

  // 2. Admin Summary metrics
  getAdminSummary: async () => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'admin') {
      throw new Error('Permisos insuficientes.');
    }

    const currentUsers = readDb('retrocheck_users', defaultUsers);
    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const currentSessions = readDb('retrocheck_sessions', []);
    const currentAttendance = readDb('retrocheck_attendance', []);

    const totalClasses = currentClasses.length;
    const totalTeachers = currentUsers.filter(u => u.role === 'teacher').length;
    const totalStudents = currentUsers.filter(u => u.role === 'student').length;

    const completedSessions = currentSessions.filter(s => s.status === 'completed');
    let globalRate = 0;
    if (completedSessions.length > 0) {
      let totalRatesSum = 0;
      completedSessions.forEach(session => {
        const cls = currentClasses.find(c => c.id === session.classId);
        const rosterCount = cls ? cls.students.length : 0;
        if (rosterCount > 0) {
          const presentsCount = currentAttendance.filter(
            a => a.sessionId === session.id && (a.status === 'Presente' || a.status === 'Tarde')
          ).length;
          totalRatesSum += (presentsCount / rosterCount) * 100;
        }
      });
      globalRate = parseFloat((totalRatesSum / completedSessions.length).toFixed(1));
    } else {
      globalRate = 90.0; // Default demo rate
    }

    return {
      success: true,
      data: {
        totalClasses,
        totalTeachers,
        totalStudents,
        averageAttendance: globalRate
      }
    };
  },

  // 3. Admin Teachers list
  getTeachers: async () => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'admin') {
      throw new Error('Permisos insuficientes.');
    }
    const currentUsers = readDb('retrocheck_users', defaultUsers);
    const teachers = currentUsers.filter(u => u.role === 'teacher').map(({ password: _, ...t }) => t);
    return { success: true, data: teachers };
  },

  // 4. Assign Class
  assignClass: async (classId, teacherId, schedule) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'admin') {
      throw new Error('Permisos insuficientes.');
    }

    if (!validateId(classId) || !validateId(teacherId)) {
      throw new Error('Identificadores inválidos.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const classIdx = currentClasses.findIndex(c => c.id === classId);
    if (classIdx === -1) throw new Error('Clase no encontrada.');

    const currentUsers = readDb('retrocheck_users', defaultUsers);
    const teacher = currentUsers.find(u => u.id === teacherId && u.role === 'teacher');
    if (!teacher) throw new Error('Profesor no registrado.');

    currentClasses[classIdx].teacherId = teacher.id;
    currentClasses[classIdx].teacherName = teacher.name;
    if (schedule) {
      currentClasses[classIdx].schedule = schedule;
    }

    writeDb('retrocheck_classes', currentClasses);
    logAuditEvent(requester.id, 'ASSIGN_CLASS_TEACHER', classId, 'SUCCESS', `Assigned teacher ${teacherId} schedule ${schedule}`);
    return { success: true, data: currentClasses[classIdx] };
  },

  // 5. General Class List
  getClasses: async () => {
    await sleep();
    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    return { success: true, data: currentClasses };
  },

  createClass: async (name, schedule) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'admin') {
      throw new Error('Permisos insuficientes.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const newClass = {
      id: `clase-${Date.now().toString(36)}`,
      name,
      schedule: schedule || 'No asignado',
      teacherId: null,
      teacherName: 'No asignado',
      students: []
    };

    currentClasses.push(newClass);
    writeDb('retrocheck_classes', currentClasses);
    logAuditEvent(requester.id, 'CREATE_CLASS', newClass.id, 'SUCCESS', `Class: ${name}`);
    return { success: true, data: newClass };
  },

  // 6. Manage Students
  addStudentsToClass: async (classId, studentList) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || (requester.role !== 'admin' && requester.role !== 'teacher')) {
      throw new Error('Permisos insuficientes.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const classIdx = currentClasses.findIndex(c => c.id === classId);
    if (classIdx === -1) throw new Error('Clase no encontrada.');

    const currentUsers = readDb('retrocheck_users', defaultUsers);

    studentList.forEach(student => {
      const cleanId = String(student.id).trim();
      const cleanName = String(student.name).trim();

      if (!cleanId || !cleanName) return;

      const roster = currentClasses[classIdx].students;
      if (!roster.some(s => s.id === cleanId)) {
        roster.push({ id: cleanId, name: cleanName });
      }

      // Ensure global student account exists
      if (!currentUsers.some(u => u.id === cleanId)) {
        currentUsers.push({
          id: cleanId,
          name: cleanName,
          role: 'student',
          password: 'student95'
        });
      }
    });

    writeDb('retrocheck_classes', currentClasses);
    writeDb('retrocheck_users', currentUsers);
    logAuditEvent(requester.id, 'ADD_STUDENTS_TO_CLASS', classId, 'SUCCESS', `Added ${studentList.length} students`);
    return { success: true, data: currentClasses[classIdx] };
  },

  removeStudentFromClass: async (classId, studentId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || (requester.role !== 'admin' && requester.role !== 'teacher')) {
      throw new Error('Permisos insuficientes.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const classIdx = currentClasses.findIndex(c => c.id === classId);
    if (classIdx === -1) throw new Error('Clase no encontrada.');

    currentClasses[classIdx].students = currentClasses[classIdx].students.filter(s => s.id !== studentId);
    writeDb('retrocheck_classes', currentClasses);
    logAuditEvent(requester.id, 'REMOVE_STUDENT_FROM_CLASS', classId, 'SUCCESS', `Removed student: ${studentId}`);
    return { success: true, data: currentClasses[classIdx] };
  },

  // 7. Teacher specific classes
  getTeacherClasses: async (teacherId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester) throw new Error('Se requiere sesión activa.');

    if (requester.role === 'teacher' && requester.id !== teacherId) {
      logAuditEvent(requester.id, 'BOLA_VIOLATION_ATTEMPT', teacherId, 'BLOCKED', 'Attempted retrieve other classes');
      throw new Error('Acceso denegado a las clases de otro profesor.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const teacherClasses = currentClasses.filter(c => c.teacherId === teacherId);
    return { success: true, data: teacherClasses };
  },

  // 8. Active session queries (Student Privacy - OWASP Data Minimization)
  getActiveSession: async (teacherId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester) throw new Error('Se requiere sesión activa.');

    const sessions = readDb('retrocheck_sessions', []);
    let activeSession = null;
    
    if (teacherId) {
      activeSession = sessions.find(s => s.status === 'active' && s.teacherId === teacherId);
    } else {
      activeSession = sessions.find(s => s.status === 'active');
    }

    if (!activeSession) {
      return { success: true, active: false };
    }

    // Data minimization check
    if (requester.role === 'student') {
      const attendance = readDb('retrocheck_attendance', []);
      const checkedIn = attendance.some(a => a.sessionId === activeSession.id && a.studentId === requester.id);
      return {
        success: true,
        active: true,
        session: {
          id: activeSession.id,
          classId: activeSession.classId,
          className: activeSession.className,
          date: activeSession.date,
          ipAddress: activeSession.ipAddress
        },
        checkedIn
      };
    }

    // Return full list for teacher/admin
    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const cls = currentClasses.find(c => c.id === activeSession.classId);
    const attendance = readDb('retrocheck_attendance', []);
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

    return {
      success: true,
      active: true,
      session: activeSession,
      attendance: currentAttendanceGrid
    };
  },

  // Start Session (Teacher)
  startSession: async (classId, teacherId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'teacher') {
      throw new Error('Permisos insuficientes.');
    }

    if (requester.id !== teacherId) {
      logAuditEvent(requester.id, 'SESSION_START_VIOLATION', classId, 'BLOCKED', `Start session for alternate teacher: ${teacherId}`);
      throw new Error('No puedes iniciar sesión a nombre de otro profesor.');
    }

    const sessions = readDb('retrocheck_sessions', []);
    const activeSessionIdx = sessions.findIndex(s => s.status === 'active' && s.teacherId === teacherId);
    if (activeSessionIdx !== -1) {
      throw new Error('Ya tienes una sesión de asistencia activa. Debes finalizarla primero.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const cls = currentClasses.find(c => c.id === classId && c.teacherId === teacherId);
    if (!cls) throw new Error('Clase no encontrada.');

    const sessionId = `session-${Date.now().toString(36)}`;
    const newSession = {
      id: sessionId,
      classId: cls.id,
      className: cls.name,
      teacherId,
      date: new Date().toISOString(),
      status: 'active',
      ipAddress: '192.168.1.100' // Simulated local IP
    };

    sessions.push(newSession);
    writeDb('retrocheck_sessions', sessions);
    logAuditEvent(requester.id, 'START_SESSION', sessionId, 'SUCCESS', `Class: ${cls.name}`);

    // Dynamic QR URL based on the current window origin so it works 100% on Netlify!
    const origin = window.location.origin;
    return {
      success: true,
      session: newSession,
      qrUrl: `${origin}/checkin/${sessionId}`
    };
  },

  // Manual Attendance override
  overrideAttendance: async (sessionId, studentId, status) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || (requester.role !== 'teacher' && requester.role !== 'admin')) {
      throw new Error('Permisos insuficientes.');
    }

    const sessions = readDb('retrocheck_sessions', []);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Sesión no encontrada.');

    if (requester.role === 'teacher' && session.teacherId !== requester.id) {
      throw new Error('Acceso denegado. No eres el titular de esta sesión.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const cls = currentClasses.find(c => c.id === session.classId);
    if (!cls) throw new Error('Materia no encontrada.');

    const student = cls.students.find(s => s.id === studentId);
    if (!student) throw new Error('Estudiante no matriculado.');

    const attendance = readDb('retrocheck_attendance', []);
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

    writeDb('retrocheck_attendance', attendance);
    logAuditEvent(requester.id, 'MANUAL_OVERRIDE', studentId, 'SUCCESS', `Set ${status} in session ${sessionId}`);
    return { success: true };
  },

  // End Session (Teacher)
  endSession: async (sessionId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'teacher') {
      throw new Error('Permisos insuficientes.');
    }

    const sessions = readDb('retrocheck_sessions', []);
    const sessionIdx = sessions.findIndex(s => s.id === sessionId);
    if (sessionIdx === -1) throw new Error('Sesión no encontrada.');

    if (sessions[sessionIdx].teacherId !== requester.id) {
      throw new Error('No tienes permisos para cerrar la sesión de otro profesor.');
    }

    sessions[sessionIdx].status = 'completed';
    writeDb('retrocheck_sessions', sessions);

    // Save defaults as 'Ausente' for anyone in roster who hasn't checked in
    const session = sessions[sessionIdx];
    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const cls = currentClasses.find(c => c.id === session.classId);
    const students = cls ? cls.students : [];
    const attendance = readDb('retrocheck_attendance', []);

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

    writeDb('retrocheck_attendance', attendance);
    logAuditEvent(requester.id, 'END_SESSION', sessionId, 'SUCCESS');
    return { success: true, session: sessions[sessionIdx] };
  },

  // Student Check-In (IDOR protected - OWASP A01)
  checkIn: async (sessionId, studentId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role !== 'student') {
      throw new Error('Se requiere sesión de alumno activa.');
    }

    // BOLA validation
    if (requester.id !== studentId) {
      logAuditEvent(requester.id, 'IDOR_CHECKIN_ATTEMPT', studentId, 'BLOCKED', `Tried checking in student ID: ${studentId}`);
      throw new Error('Intento de suplantación bloqueado. Solo puedes registrar tu propio ID.');
    }

    const sessions = readDb('retrocheck_sessions', []);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('La sesión de asistencia no existe.');
    if (session.status !== 'active') throw new Error('La sesión de asistencia ha expirado o está cerrada.');

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const cls = currentClasses.find(c => c.id === session.classId);
    if (!cls) throw new Error('La materia asociada ya no existe.');

    const student = cls.students.find(s => s.id.toLowerCase() === studentId.trim().toLowerCase());
    if (!student) {
      throw new Error('Tu matrícula no está inscrita en la lista de esta materia.');
    }

    const attendance = readDb('retrocheck_attendance', []);
    const alreadyChecked = attendance.some(a => a.sessionId === sessionId && a.studentId === student.id);
    if (alreadyChecked) {
      throw new Error('Ya has registrado tu asistencia en esta sesión.');
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
    writeDb('retrocheck_attendance', attendance);
    logAuditEvent(student.id, 'STUDENT_CHECKIN', sessionId, 'SUCCESS', `Class: ${session.className}`);

    return {
      success: true,
      data: {
        studentName: student.name,
        className: session.className,
        timestamp: record.timestamp
      }
    };
  },

  // Student history reports
  getStudentHistory: async (studentId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester) throw new Error('Se requiere sesión activa.');

    if (requester.role === 'student' && requester.id !== studentId) {
      logAuditEvent(requester.id, 'BOLA_HISTORY_ATTEMPT', studentId, 'BLOCKED', 'Attempted retrieve other student history');
      throw new Error('Acceso denegado a información externa.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const sessions = readDb('retrocheck_sessions', []);
    const attendance = readDb('retrocheck_attendance', []);

    const enrolledClasses = currentClasses.filter(c => c.students.some(s => s.id === studentId));

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

    return { success: true, data: history };
  },

  // Get past session records for reports (completed sessions)
  getSessionsHistory: async (classId) => {
    await sleep();
    const sessions = readDb('retrocheck_sessions', []);
    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const attendance = readDb('retrocheck_attendance', []);

    const completedSessions = sessions.filter(
      s => s.status === 'completed' && (!classId || s.classId === classId)
    );

    const data = completedSessions.map(session => {
      const cls = currentClasses.find(c => c.id === session.classId);
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

    return { success: true, data };
  },

  // Get details of a specific session (roster + attendance status)
  getSessionAttendance: async (sessionId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role === 'student') {
      throw new Error('Permisos insuficientes.');
    }

    const attendance = readDb('retrocheck_attendance', []);
    const records = attendance.filter(a => a.sessionId === sessionId);
    return { success: true, data: records };
  },

  // Client-Side CSV Exporter with Formula injection mitigation (OWASP A03:2021)
  exportClassCSV: async (classId) => {
    await sleep();
    const requester = getRequesterFromToken();
    if (!requester || requester.role === 'student') {
      throw new Error('Permisos insuficientes.');
    }

    const currentClasses = readDb('retrocheck_classes', defaultClasses);
    const sessions = readDb('retrocheck_sessions', []);
    const attendance = readDb('retrocheck_attendance', []);

    const cls = currentClasses.find(c => c.id === classId);
    if (!cls) throw new Error('Clase no encontrada.');

    const classSessions = sessions.filter(s => s.classId === classId && s.status === 'completed');
    
    // Header
    let csvContent = `${sanitizeCSVField('Matricula')},${sanitizeCSVField('Nombre Estudiante')}`;
    classSessions.forEach(s => {
      const formattedDate = new Date(s.date).toLocaleDateString('es-MX', {
        month: '2-digit',
        day: '2-digit'
      });
      csvContent += `,${sanitizeCSVField(formattedDate)}`;
    });
    csvContent += `,${sanitizeCSVField('Porcentaje Asistencia')}\n`;

    // Rows
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

    logAuditEvent(requester.id, 'EXPORT_REPORTS_CSV', classId, 'SUCCESS');
    return csvContent;
  }
};
