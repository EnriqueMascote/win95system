import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Scheduler() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [scheduleText, setScheduleText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [classesResponse, teachersResponse] = await Promise.all([
        api.getClasses(),
        api.getTeachers(),
      ]);

      if (classesResponse.success) {
        setClasses(classesResponse.data);
        if (classesResponse.data.length > 0) {
          setSelectedClassId(classesResponse.data[0].id);
        }
      }

      if (teachersResponse.success) {
        setTeachers(teachersResponse.data);
        if (teachersResponse.data.length > 0) {
          setSelectedTeacherId(teachersResponse.data[0].id);
        }
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !selectedTeacherId || !scheduleText.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      const response = await api.assignClass(selectedClassId, selectedTeacherId, scheduleText);
      if (response.success) {
        setSuccessMsg('Clase asignada exitosamente.');
        setScheduleText('');
        // Reload table
        const classesResponse = await api.getClasses();
        if (classesResponse.success) {
          setClasses(classesResponse.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al guardar la asignación.');
    }
  };

  if (loading) {
    return <div style={{ padding: '10px' }}>Abriendo programador de tareas...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '450px' }}>
      <p>
        Asigna profesores y horarios específicos a cada una de las asignaturas en la red escolar.
      </p>

      {/* Assignment Form */}
      <form onSubmit={handleSubmit} className="win-fieldset" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <legend className="win-legend">Nueva Asignación de Horario</legend>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="class-select" style={{ fontWeight: 'bold' }}>Clase / Materia:</label>
          <select
            id="class-select"
            className="win-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="teacher-select" style={{ fontWeight: 'bold' }}>Profesor:</label>
          <select
            id="teacher-select"
            className="win-select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <label htmlFor="schedule-input" style={{ fontWeight: 'bold' }}>Día y Hora:</label>
          <input
            id="schedule-input"
            type="text"
            className="win-input"
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            placeholder="ej. Lunes y Miércoles 08:00 - 10:00"
          />
        </div>

        {error && <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>⚠️ {error}</div>}
        {successMsg && <div style={{ color: 'green', fontSize: '11px', marginTop: '5px' }}>✅ {successMsg}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="submit" className="win-button" style={{ fontWeight: 'bold' }}>
            📅 Registrar Asignación
          </button>
        </div>
      </form>

      {/* Roster / Table showing current schedules */}
      <fieldset className="win-fieldset">
        <legend className="win-legend">Horarios de Clases Programados</legend>
        <div className="win-table-container win-inset" style={{ maxHeight: '180px', overflowY: 'auto' }}>
          <table className="win-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Docente Asignado</th>
                <th>Horario Horas</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.teacherName || 'No asignado'}</td>
                  <td>{c.schedule || 'No asignado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
