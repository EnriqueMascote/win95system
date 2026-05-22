import React, { useState } from 'react';

export default function DisplayProperties({ currentTheme, onThemeChange, onClose }) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleApply = () => {
    onThemeChange(selectedTheme);
  };

  const handleOk = () => {
    onThemeChange(selectedTheme);
    onClose();
  };

  return (
    <div>
      {/* Tab Control header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #808080', marginBottom: '12px' }}>
        <button
          className="win-button"
          style={{
            borderBottom: 'none',
            background: 'var(--win-bg)',
            fontWeight: 'bold',
            zIndex: 1,
            marginBottom: '-1.5px',
          }}
        >
          Apariencia
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Retro Mini Monitor Preview */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="win-inset"
            style={{
              width: '180px',
              height: '110px',
              backgroundColor: '#808080',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner Monitor Screen */}
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: selectedTheme === 'win-classic' ? '#008080' : '#0a1717',
                border: '2px solid #000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              {/* Simulated Window in Preview */}
              <div
                className="win-outset"
                style={{
                  width: '110px',
                  height: '60px',
                  fontSize: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    backgroundColor: selectedTheme === 'win-classic' ? '#000080' : '#5a189a',
                    color: '#fff',
                    padding: '1px 3px',
                    fontWeight: 'bold',
                    fontSize: '7px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Ventana activa</span>
                  <span>X</span>
                </div>
                <div style={{ padding: '4px', flex: 1, backgroundColor: selectedTheme === 'win-classic' ? '#c0c0c0' : '#2d2d2d' }}>
                  <div
                    className="win-inset"
                    style={{
                      height: '100%',
                      backgroundColor: selectedTheme === 'win-classic' ? '#fff' : '#1a1a1a',
                      fontSize: '7px',
                      padding: '2px',
                    }}
                  >
                    RetroCheck 95
                  </div>
                </div>
              </div>

              {/* Taskbar in Preview */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '10px',
                  backgroundColor: '#c0c0c0',
                  borderTop: '1px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '2px',
                }}
              >
                <div style={{ width: '12px', height: '6px', backgroundColor: '#e0e0e0', border: '1px solid #808080', scale: '0.8' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Theme select controls */}
        <fieldset className="win-fieldset">
          <legend className="win-legend">Esquema de Colores</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="color-scheme" style={{ fontWeight: 'bold' }}>
              Seleccionar esquema:
            </label>
            <select
              id="color-scheme"
              className="win-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="win-classic">Windows Standard (Modo Claro)</option>
              <option value="win-dark-slate">Windows Dark Slate (Modo Oscuro)</option>
            </select>
          </div>
        </fieldset>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '5px' }}>
          <button className="win-button" style={{ width: '70px', fontWeight: 'bold' }} onClick={handleOk}>
            Aceptar
          </button>
          <button className="win-button" style={{ width: '70px' }} onClick={onClose}>
            Cancelar
          </button>
          <button
            className="win-button"
            style={{ width: '70px' }}
            disabled={selectedTheme === currentTheme}
            onClick={handleApply}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
