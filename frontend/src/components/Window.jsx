import React, { useState, useEffect, useRef } from 'react';

export default function Window({
  id,
  title,
  icon,
  children,
  onClose,
  onMinimize,
  onFocus,
  active = false,
  zIndex = 100,
  defaultX = 50,
  defaultY = 50,
  defaultWidth = 450,
  defaultHeight = 'auto',
  menuItems = null, // Array of strings or objects, e.g. ["Archivo", "Edición", "Ayuda"]
}) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const windowRef = useRef(null);

  // Dragging logic
  const handleMouseDown = (e) => {
    // Only drag on left click and on the titlebar directly (not buttons)
    if (e.button !== 0 || e.target.closest('.win-titlebar-btn')) return;

    if (onFocus) onFocus(id);
    setIsDragging(true);

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      // Bound it so it doesn't get dragged completely off screen
      let newX = moveEvent.clientX - startX;
      let newY = moveEvent.clientY - startY;

      // Keep some titlebar visible
      newY = Math.max(0, Math.min(window.innerHeight - 30, newY));
      newX = Math.max(-200, Math.min(window.innerWidth - 50, newX));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleWindowClick = () => {
    if (onFocus) onFocus(id);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const windowStyle = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100vh - 40px)', // Leave room for taskbar
        zIndex: zIndex,
      }
    : {
        position: 'absolute',
        top: position.y,
        left: position.x,
        width: typeof size.width === 'number' ? `${size.width}px` : size.width,
        height: typeof size.height === 'number' ? `${size.height}px` : size.height,
        zIndex: zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={`win-window win-outset ${active ? 'active' : 'inactive'}`}
      style={windowStyle}
      onClick={handleWindowClick}
    >
      {/* Title bar */}
      <div
        className="win-titlebar"
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleMaximize}
      >
        <div className="win-titlebar-title">
          {icon && <span className="win-titlebar-icon">{icon}</span>}
          <span>{title}</span>
        </div>
        <div className="win-titlebar-controls">
          {onMinimize && (
            <button className="win-button win-titlebar-btn" onClick={() => onMinimize(id)}>
              _
            </button>
          )}
          <button className="win-button win-titlebar-btn" onClick={toggleMaximize}>
            {isMaximized ? '❐' : '🗖'}
          </button>
          {onClose && (
            <button
              className="win-button win-titlebar-btn"
              onClick={() => onClose(id)}
              style={{ fontWeight: 'bold', marginLeft: '2px' }}
            >
              X
            </button>
          )}
        </div>
      </div>

      {/* Menu bar */}
      {menuItems && menuItems.length > 0 && (
        <div className="win-menu-bar">
          {menuItems.map((item, index) => (
            <div key={index} className="win-menu-item">
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Body content */}
      <div className="win-window-body win-double-inset">
        {children}
      </div>
    </div>
  );
}
