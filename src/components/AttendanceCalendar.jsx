// src/components/AttendanceCalendar.jsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

function AttendanceCalendar() {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [totalSummary, setTotalSummary] = useState({ presente: 0, ausente: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchMonthlyRecords(selectedSubject.id, currentDate);
      fetchTotalSummary(selectedSubject.id);
    } else {
      setMonthlyRecords([]);
      setTotalSummary({ presente: 0, ausente: 0 });
    }
  }, [selectedSubject, currentDate]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('subjects').select('*').eq('user_id', user.id);
      if (error) toast.error('Error cargando asignaturas');
      else setSubjects(data);
    }
    setIsLoading(false);
  };

  const fetchMonthlyRecords = async (subjectId, date) => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    const { data, error } = await supabase.from('attendance_records').select('date, status').eq('subject_id', subjectId).gte('date', start).lte('date', end);
    if (error) toast.error('Error al cargar asistencia del mes');
    else setMonthlyRecords(data);
  };

  const fetchTotalSummary = async (subjectId) => {
    const { data, error } = await supabase.from('attendance_records').select('status').eq('subject_id', subjectId);
    if (error) toast.error('Error al cargar resumen total');
    else {
      const summary = data.reduce((acc, record) => {
        if (record.status === 'presente') acc.presente++;
        if (record.status === 'ausente') acc.ausente++;
        return acc;
      }, { presente: 0, ausente: 0 });
      setTotalSummary(summary);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) { toast.warn("El nombre no puede estar vacío."); return; }
    
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('subjects').insert({ name: newSubjectName, user_id: user.id }).select().single();
    if (error) toast.error('Error al crear la asignatura');
    else {
      setSubjects(prev => [...prev, data]);
      setNewSubjectName('');
      toast.success(`Asignatura "${data.name}" creada.`);
    }
    setIsLoading(false);
  };
  
  const handleDeleteSubject = async () => {
    if (!selectedSubject || !window.confirm(`¿Borrar "${selectedSubject.name}"?`)) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('subjects').delete().eq('id', selectedSubject.id);
    if (error) toast.error('Error al borrar la asignatura.');
    else {
      toast.success('Asignatura borrada.');
      setSubjects(prev => prev.filter(s => s.id !== selectedSubject.id));
      setSelectedSubject(null);
    }
    setIsLoading(false);
  };

  const handleDayClick = (date) => {
    if (!selectedSubject) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const existingRecord = monthlyRecords.find(r => r.date === dateString);
    const previousRecords = monthlyRecords;
    let newStatus = 'presente';
    if (existingRecord) newStatus = existingRecord.status === 'presente' ? 'ausente' : null;
    let updatedRecords;
    if (newStatus === null) updatedRecords = monthlyRecords.filter(r => r.date !== dateString);
    else if (existingRecord) updatedRecords = monthlyRecords.map(r => r.date === dateString ? { ...r, status: newStatus } : r);
    else updatedRecords = [...monthlyRecords, { date: dateString, status: newStatus }];
    setMonthlyRecords(updatedRecords);
    const syncWithDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado.");
        if (newStatus === null) await supabase.from('attendance_records').delete().match({ subject_id: selectedSubject.id, date: dateString });
        else await supabase.from('attendance_records').upsert({ subject_id: selectedSubject.id, user_id: user.id, date: dateString, status: newStatus }, { onConflict: 'subject_id, date' });
        fetchTotalSummary(selectedSubject.id);
      } catch (error) {
        toast.error("No se pudo guardar el cambio.");
        setMonthlyRecords(previousRecords);
      }
    };
    syncWithDatabase();
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = format(date, 'yyyy-MM-dd');
      const record = monthlyRecords.find(r => r.date === dateString);
      if (record) return record.status;
    }
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => setCurrentDate(activeStartDate);

  return (
    <div className="calculator-container attendance-container">
      <h3>Control de Asistencia por Asignatura</h3>
      <p className="instructions">
        Crea una asignatura y selecciónala. Luego, haz clic en los días del calendario para cambiar el estado: <strong style={{ color: '#28a745' }}>Presente</strong> → <strong style={{ color: '#dc3545' }}>Ausente</strong> → Limpiar.
      </p>
      
      {isLoading ? <Spinner /> : (
        <>
          <div className="subject-controls">
            <form onSubmit={handleAddSubject}>
              <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Nueva asignatura"/>
              <button type="submit">Crear</button>
            </form>
            <select onChange={e => setSelectedSubject(subjects.find(s => s.id == e.target.value))} value={selectedSubject?.id || ''}>
              <option value="">-- Selecciona una asignatura --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {selectedSubject && <button onClick={handleDeleteSubject} className="delete-button">Borrar Asignatura</button>}
          </div>
          {selectedSubject && (
            <div className="calendar-wrapper">
              <Calendar
                onClickDay={handleDayClick}
                tileClassName={tileClassName}
                value={currentDate}
                onActiveStartDateChange={handleActiveStartDateChange}
              />
              <div className="attendance-summary">
                <h4>Resumen Total de {selectedSubject.name}</h4>
                <p><span className="presente-dot"></span> Asistencias: {totalSummary.presente}</p>
                <p><span className="ausente-dot"></span> Ausencias: {totalSummary.ausente}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AttendanceCalendar;