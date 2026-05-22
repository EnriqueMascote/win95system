import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Reports({ user }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessions, setSessions] = useState([]);
  
  // Detail panel state
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = user.role === 'admin'
        ? await api.getClasses()
        : await api.getTeacherClasses(user.id);
        
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0) {
          setSelectedClassId(response.data[0].id);
        }
      }
    } catch (err) {
      setError('Error al recuperar las asignaturas.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!selectedClassId) return;
    try {
      setError('');
      const response = await api.getSessionsHistory(selectedClassId);
      if (response.success) {
        setSessions(response.data);
        setActiveSessionId(null);
        setSessionDetail([]);
      }
    } catch (err) {
      setError('Error al cargar historial de sesiones.');
    }
  };

  const loadSessionDetail = async (sessionId) => {
    try {
      setError('');
      // In this local JSON implementation, we fetch from standard active session logic
      // but adapted for historical logs as well.
      // Let's call the endpoint to get details of a completed session.
      // In the backend, we fetch active session details or completed sessions.
      // Let's retrieve attendance records for a specific session.
      const response = await api.getSessionsHistory(selectedClassId);
      if (response.success) {
        // Find session details in attendance database
        // In our server.js, we have: `GET /api/sessions/:sessionId/attendance`?
        // Wait, we don't have it directly mapping, but we have `GET /api/sessions/:sessionId/attendance` in context or we can fetch attendance.
        // Let's check `server.js` endpoints. Ah, yes! We have `GET /api/sessions/:sessionId/attendance` in context, let's verify if we implemented it.
        // Wait, looking at `server.js`:
        // We defined it in the context but let's check what we actually implemented in the file.
        // In the file, did we implement `/api/sessions/:sessionId/attendance`? Let's check the code we wrote for `server.js`.
        // Wait! In `server.js`, we did NOT implement `/api/sessions/:sessionId/attendance` directly. We implemented `/api/reports/sessions` which aggregates them, but wait, we need detail!
        // Wait, how do we show details of a session?
        // Ah! In `server.js` we have:
        // `GET /api/sessions/active` which returns active session details.
        // But what about completed sessions?
        // Let's add `/api/sessions/:sessionId/attendance` to `server.js` if it's missing, or we can fetch from a generic endpoint, or let's inspect `server.js` to see what endpoints exist.
        // Let's check the code in `server.js`:
        // Wait! I wrote `server.js` using `write_to_file`. Let's recall the endpoints I wrote there.
        // I wrote:
        // `GET /api/sessions/active`
        // `POST /api/sessions/start`
        // `POST /api/sessions/:sessionId/override`
        // `POST /api/sessions/:sessionId/end`
        // `POST /api/checkin`
        // `GET /api/student/:studentId/history`
        // `GET /api/reports/sessions`
        // `GET /api/reports/export/:classId`
        // Yes! We do NOT have a specific `GET /api/sessions/:sessionId/attendance` endpoint for completed sessions.
        // Oh, wait! How do we display the roster detail of a completed session?
        // Let's look at `server.js` - did we write anything for it?
        // Actually, we can fetch all attendance records from the server, or we can add a quick endpoint in `server.js` if we need it!
        // Wait, is it necessary?
        // Yes, showing student-by-student details of a past session is very useful. Let's see: we can query the backend.
        // Let's add a small endpoint to `server.js` to return all attendance records for a specific session ID. That would make `Reports.jsx` extremely clean and robust.
        // Wait! We can edit `server.js` to add:
        // ```javascript
        // app.get('/api/sessions/:sessionId/attendance', (req, res) => {
        //   const { sessionId } = req.params;
        //   const attendance = readJSON(ATTENDANCE_FILE);
        //   const records = attendance.filter(a => a.sessionId === sessionId);
        //   res.json({ success: true, data: records });
        // });
        // ```
        // Let's add it! That is very clean.
        // Let's first write `Reports.jsx` assuming it makes a call to `/api/sessions/${sessionId}/attendance` which is standard. We will implement the endpoint in `server.js` right after.
      }
      
      // Fetch session details from the api wrapper
      const responseDetail = await api.getSessionAttendance(sessionId);
      if (responseDetail.success) {
        setSessionDetail(responseDetail.data);
        setActiveSessionId(sessionId);
      }
    } catch (err) {
      setError('Error al recuperar detalles de la sesión.');
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedClassId]);

  const handleExportCSV = async () => {
    if (!selectedClassId) return;
    try {
      const csvContent = await api.exportClassCSV(selectedClassId);
      // Create blob with UTF-8 BOM (\uFEFF / [0xEF, 0xBB, 0xBF]) for Excel compatibility
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_${selectedClassId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Error al exportar reporte.');
    }
  };

  if (loading && classes.length === 0) {
    return <div style={{ padding: '10px' }}>Preparando hojas de asistencia...</div>;
  }

  const activeSessionObj = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '15px', minWidth: '600px' }}>
      
      {/* Sidebar selection */}
      <fieldset className="win-fieldset" style={{ height: '100%' }}>
        <legend className="win-legend">Seleccionar Materia</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <select
            className="win-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ width: '100%' }}
          >
            {classes.length === 0 ? (
              <option value="">No hay clases asignadas</option>
            ) : (
              classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>

          <button
            className="win-button"
            onClick={handleExportCSV}
            disabled={!selectedClassId || sessions.length === 0}
            style={{ marginTop: '10px', fontWeight: 'bold' }}
          >
            📊 Exportar CSV (Excel)
          </button>
        </div>
      </fieldset>

      {/* Reports Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Table of Completed Sessions */}
        <fieldset className="win-fieldset">
          <legend className="win-legend">Historial de Sesiones Completadas</legend>
          <div className="win-table-container win-inset" style={{ maxHeight: '160px', overflowY: 'auto' }}>
            <table className="win-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Inscriptos</th>
                  <th>Presentes</th>
                  <th>Tardes</th>
                  <th>Ausentes</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                      No hay registros de asistencias completadas para esta materia.
                    </td>
                  </tr>
                ) : (
                  sessions.map(s => {
                    const localDate = new Date(s.date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <tr key={s.id}>
                        <td>{localDate}</td>
                        <td>{s.rosterCount}</td>
                        <td style={{ color: 'green', fontWeight: 'bold' }}>{s.presents}</td>
                        <td style={{ color: 'orange', fontWeight: 'bold' }}>{s.lates}</td>
                        <td style={{ color: 'red', fontWeight: 'bold' }}>{s.absents}</td>
                        <td>
                          <button
                            className="win-button"
                            onClick={() => loadSessionDetail(s.id)}
                            style={{ padding: '0px 6px', fontSize: '10px' }}
                          >
                            👁️ Detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </fieldset>

        {/* Selected Session Roster Grid */}
        {activeSessionId && activeSessionObj && (
          <fieldset className="win-fieldset">
            <legend className="win-legend">
              Detalle de Roster: {new Date(activeSessionObj.date).toLocaleDateString()}
            </legend>
            <div className="win-table-container win-inset" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table className="win-table">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nombre</th>
                    <th>Estado Registrado</th>
                    <th>Hora Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionDetail.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                        No hay firmas registradas en esta sesión.
                      </td>
                    </tr>
                  ) : (
                    sessionDetail.map(r => (
                      <tr key={r.studentId}>
                        <td>{r.studentId}</td>
                        <td>{r.studentName}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          {r.status === 'Presente' && <span style={{ color: 'green' }}>✅ Presente</span>}
                          {r.status === 'Tarde' && <span style={{ color: 'orange' }}>⏳ Tarde</span>}
                          {r.status === 'Excusa' && <span style={{ color: 'blue' }}>🩹 Justificado</span>}
                          {r.status === 'Ausente' && <span style={{ color: 'red' }}>❌ Ausente</span>}
                        </td>
                        <td>
                          {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </fieldset>
        )}

        {error && <div style={{ color: 'red', fontSize: '11px' }}>⚠️ {error}</div>}
      </div>

    </div>
  );
}
