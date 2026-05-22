import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';

export default function AttendanceSession({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active session states
  const [isActive, setIsActive] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

  // Form states
  const [selectedClassId, setSelectedClassId] = useState('');

  // Load teacher classes
  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getTeacherClasses(user.id);
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) {
          setSelectedClassId(response.data[0].id);
        }
      }
    } catch (err) {
      setError('Error al recuperar tus clases.');
    } finally {
      setLoading(false);
    }
  };

  // Check for existing active session
  const checkActiveSession = async () => {
    try {
      const response = await api.getActiveSession(user.id);
      if (response.success && response.active) {
        setIsActive(true);
        setSessionInfo(response.session);
        setAttendanceList(response.attendance);
      } else {
        setIsActive(false);
        setSessionInfo(null);
        setAttendanceList([]);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    }
  };

  useEffect(() => {
    loadClasses();
    checkActiveSession();
  }, []);

  // Poll for student check-ins when session is active
  useEffect(() => {
    if (!isActive || !sessionInfo) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getActiveSession(user.id);
        if (response.success && response.active) {
          setAttendanceList(response.attendance);
        } else if (response.success && !response.active) {
          // Session was ended somewhere else
          setIsActive(false);
          setSessionInfo(null);
          setAttendanceList([]);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500); // 1.5 seconds polling rate for near-real-time update

    return () => clearInterval(pollInterval);
  }, [isActive, sessionInfo]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    try {
      setError('');
      setSuccess('');
      const response = await api.startSession(selectedClassId, user.id);
      if (response.success) {
        setIsActive(true);
        setSessionInfo(response.session);
        setSuccess('Sesión de asistencia iniciada.');
        checkActiveSession();
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    }
  };

  const handleOverrideStatus = async (studentId, status) => {
    if (!sessionInfo) return;
    try {
      const response = await api.overrideAttendance(sessionInfo.id, studentId, status);
      if (response.success) {
        // Optimistic local update
        setAttendanceList(prev =>
          prev.map(item =>
            item.id === studentId ? { ...item, status } : item
          )
        );
      }
    } catch (err) {
      setError('No se pudo modificar el estado del estudiante.');
    }
  };

  const handleEndSession = async () => {
    if (!sessionInfo) return;
    if (!window.confirm('¿Finalizar esta sesión de asistencia? Los estudiantes no marcados serán registrados como Ausentes.')) return;

    try {
      setError('');
      const response = await api.endSession(sessionInfo.id);
      if (response.success) {
        setIsActive(false);
        setSessionInfo(null);
        setAttendanceList([]);
        setSuccess('Sesión finalizada y guardada en el historial escolar.');
      }
    } catch (err) {
      setError('Error al finalizar la sesión.');
    }
  };

  if (loading && classes.length === 0) {
    return <div style={{ padding: '10px' }}>Iniciando antenas de red...</div>;
  }

  // Generate QR check-in url
  const localPort = window.location.port || '5000'; // Fallback to 5000
  const qrUrl = sessionInfo 
    ? `http://${sessionInfo.ipAddress}:${localPort}/checkin/${sessionInfo.id}`
    : '';

  return (
    <div style={{ minWidth: '550px' }}>
      
      {/* Session starting form */}
      {!isActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p>
            <strong>Radiofrecuencia escolar:</strong> Selecciona una de tus clases asignadas para generar el código QR de check-in.
          </p>

          {classes.length === 0 ? (
            <div className="win-inset" style={{ padding: '25px', textAlign: 'center', fontStyle: 'italic', backgroundColor: '#e0e0e0' }}>
              ⚠️ No tienes clases asignadas por el administrador en este horario.
            </div>
          ) : (
            <form onSubmit={handleStartSession} className="win-fieldset" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <legend className="win-legend">Iniciar Sesión de Toma de Asistencia</legend>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="active-class-select" style={{ fontWeight: 'bold' }}>Materia:</label>
                <select
                  id="active-class-select"
                  className="win-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.schedule})</option>
                  ))}
                </select>
                <button type="submit" className="win-button" style={{ fontWeight: 'bold' }}>
                  📡 Iniciar Canal QR
                </button>
              </div>
            </form>
          )}

          {success && <div style={{ color: 'green' }}>✅ {success}</div>}
          {error && <div style={{ color: 'red' }}>⚠️ {error}</div>}
        </div>
      ) : (
        /* Active session dashboard */
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
          
          {/* Left panel: Info & QR code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <fieldset className="win-fieldset" style={{ width: '100%', textAlign: 'center' }}>
              <legend className="win-legend">Código QR Escolar</legend>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #808080',
                  boxShadow: 'inset 1px 1px 0 #000',
                  marginBottom: '10px'
                }}
              >
                <QRCodeSVG value={qrUrl} size={150} />
              </div>
              <p style={{ fontSize: '10px', wordBreak: 'break-all', fontStyle: 'italic', color: '#333' }}>
                {qrUrl}
              </p>
            </fieldset>

            <fieldset className="win-fieldset" style={{ width: '100%', fontSize: '11px' }}>
              <legend className="win-legend">Red Local</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '2px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>Servidor:</span>
                <span>{sessionInfo.ipAddress}</span>
                <span style={{ fontWeight: 'bold' }}>Puerto:</span>
                <span>{localPort}</span>
                <span style={{ fontWeight: 'bold' }}>Materia:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--win-title-bg)' }}>{sessionInfo.className}</span>
              </div>
            </fieldset>

            <button
              className="win-button"
              onClick={handleEndSession}
              style={{ width: '100%', fontWeight: 'bold', height: '35px', backgroundColor: '#ffcccc' }}
            >
              🛑 Cerrar Asistencia
            </button>
          </div>

          {/* Right panel: Real-time Check-ins roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Estudiantes Registrándose en Tiempo Real:</strong>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                Presentes: {attendanceList.filter(a => a.status === 'Presente' || a.status === 'Tarde').length} / {attendanceList.length}
              </div>
            </div>

            <div className="win-table-container win-inset" style={{ height: '300px', overflowY: 'auto' }}>
              <table className="win-table">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Estudiante</th>
                    <th>Estado de Registro</th>
                    <th>Controles Profesor</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map(student => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td style={{ fontWeight: 'bold' }}>
                        {student.status === 'Presente' && <span style={{ color: 'green' }}>✅ Presente</span>}
                        {student.status === 'Tarde' && <span style={{ color: 'orange' }}>⏳ Tarde</span>}
                        {student.status === 'Excusa' && <span style={{ color: 'blue' }}>🩹 Justificado</span>}
                        {student.status === 'Ausente' && <span style={{ color: 'red' }}>❌ Ausente</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button
                            className="win-button"
                            onClick={() => handleOverrideStatus(student.id, 'Presente')}
                            style={{ padding: '1px 4px', fontSize: '9px', fontWeight: student.status === 'Presente' ? 'bold' : 'normal' }}
                            title="Marcar Presente"
                          >
                            P
                          </button>
                          <button
                            className="win-button"
                            onClick={() => handleOverrideStatus(student.id, 'Tarde')}
                            style={{ padding: '1px 4px', fontSize: '9px', fontWeight: student.status === 'Tarde' ? 'bold' : 'normal' }}
                            title="Marcar Tarde"
                          >
                            T
                          </button>
                          <button
                            className="win-button"
                            onClick={() => handleOverrideStatus(student.id, 'Excusa')}
                            style={{ padding: '1px 4px', fontSize: '9px', fontWeight: student.status === 'Excusa' ? 'bold' : 'normal' }}
                            title="Justificante"
                          >
                            E
                          </button>
                          <button
                            className="win-button"
                            onClick={() => handleOverrideStatus(student.id, 'Ausente')}
                            style={{ padding: '1px 4px', fontSize: '9px', fontWeight: student.status === 'Ausente' ? 'bold' : 'normal' }}
                            title="Marcar Ausente"
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div style={{ color: 'red', fontSize: '11px' }}>⚠️ {error}</div>}
          </div>

        </div>
      )}

    </div>
  );
}
