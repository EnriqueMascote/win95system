const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Retrieve the stored JWT token
  const token = localStorage.getItem('retrocheck_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add JWT Authorization header if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Login now takes both username and password
  login: (userId, password) => request('/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password }),
  }),

  getAdminSummary: () => request('/admin/summary'),
  getTeachers: () => request('/admin/teachers'),
  assignClass: (classId, teacherId, schedule) => request('/admin/assign-class', {
    method: 'POST',
    body: JSON.stringify({ classId, teacherId, schedule }),
  }),

  getClasses: () => request('/classes'),
  createClass: (name, schedule) => request('/classes', {
    method: 'POST',
    body: JSON.stringify({ name, schedule }),
  }),
  addStudentsToClass: (classId, students) => request(`/classes/${classId}/students`, {
    method: 'POST',
    body: JSON.stringify({ students }),
  }),
  removeStudentFromClass: (classId, studentId) => request(`/classes/${classId}/students/${studentId}`, {
    method: 'DELETE',
  }),

  getTeacherClasses: (teacherId) => request(`/teacher/${teacherId}/classes`),

  getActiveSession: (teacherId) => {
    const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
    return request(`/sessions/active${query}`);
  },
  startSession: (classId, teacherId) => request('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ classId, teacherId }),
  }),
  overrideAttendance: (sessionId, studentId, status) => request(`/sessions/${sessionId}/override`, {
    method: 'POST',
    body: JSON.stringify({ studentId, status }),
  }),
  endSession: (sessionId) => request(`/sessions/${sessionId}/end`, {
    method: 'POST',
  }),

  checkIn: (sessionId, studentId) => request('/checkin', {
    method: 'POST',
    body: JSON.stringify({ sessionId, studentId }),
  }),

  getStudentHistory: (studentId) => request(`/student/${studentId}/history`),

  getSessionsHistory: (classId) => {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    return request(`/reports/sessions${query}`);
  },
};
