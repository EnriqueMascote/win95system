import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function ClassManager({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newClassSchedule, setNewClassSchedule] = useState('');
  const [activeClassId, setActiveClassId] = useState(null);

  // Manage students roster form inside active class
  const [studentInput, setStudentInput] = useState(''); // Textarea for copy/paste CSV or TSV

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = user.role === 'admin' 
        ? await api.getClasses()
        : await api.getTeacherClasses(user.id);
        
      if (response.success) {
        setClasses(response.data);
        if (response.data.length > 0 && !activeClassId) {
          setActiveClassId(response.data[0].id);
        }
      }
    } catch (err) {
      setError('Error al recuperar las asignaturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setError('');
      setSuccess('');
      const response = await api.createClass(newClassName, newClassSchedule);
      if (response.success) {
        setSuccess(`Clase "${newClassName}" creada.`);
        setNewClassName('');
        setNewClassSchedule('');
        fetchClasses();
      }
    } catch (err) {
      setError(err.message || 'Error al guardar clase');
    }
  };

  const handleAddStudents = async (e) => {
    e.preventDefault();
    if (!studentInput.trim() || !activeClassId) return;

    // Parse textarea: supports copy/paste spreadsheet columns:
    // Format: "ID, Name" or "ID\tName" or just plain comma separated per line
    const parsedStudents = [];
    const lines = studentInput.split('\n');
    lines.forEach(line => {
      let parts = line.split(',');
      if (parts.length < 2) {
        parts = line.split('\t'); // Try tab separator
      }

      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        if (id && name) {
          parsedStudents.push({ id, name });
        }
      }
    });

    if (parsedStudents.length === 0) {
      setError('Formato inválido. Escribe una línea por estudiante: Matricula, Nombre Completo');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await api.addStudentsToClass(activeClassId, parsedStudents);
      if (response.success) {
        setSuccess(`Se agregaron ${parsedStudents.length} estudiantes.`);
        setStudentInput('');
        fetchClasses();
      }
    } catch (err) {
      setError(err.message || 'Error al cargar alumnos');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('¿Remover estudiante de la lista de asistencia de esta materia?')) return;
    try {
      setError('');
      const response = await api.removeStudentFromClass(activeClassId, studentId);
      if (response.success) {
        fetchClasses();
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar estudiante');
    }
  };

  const activeClass = classes.find(c => c.id === activeClassId);

  if (loading && classes.length === 0) {
    return <div style={{ padding: '10px' }}>Explorando Mi PC...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', minWidth: '550px' }}>
      
      {/* Sidebar: List of classes */}
      <fieldset className="win-fieldset" style={{ height: '100%' }}>
        <legend className="win-legend">Mi PC \ Materias</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {classes.map(c => (
            <button
              key={c.id}
              className={`win-button ${activeClassId === c.id ? 'win-inset' : ''}`}
              onClick={() => { setActiveClassId(c.id); setError(''); setSuccess(''); }}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                width: '100%',
                fontWeight: activeClassId === c.id ? 'bold' : 'normal'
              }}
            >
              📁 {c.name}
            </button>
          ))}
        </div>

        {/* Admin only class creation */}
        {user.role === 'admin' && (
          <form onSubmit={handleCreateClass} style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #808080', paddingTop: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Nueva Materia:</div>
            <input
              type="text"
              className="win-input"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Nombre"
              required
            />
            <input
              type="text"
              className="win-input"
              value={newClassSchedule}
              onChange={(e) => setNewClassSchedule(e.target.value)}
              placeholder="Horario (opcional)"
            />
            <button type="submit" className="win-button" style={{ width: '100%' }}>
              ➕ Crear
            </button>
          </form>
        )}
      </fieldset>

      {/* Roster / Detail Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeClass ? (
          <>
            <fieldset className="win-fieldset">
              <legend className="win-legend">Información General</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>ID Interno:</span>
                <span>{activeClass.id}</span>
                <span style={{ fontWeight: 'bold' }}>Materia:</span>
                <span>{activeClass.name}</span>
                <span style={{ fontWeight: 'bold' }}>Horario:</span>
                <span>{activeClass.schedule}</span>
                <span style={{ fontWeight: 'bold' }}>Docente:</span>
                <span>{activeClass.teacherName || 'No asignado'}</span>
              </div>
            </fieldset>

            {/* Students List */}
            <fieldset className="win-fieldset">
              <legend className="win-legend">Roster Estudiantes ({activeClass.students.length})</legend>
              
              <div className="win-table-container win-inset" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table className="win-table">
                  <thead>
                    <tr>
                      <th>Matrícula</th>
                      <th>Nombre</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClass.students.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                          Sin alumnos en el roster. Carga la lista a la derecha.
                        </td>
                      </tr>
                    ) : (
                      activeClass.students.map(s => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="win-button"
                              onClick={() => handleRemoveStudent(s.id)}
                              style={{ padding: '0px 4px', fontSize: '9px' }}
                            >
                              ❌ Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </fieldset>

            {/* Quick Bulk Upload Students Form */}
            <form onSubmit={handleAddStudents} className="win-fieldset">
              <legend className="win-legend">Carga Roster de Estudiantes (Lote)</legend>
              <p style={{ fontSize: '10px', color: '#555', marginBottom: '6px' }}>
                Copia y pega desde Excel o escribe un estudiante por línea en formato: <em>Matricula, Nombre</em>
              </p>
              <textarea
                className="win-input"
                rows="3"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="20230005, Juan López&#10;20230006, Sofía Martínez"
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" className="win-button">
                  📂 Cargar Alumnos
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', fontStyle: 'italic' }}>
            No hay materias seleccionadas.
          </div>
        )}

        {error && <div style={{ color: 'red', fontSize: '11px' }}>⚠️ {error}</div>}
        {success && <div style={{ color: 'green', fontSize: '11px' }}>✅ {success}</div>}
      </div>

    </div>
  );
}
