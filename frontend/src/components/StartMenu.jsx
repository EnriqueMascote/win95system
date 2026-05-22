import React from 'react';

export default function StartMenu({ user, onOpenProgram, onLogout, closeMenu }) {
  const handleItemClick = (programId) => {
    onOpenProgram(programId);
    closeMenu();
  };

  return (
    <div className="start-menu win-outset">
      {/* Windows 95 vertical sidebar banner */}
      <div className="start-menu-sidebar">
        <span>RetroCheck95</span>
      </div>

      {/* Start Menu Items */}
      <ul className="start-menu-list">
        {/* Admin Specific Programs */}
        {user.role === 'admin' && (
          <>
            <li className="start-menu-item" onClick={() => handleItemClick('adminSummary')}>
              <span style={{ fontSize: '16px' }}>📊</span> Monitor de Sistema
            </li>
            <li className="start-menu-item" onClick={() => handleItemClick('classes')}>
              <span style={{ fontSize: '16px' }}>📁</span> Administrar Clases
            </li>
            <li className="start-menu-item" onClick={() => handleItemClick('scheduler')}>
              <span style={{ fontSize: '16px' }}>📅</span> Asignar Horarios
            </li>
            <li className="start-menu-item" onClick={() => handleItemClick('students')}>
              <span style={{ fontSize: '16px' }}>👥</span> Alumnos / Roster
            </li>
            <li className="start-menu-divider" />
          </>
        )}

        {/* Teacher Specific Programs */}
        {user.role === 'teacher' && (
          <>
            <li className="start-menu-item" onClick={() => handleItemClick('activeSession')}>
              <span style={{ fontSize: '16px' }}>📡</span> Iniciar Asistencia
            </li>
            <li className="start-menu-item" onClick={() => handleItemClick('classes')}>
              <span style={{ fontSize: '16px' }}>📂</span> Mis Clases / Rosters
            </li>
            <li className="start-menu-item" onClick={() => handleItemClick('reports')}>
              <span style={{ fontSize: '16px' }}>📝</span> Reportes Históricos
            </li>
            <li className="start-menu-divider" />
          </>
        )}

        {/* Common Utilities */}
        <li className="start-menu-item" onClick={() => handleItemClick('displayProperties')}>
          <span style={{ fontSize: '16px' }}>🖥️</span> Propiedades de Pantalla
        </li>
        <li className="start-menu-item" onClick={() => handleItemClick('help')}>
          <span style={{ fontSize: '16px' }}>❓</span> Temas y Ayuda
        </li>
        
        <li className="start-menu-divider" />

        <li className="start-menu-item" onClick={() => { onLogout(); closeMenu(); }}>
          <span style={{ fontSize: '16px' }}>🚪</span> Cerrar Sesión...
        </li>
      </ul>
    </div>
  );
}
