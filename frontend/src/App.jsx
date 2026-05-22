import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import Window from './components/Window';
import Login from './components/Login';
import Taskbar from './components/Taskbar';
import DisplayProperties from './components/DisplayProperties';
import AdminPanel from './components/AdminPanel';
import Scheduler from './components/Scheduler';
import ClassManager from './components/ClassManager';
import AttendanceSession from './components/AttendanceSession';
import Reports from './components/Reports';
import StudentManager from './components/StudentManager';
import StudentCheckIn from './components/StudentCheckIn';

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('retrocheck_theme') || 'win-classic');
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [selectedIcon, setSelectedIcon] = useState(null);
  
  // Path Detection for Student Check-in vs Administrator/Teacher Desktop
  const [studentSessionId, setStudentSessionId] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/checkin/')) {
      const parts = path.split('/checkin/');
      if (parts[1]) {
        setStudentSessionId(parts[1]);
      }
    }
  }, []);

  // Sync theme with body element class list
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Decode JWT on load to keep login persistent
  useEffect(() => {
    const token = localStorage.getItem('retrocheck_token');
    if (token) {
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
        
        // Ensure expiration is checked
        if (payload.exp * 1000 > Date.now()) {
          setUser(payload);
        } else {
          localStorage.removeItem('retrocheck_token');
        }
      } catch (e) {
        localStorage.removeItem('retrocheck_token');
      }
    }
  }, []);

  // Close context menu on left click
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('retrocheck_token');
    setUser(null);
    setOpenWindows([]);
    setActiveWindowId(null);
  };

  // Draggable Window Management
  const getNextZIndex = () => {
    if (openWindows.length === 0) return 100;
    return Math.max(...openWindows.map(w => w.zIndex || 100)) + 1;
  };

  const focusWindow = (windowId) => {
    setActiveWindowId(windowId);
    setOpenWindows(prev => 
      prev.map(w => w.id === windowId 
        ? { ...w, zIndex: getNextZIndex(), minimized: false } 
        : w
      )
    );
  };

  const closeWindow = (windowId) => {
    setOpenWindows(prev => prev.filter(w => w.id !== windowId));
    if (activeWindowId === windowId) {
      const remaining = openWindows.filter(w => w.id !== windowId);
      if (remaining.length > 0) {
        // Focus the one with highest z-index
        const sorted = [...remaining].sort((a, b) => b.zIndex - a.zIndex);
        setActiveWindowId(sorted[0].id);
      } else {
        setActiveWindowId(null);
      }
    }
  };

  const minimizeWindow = (windowId) => {
    setOpenWindows(prev => 
      prev.map(w => w.id === windowId ? { ...w, minimized: true } : w)
    );
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  };

  const openProgram = (programId, forceNew = false) => {
    const existing = openWindows.find(w => w.id === programId);
    if (existing && !forceNew) {
      focusWindow(programId);
      return;
    }

    let title = '';
    let icon = '';
    let component = null;
    let width = 450;
    let height = 'auto';

    switch (programId) {
      case 'adminSummary':
        title = 'Monitor del Sistema';
        icon = '📊';
        component = <AdminPanel />;
        width = 460;
        break;
      case 'classes':
        title = user.role === 'admin' ? 'Administrar Clases' : 'Mis Clases y Rosters';
        icon = '📁';
        component = <ClassManager user={user} />;
        width = 620;
        break;
      case 'scheduler':
        title = 'Control de Horarios y Profesores';
        icon = '📅';
        component = <Scheduler />;
        width = 500;
        break;
      case 'students':
        title = 'Alumnos / Directorio';
        icon = '👥';
        component = <StudentManager />;
        width = 480;
        break;
      case 'activeSession':
        title = 'Toma de Asistencia (Canal QR)';
        icon = '📡';
        component = <AttendanceSession user={user} />;
        width = 640;
        break;
      case 'reports':
        title = 'Reportes Históricos de Asistencia';
        icon = '📝';
        component = <Reports user={user} />;
        width = 620;
        break;
      case 'displayProperties':
        title = 'Propiedades de Pantalla';
        icon = '🖥️';
        component = (
          <DisplayProperties 
            currentTheme={theme} 
            onThemeChange={(t) => setTheme(t)} 
            onClose={() => closeWindow('displayProperties')} 
          />
        );
        width = 300;
        break;
      case 'myPC':
        title = 'Mi PC';
        icon = '💻';
        component = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px' }}>
            <h3 style={{ borderBottom: '1px solid #808080', paddingBottom: '4px', fontFamily: 'serif' }}>Propiedades de Mi PC</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px' }}>
              <strong>Sistema:</strong> <span>RetroCheck 95 Enterprise v1.0</span>
              <strong>Procesador:</strong> <span>Intel Pentium 133 MHz</span>
              <strong>Memoria:</strong> <span>32.0 MB de RAM</span>
              <strong>Seguridad:</strong> <span>JWT RBAC, Hashing Bcrypt</span>
              <strong>Red:</strong> <span>Canal local Wi-Fi activo</span>
            </div>
            <p style={{ marginTop: '10px', fontSize: '9px', color: '#666', fontStyle: 'italic' }}>
              Windows 95 Virtual Workstation. Todos los derechos reservados.
            </p>
          </div>
        );
        width = 320;
        break;
      case 'help':
        title = 'Temas de Ayuda y Seguridad';
        icon = '❓';
        component = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '350px', fontSize: '11px', lineHeight: '1.4' }}>
            <h3 style={{ borderBottom: '1px solid #808080', paddingBottom: '4px', fontFamily: 'serif' }}>RetroCheck 95 - FAQs & OWASP</h3>
            <p><strong>1. ¿Cómo funciona la toma de asistencia?</strong><br />
               El docente inicia una sesión QR. Los estudiantes en el salón se conectan a la misma red Wi-Fi local de la escuela y escanean el código para hacer check-in en su teléfono.</p>
            <p><strong>2. ¿Qué medidas de OWASP Top 10 se implementaron?</strong></p>
            <ul style={{ paddingLeft: '15px' }}>
              <li><strong>Controles de Acceso (A01):</strong> Acceso por token JWT. Validaciones para asegurar que un alumno no pueda registrar la matrícula de otro (mitigación de IDOR) ni ver otros historiales.</li>
              <li><strong>Criptografía (A02):</strong> Las contraseñas en users.json se cifran con bcrypt.</li>
              <li><strong>Inyección (A03):</strong> Validaciones regex e inmunización contra CSV Injection (se escapan caracteres '=+-@').</li>
              <li><strong>Denegación de Servicio (A04):</strong> Rate limits en inicios de sesión y check-ins.</li>
            </ul>
            <p><strong>3. Bloqueo de Cuentas (MITRE T1110):</strong><br />
               Si se detectan 5 intentos fallidos de login consecutivos, la cuenta se bloquea por 15 minutos.</p>
          </div>
        );
        width = 380;
        break;
      default:
        return;
    }

    const newWindow = {
      id: programId,
      title,
      icon,
      component,
      minimized: false,
      zIndex: getNextZIndex(),
      defaultWidth: width,
      defaultHeight: height,
      defaultX: 30 + (openWindows.length * 25) % 180,
      defaultY: 30 + (openWindows.length * 25) % 180
    };

    setOpenWindows(prev => [...prev, newWindow]);
    setActiveWindowId(programId);
  };

  const handleWindowTaskbarClick = (windowId) => {
    const win = openWindows.find(w => w.id === windowId);
    if (!win) return;

    if (win.minimized) {
      focusWindow(windowId);
    } else if (activeWindowId === windowId) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  // Desktop context menu right click handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Renders Student Navigator if path is /checkin/:sessionId
  if (studentSessionId) {
    return <StudentCheckIn sessionId={studentSessionId} />;
  }

  // Renders login screen if user is not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
      className="desktop-container" 
      onContextMenu={handleContextMenu}
    >
      {/* Desktop shortcuts grid */}
      <div className="desktop-grid">
        
        <div 
          className={`desktop-icon ${selectedIcon === 'myPC' ? 'selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); setSelectedIcon('myPC'); }}
          onDoubleClick={() => openProgram('myPC')}
        >
          <div className="desktop-icon-image" style={{ fontSize: '32px' }}>💻</div>
          <div className="desktop-icon-label">Mi PC</div>
        </div>

        {user.role === 'admin' && (
          <>
            <div 
              className={`desktop-icon ${selectedIcon === 'adminSummary' ? 'selected' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon('adminSummary'); }}
              onDoubleClick={() => openProgram('adminSummary')}
            >
              <div className="desktop-icon-image" style={{ fontSize: '32px' }}>📊</div>
              <div className="desktop-icon-label">Monitor de Sistema</div>
            </div>

            <div 
              className={`desktop-icon ${selectedIcon === 'scheduler' ? 'selected' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon('scheduler'); }}
              onDoubleClick={() => openProgram('scheduler')}
            >
              <div className="desktop-icon-image" style={{ fontSize: '32px' }}>📅</div>
              <div className="desktop-icon-label">Asignar Horarios</div>
            </div>
          </>
        )}

        {(user.role === 'admin' || user.role === 'teacher') && (
          <div 
            className={`desktop-icon ${selectedIcon === 'classes' ? 'selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedIcon('classes'); }}
            onDoubleClick={() => openProgram('classes')}
          >
            <div className="desktop-icon-image" style={{ fontSize: '32px' }}>📁</div>
            <div className="desktop-icon-label">{user.role === 'admin' ? 'Clases' : 'Mis Clases'}</div>
          </div>
        )}

        {user.role === 'teacher' && (
          <>
            <div 
              className={`desktop-icon ${selectedIcon === 'activeSession' ? 'selected' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon('activeSession'); }}
              onDoubleClick={() => openProgram('activeSession')}
            >
              <div className="desktop-icon-image" style={{ fontSize: '32px' }}>📡</div>
              <div className="desktop-icon-label">Iniciar Asistencia</div>
            </div>

            <div 
              className={`desktop-icon ${selectedIcon === 'reports' ? 'selected' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon('reports'); }}
              onDoubleClick={() => openProgram('reports')}
            >
              <div className="desktop-icon-image" style={{ fontSize: '32px' }}>📝</div>
              <div className="desktop-icon-label">Reportes Históricos</div>
            </div>
          </>
        )}

        <div 
          className={`desktop-icon ${selectedIcon === 'displayProperties' ? 'selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); setSelectedIcon('displayProperties'); }}
          onDoubleClick={() => openProgram('displayProperties')}
        >
          <div className="desktop-icon-image" style={{ fontSize: '32px' }}>🖥️</div>
          <div className="desktop-icon-label">Propiedades de Pantalla</div>
        </div>

        <div 
          className={`desktop-icon ${selectedIcon === 'help' ? 'selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); setSelectedIcon('help'); }}
          onDoubleClick={() => openProgram('help')}
        >
          <div className="desktop-icon-image" style={{ fontSize: '32px' }}>❓</div>
          <div className="desktop-icon-label">Temas de Ayuda</div>
        </div>

      </div>

      {/* Render open draggable windows */}
      {openWindows.map(win => (
        <div 
          key={win.id} 
          style={{ display: win.minimized ? 'none' : 'block' }}
        >
          <Window
            id={win.id}
            title={win.title}
            icon={win.icon}
            active={activeWindowId === win.id}
            zIndex={win.zIndex}
            defaultWidth={win.defaultWidth}
            defaultHeight={win.defaultHeight}
            defaultX={win.defaultX}
            defaultY={win.defaultY}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onFocus={focusWindow}
          >
            {win.component}
          </Window>
        </div>
      ))}

      {/* Context Menu right click */}
      {contextMenu && (
        <div 
          className="start-menu win-outset"
          style={{ 
            position: 'absolute', 
            top: contextMenu.y, 
            left: contextMenu.x, 
            width: '150px',
            zIndex: 99999,
            display: 'block'
          }}
        >
          <ul className="start-menu-list" style={{ padding: '2px' }}>
            <li className="start-menu-item" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => alert('Organizando iconos...')}>
              Organizar iconos
            </li>
            <li className="start-menu-item" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => alert('Pegar no disponible.')}>
              Pegar acceso directo
            </li>
            <li className="start-menu-divider" />
            <li className="start-menu-item" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openProgram('displayProperties')}>
              Propiedades
            </li>
          </ul>
        </div>
      )}

      {/* Taskbar & Start Menu */}
      <Taskbar
        user={user}
        windows={openWindows}
        activeWindowId={activeWindowId}
        onWindowClick={handleWindowTaskbarClick}
        onOpenProgram={openProgram}
        onLogout={handleLogout}
      />
    </div>
  );
}
