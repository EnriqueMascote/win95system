import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function StudentCheckIn({ sessionId }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Portal states
  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' | 'history'
  const [sessionData, setSessionData] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLogoPulsing, setIsLogoPulsing] = useState(false);

  // Check if token exists on load and retrieve user
  useEffect(() => {
    const token = localStorage.getItem('retrocheck_token');
    if (token) {
      // Decode JWT payload locally to get user profile
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.role === 'student') {
          setStudent(payload);
        } else {
          // Token is for teacher/admin, clear it for student view
          localStorage.removeItem('retrocheck_token');
        }
      } catch (err) {
        localStorage.removeItem('retrocheck_token');
      }
    }
  }, []);

  // Fetch session details when student is set and sessionId is present
  useEffect(() => {
    if (!student || !sessionId) return;
    
    const fetchSession = async () => {
      setLoading(true);
      setSessionError('');
      try {
        setIsLogoPulsing(true);
        const res = await api.getActiveSession();
        if (res.success && res.active && res.session.id === sessionId) {
          setSessionData({
            ...res.session,
            checkedIn: res.checkedIn
          });
          if (res.checkedIn) {
            setCheckinSuccess({
              className: res.session.className,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          setSessionError('Esta sesión de asistencia no se encuentra activa.');
        }
      } catch (err) {
        setSessionError('Error al conectar con la antena local.');
      } finally {
        setLoading(false);
        setIsLogoPulsing(false);
      }
    };

    fetchSession();
  }, [student, sessionId]);

  // Load student history
  const loadHistory = async () => {
    if (!student) return;
    setHistoryLoading(true);
    try {
      setIsLogoPulsing(true);
      const res = await api.getStudentHistory(student.id);
      if (res.success) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setHistoryLoading(false);
      setIsLogoPulsing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError('Campos vacíos.');
      return;
    }

    setLoginError('');
    setLoading(true);
    setIsLogoPulsing(true);

    try {
      const res = await api.login(loginId, loginPassword);
      if (res.success) {
        if (res.user.role !== 'student') {
          setLoginError('Acceso restringido a alumnos.');
          localStorage.removeItem('retrocheck_token');
          return;
        }
        localStorage.setItem('retrocheck_token', res.token);
        setStudent(res.user);
      }
    } catch (err) {
      setLoginError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
      setIsLogoPulsing(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!student || !sessionId) return;
    setLoading(true);
    setSessionError('');
    setIsLogoPulsing(true);
    
    try {
      const res = await api.checkIn(sessionId, student.id);
      if (res.success) {
        setCheckinSuccess(res.data);
        if (sessionData) {
          setSessionData(prev => ({ ...prev, checkedIn: true }));
        }
      }
    } catch (err) {
      setSessionError(err.message || 'Error al registrar tu asistencia.');
    } finally {
      setLoading(false);
      setIsLogoPulsing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('retrocheck_token');
    setStudent(null);
    setSessionData(null);
    setCheckinSuccess(null);
    setHistoryData([]);
    setActiveTab('checkin');
  };

  return (
    <div className="netscape-container">
      {/* Netscape Title Bar */}
      <div className="netscape-titlebar">
        <span className="netscape-title">Netscape Navigator - [RetroCheck 95 Attendance Gateway]</span>
        <div className="netscape-title-controls">
          <button className="netscape-title-btn">_</button>
          <button className="netscape-title-btn">[]</button>
          <button className="netscape-title-btn netscape-close-btn">X</button>
        </div>
      </div>

      {/* Netscape Menu Bar */}
      <div className="netscape-menu-bar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Go</span>
        <span>Bookmarks</span>
        <span>Options</span>
        <span>Directory</span>
        <span>Window</span>
        <span>Help</span>
      </div>

      {/* Netscape Toolbar Buttons & Pulsing Logo */}
      <div className="netscape-toolbar">
        <div className="netscape-buttons">
          <button className="netscape-tool-btn" onClick={() => window.history.back()} title="Back">
            <span className="netscape-icon">⬅️</span>
            <span>Back</span>
          </button>
          <button className="netscape-tool-btn" onClick={() => window.history.forward()} title="Forward">
            <span className="netscape-icon">➡️</span>
            <span>Forward</span>
          </button>
          <button className="netscape-tool-btn" onClick={() => window.location.reload()} title="Home">
            <span className="netscape-icon">🏠</span>
            <span>Home</span>
          </button>
          <button className="netscape-tool-btn" onClick={() => window.location.reload()} title="Reload">
            <span className="netscape-icon">🔄</span>
            <span>Reload</span>
          </button>
          <button className="netscape-tool-btn" title="Open">
            <span className="netscape-icon">📂</span>
            <span>Open</span>
          </button>
          <button className="netscape-tool-btn" title="Print">
            <span className="netscape-icon">🖨️</span>
            <span>Print</span>
          </button>
          <button className="netscape-tool-btn" title="Find">
            <span className="netscape-icon">🔍</span>
            <span>Find</span>
          </button>
          <button className="netscape-tool-btn" title="Stop">
            <span className="netscape-icon">🛑</span>
            <span>Stop</span>
          </button>
        </div>

        {/* Dynamic Pulsing Netscape Logo */}
        <div className={`netscape-logo ${isLogoPulsing ? 'logo-active' : ''}`}>
          <div className="logo-letter">N</div>
          <div className="logo-dots"></div>
        </div>
      </div>

      {/* Address / Location Bar */}
      <div className="netscape-location-bar">
        <label htmlFor="url-input" className="netscape-netsite-label">Netsite:</label>
        <input 
          id="url-input"
          type="text" 
          className="netscape-url-input" 
          value={window.location.href} 
          readOnly 
        />
      </div>

      {/* Main Netscape Content Screen */}
      <div className="netscape-content-pane win-inset">
        
        {/* Content Box */}
        {!student ? (
          /* Student Login Gateway */
          <div className="netscape-login-box win-outset">
            <div className="netscape-banner">
              ⚠️ Netscape Security Warning: Authentication Required
            </div>
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontFamily: 'serif' }}>RetroCheck 95 - Portal de Estudiantes</h3>
              <p style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '15px' }}>
                Para registrar tu asistencia en la materia actual, inicia sesión con tu matrícula escolar y contraseña.
              </p>

              <form onSubmit={handleStudentLogin}>
                <div className="login-row">
                  <label htmlFor="student-id" style={{ fontWeight: 'bold' }}>Matrícula:</label>
                  <input
                    id="student-id"
                    type="text"
                    className="win-input"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="ej. 20230001"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="login-row" style={{ marginTop: '8px' }}>
                  <label htmlFor="student-pass" style={{ fontWeight: 'bold' }}>Contraseña:</label>
                  <input
                    id="student-pass"
                    type="password"
                    className="win-input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                {loginError && (
                  <div style={{ color: 'red', marginTop: '10px', fontSize: '11px' }}>
                    ⚠️ {loginError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '15px', justifyContent: 'flex-end' }}>
                  <button type="submit" className="win-button" style={{ fontWeight: 'bold', minWidth: '70px' }} disabled={loading}>
                    {loading ? 'Cargando...' : 'Entrar'}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '15px', fontSize: '9px', color: '#666', borderTop: '1px solid #c0c0c0', paddingTop: '8px' }}>
                Nota: La contraseña predeterminada para todos los alumnos en esta simulación es: <strong>student95</strong>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Portal View */
          <div className="netscape-student-portal">
            
            {/* Student Info Dashboard Bar */}
            <div className="netscape-portal-header">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span><strong>Estudiante:</strong> {student.name} ({student.id})</span>
                <span style={{ fontSize: '10px', color: '#444' }}>Conexión segura SSLv3 cifrada en red de la escuela</span>
              </div>
              <button className="win-button" onClick={handleLogout} style={{ fontSize: '10px', padding: '2px 8px' }}>
                Cerrar Sesión
              </button>
            </div>

            {/* Portal Tab Buttons */}
            <div className="netscape-tabs">
              <button 
                className={`netscape-tab-btn ${activeTab === 'checkin' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('checkin')}
              >
                📡 Registrar Asistencia
              </button>
              <button 
                className={`netscape-tab-btn ${activeTab === 'history' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                📊 Mi Historial Escolar
              </button>
            </div>

            {/* Tab Contents */}
            <div className="netscape-tab-body win-outset" style={{ padding: '15px', minHeight: '280px', backgroundColor: '#e0e0e0' }}>
              
              {/* Tab 1: Check-in */}
              {activeTab === 'checkin' && (
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontFamily: 'serif', color: 'darkblue' }}>Registro de Entrada QR</h3>
                  
                  {sessionError && (
                    <div className="netscape-alert win-inset" style={{ color: 'red', backgroundColor: '#ffdcd8', padding: '10px', border: '1px solid red', marginBottom: '15px' }}>
                      <strong>Alerta de Sistema:</strong> {sessionError}
                    </div>
                  )}

                  {checkinSuccess ? (
                    /* Check-in success retro banner */
                    <div className="netscape-success-card win-inset">
                      <div className="success-icon">✔️</div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'green' }}>¡Asistencia Confirmada!</h4>
                      <p style={{ margin: '0', fontSize: '11px', lineHeight: '1.4' }}>
                        Tu asistencia para <strong>{checkinSuccess.className}</strong> ha sido transmitida exitosamente en el servidor escolar.<br />
                        <strong>Fecha/Hora:</strong> {new Date(checkinSuccess.timestamp).toLocaleString('es-MX')}<br />
                        <em>Puedes cerrar este navegador o verificar tu historial escolar en la pestaña de arriba.</em>
                      </p>
                    </div>
                  ) : (
                    /* Roster validation details and Checkin Button */
                    <div>
                      {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <span style={{ fontSize: '24px' }}>⌛</span> Buscando canal de asistencia...
                        </div>
                      ) : sessionData ? (
                        <fieldset className="win-fieldset" style={{ backgroundColor: '#f0f0f0' }}>
                          <legend className="win-legend">Ficha de Sesión Escolar</legend>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '12px' }}>
                            <strong>Clase/Materia:</strong>
                            <span style={{ color: 'darkblue', fontWeight: 'bold' }}>{sessionData.className}</span>
                            <strong>ID de Clase:</strong>
                            <span>{sessionData.classId}</span>
                            <strong>Fecha de Sesión:</strong>
                            <span>{new Date(sessionData.date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>

                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                              className="win-button"
                              onClick={handleConfirmCheckin}
                              style={{ 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                padding: '8px 20px', 
                                backgroundColor: 'lightgreen',
                                cursor: 'pointer'
                              }}
                              disabled={loading}
                            >
                              🚀 Confirmar Mi Asistencia
                            </button>
                          </div>
                        </fieldset>
                      ) : (
                        <div className="win-inset" style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', backgroundColor: '#d0d0d0' }}>
                          📡 Escanea el código QR proporcionado por tu profesor en el salón para cargar los datos del aula.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: History */}
              {activeTab === 'history' && (
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontFamily: 'serif', color: 'darkblue' }}>Mi Historial de Asistencias</h3>
                  
                  {historyLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <span style={{ fontSize: '20px' }}>⌛</span> Extrayendo base de datos escolar...
                    </div>
                  ) : historyData.length === 0 ? (
                    <p style={{ fontStyle: 'italic', textAlign: 'center', color: '#555' }}>
                      No tienes registros de clases asignadas en el sistema.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {historyData.map(cls => (
                        <fieldset key={cls.classId} className="win-fieldset" style={{ backgroundColor: '#ffffff' }}>
                          <legend className="win-legend">{cls.className}</legend>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '10px', fontSize: '10px', textAlign: 'center', borderBottom: '1px solid #c0c0c0', paddingBottom: '8px' }}>
                            <div>
                              <strong>Asistencias</strong>
                              <div style={{ fontSize: '14px', color: 'green', fontWeight: 'bold' }}>{cls.presents}</div>
                            </div>
                            <div>
                              <strong>Retardos</strong>
                              <div style={{ fontSize: '14px', color: 'orange', fontWeight: 'bold' }}>{cls.lates}</div>
                            </div>
                            <div>
                              <strong>Justificados</strong>
                              <div style={{ fontSize: '14px', color: 'blue', fontWeight: 'bold' }}>{cls.excuses}</div>
                            </div>
                            <div>
                              <strong>Faltas</strong>
                              <div style={{ fontSize: '14px', color: 'red', fontWeight: 'bold' }}>{cls.absents}</div>
                            </div>
                            <div>
                              <strong>Tasa de Asistencia</strong>
                              <div style={{ fontSize: '14px', color: cls.attendanceRate >= 80 ? 'green' : 'red', fontWeight: 'bold' }}>
                                {cls.attendanceRate}%
                              </div>
                            </div>
                          </div>

                          {/* Detail of past sessions */}
                          <div className="win-table-container" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            <table className="win-table" style={{ fontSize: '10px' }}>
                              <thead>
                                <tr>
                                  <th>Fecha</th>
                                  <th>Estado de Registro</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cls.records.map((r, i) => (
                                  <tr key={i}>
                                    <td>{new Date(r.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ fontWeight: 'bold' }}>
                                      {r.status === 'Presente' && <span style={{ color: 'green' }}>✅ Presente</span>}
                                      {r.status === 'Tarde' && <span style={{ color: 'orange' }}>⏳ Tarde</span>}
                                      {r.status === 'Excusa' && <span style={{ color: 'blue' }}>🩹 Justificado</span>}
                                      {r.status === 'Ausente' && <span style={{ color: 'red' }}>❌ Ausente</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </fieldset>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Netscape Status Bar */}
      <div className="netscape-statusbar">
        <span>Document: Done</span>
        <div className="netscape-security-lock">
          🔒 SSL Coded (SSLv3 Security Panel Activated)
        </div>
      </div>
    </div>
  );
}
