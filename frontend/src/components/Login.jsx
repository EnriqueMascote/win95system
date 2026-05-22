import React, { useState } from 'react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.login(userId, password);
      if (response.success) {
        // Store JWT token
        localStorage.setItem('retrocheck_token', response.token);
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-dialog win-outset">
        {/* Titlebar */}
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>Iniciar Sesión en RetroCheck 95</span>
          </div>
        </div>

        {/* Windows 95 login banner */}
        <div className="login-header-banner">
          <span style={{ marginRight: '8px' }}>💻</span> RetroCheck 95
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-body">
            {/* Key Icon */}
            <div style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px' }}>
              🔑
            </div>

            <div className="login-fields">
              <p style={{ marginBottom: '10px', fontSize: '11px', lineHeight: '1.3' }}>
                Escribe tu usuario y contraseña de red local escolar para iniciar sesión.
              </p>
              
              <div className="login-row">
                <label htmlFor="userId" style={{ fontWeight: 'bold' }}>Usuario:</label>
                <input
                  id="userId"
                  type="text"
                  className="win-input"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="ej. admin, prof_gomez, 20230001"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="login-row" style={{ marginTop: '8px' }}>
                <label htmlFor="password" style={{ fontWeight: 'bold' }}>Contraseña:</label>
                <input
                  id="password"
                  type="password"
                  className="win-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={{ color: 'red', marginTop: '8px', fontSize: '11px', display: 'flex', gap: '4px' }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Demo users cheat sheet */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #808080', paddingTop: '8px' }}>
                <p style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', lineHeight: '1.4' }}>
                  Cuentas de demostración seguras (OWASP):<br />
                  - Admin: <strong>admin</strong> / <strong>admin95</strong><br />
                  - Profesor: <strong>prof_gomez</strong> / <strong>gomez95</strong><br />
                  - Alumnos: <strong>20230001</strong> / <strong>student95</strong>
                </p>
              </div>
            </div>

            <div className="login-buttons">
              <button type="submit" className="win-button" style={{ minWidth: '70px', fontWeight: 'bold' }} disabled={loading}>
                {loading ? '...' : 'Aceptar'}
              </button>
              <button
                type="button"
                className="win-button"
                style={{ minWidth: '70px', marginTop: '4px' }}
                onClick={() => {
                  setUserId('');
                  setPassword('');
                }}
                disabled={loading}
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
