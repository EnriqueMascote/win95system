import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [classesResponse, teachersResponse] = await Promise.all([
        api.getClasses(),
        api.getTeachers(), // Not strictly needed for student manager but we can read classes
      ]);

      if (classesResponse.success) {
        setClasses(classesResponse.data);
        
        // Build global list of unique students from rosters
        const studentMap = {};
        classesResponse.data.forEach(cls => {
          cls.students.forEach(stu => {
            if (!studentMap[stu.id]) {
              studentMap[stu.id] = {
                id: stu.id,
                name: stu.name,
                enrolledClasses: []
              };
            }
            studentMap[stu.id].enrolledClasses.push(cls.name);
          });
        });
        
        setStudents(Object.values(studentMap));
      }
    } catch (err) {
      setError('Error al recuperar directorio de estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '10px' }}>Abriendo directorio escolar...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '400px' }}>
      <p>
        <strong>Directorio Escolar de Alumnos:</strong> Consulta y auditoría de la lista completa de alumnos inscritos en las materias.
      </p>

      {error && <div style={{ color: 'red', fontSize: '11px' }}>⚠️ {error}</div>}

      <fieldset className="win-fieldset">
        <legend className="win-legend">Alumnos Registrados en el Sistema</legend>
        <div className="win-table-container win-inset" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <table className="win-table">
            <thead>
              <tr>
                <th>Matrícula / ID</th>
                <th>Nombre Completo</th>
                <th>Materias Inscritas</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    No hay estudiantes cargados en ninguna asignatura.
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td>{s.name}</td>
                    <td>
                      {s.enrolledClasses.length > 0 
                        ? s.enrolledClasses.join(', ')
                        : 'Ninguna'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </fieldset>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="win-button" onClick={loadData}>
          🔄 Actualizar Directorio
        </button>
      </div>
    </div>
  );
}
