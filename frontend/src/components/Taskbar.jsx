import React, { useState, useEffect } from 'react';
import StartMenu from './StartMenu';

export default function Taskbar({
  user,
  windows,
  activeWindowId,
  onWindowClick,
  onOpenProgram,
  onLogout
}) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const closeStartMenu = () => {
    setStartMenuOpen(false);
  };

  // Close start menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (startMenuOpen && !e.target.closest('.start-button') && !e.target.closest('.start-menu')) {
        closeStartMenu();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [startMenuOpen]);

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        {/* Start button */}
        <button
          className={`win-button start-button ${startMenuOpen ? 'win-inset' : ''}`}
          onClick={toggleStartMenu}
        >
          <span className="start-button-logo">❖</span> Inicio
        </button>

        {/* List of open windows */}
        <div className="taskbar-windows">
          {windows.map((win) => (
            <button
              key={win.id}
              className={`win-button taskbar-window-btn ${
                activeWindowId === win.id && !win.minimized ? 'active' : ''
              }`}
              onClick={() => onWindowClick(win.id)}
            >
              <span style={{ marginRight: '4px' }}>{win.icon || '📁'}</span>
              {win.title}
            </button>
          ))}
        </div>
      </div>

      <div className="taskbar-right">
        {/* System tray clock */}
        <div className="taskbar-clock win-inset">
          <span>🔊</span>
          <span>{time}</span>
        </div>
      </div>

      {/* Start Menu Overlay */}
      {startMenuOpen && (
        <StartMenu
          user={user}
          onOpenProgram={onOpenProgram}
          onLogout={onLogout}
          closeMenu={closeStartMenu}
        />
      )}
    </div>
  );
}
