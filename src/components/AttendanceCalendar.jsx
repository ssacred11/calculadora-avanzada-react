// src/components/AttendanceCalendar.jsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

function AttendanceCalendar({ subjectId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [totalSummary, setTotalSummary] = useState({ presente: 0, ausente: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subjectId) {
      setIsLoading(true);
      Promise.all([
        fetchMonthlyRecords(subjectId, currentDate),
        fetchTotalSummary(subjectId)
      ]).finally(() => setIsLoading(false));
    }
  }, [subjectId, currentDate]);

  const fetchMonthlyRecords = async (id, date) => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    const { data, error } = await supabase.from('attendance_records').select('date, status').eq('subject_id', id).gte('date', start).lte('date', end);
    if (error) toast.error('Error al cargar asistencia del mes');
    else setMonthlyRecords(data || []);
  };

  const fetchTotalSummary = async (id) => {
    const { data, error } = await supabase.from('attendance_records').select('status').eq('subject_id', id);
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

  const handleDayClick = (date) => {
    if (!subjectId) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const existingRecord = monthlyRecords.find(r => r.date === dateString);
    const previousRecords = monthlyRecords;

    let newStatus = 'presente';
    if (existingRecord) {
      newStatus = existingRecord.status === 'presente' ? 'ausente' : null;
    }

    let updatedRecords;
    if (newStatus === null) {
      updatedRecords = monthlyRecords.filter(r => r.date !== dateString);
    } else if (existingRecord) {
      updatedRecords = monthlyRecords.map(r => r.date === dateString ? { ...r, status: newStatus } : r);
    } else {
      updatedRecords = [...monthlyRecords, { date: dateString, status: newStatus }];
    }
    setMonthlyRecords(updatedRecords);

    const syncWithDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado.");

        if (newStatus === null) {
          await supabase.from('attendance_records').delete().match({ subject_id: subjectId, date: dateString });
        } else {
          await supabase.from('attendance_records').upsert({
            subject_id: subjectId,
            user_id: user.id,
            date: dateString,
            status: newStatus
          }, { onConflict: 'subject_id, date' });
        }
        fetchTotalSummary(subjectId);
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

  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCurrentDate(activeStartDate);
  };

  const totalMarkedClasses = totalSummary.presente + totalSummary.ausente;
  const attendancePercentage = totalMarkedClasses > 0 ? (totalSummary.presente / totalMarkedClasses) * 100 : 0;

  return (
    <div className="calculator-container attendance-container">
      <h3>Control de Asistencia</h3>
       <p className="instructions">
        Haz clic en los días del calendario para cambiar el estado: <strong style={{ color: '#28a745' }}>Presente</strong> → <strong style={{ color: '#dc3545' }}>Ausente</strong> → Limpiar.
      </p>

      {isLoading ? <Spinner /> : (
        <div className="calendar-wrapper">
          <Calendar
            onClickDay={handleDayClick}
            tileClassName={tileClassName}
            value={currentDate}
            onActiveStartDateChange={handleActiveStartDateChange}
          />
          <div className="attendance-summary">
            <h4>Resumen Total</h4>
            <p><span className="presente-dot"></span> Asistencias: {totalSummary.presente}</p>
            <p><span className="ausente-dot"></span> Ausencias: {totalSummary.ausente}</p>
            <hr className="summary-divider" />
            <p className="percentage-summary">
              Asistencia Total: <strong>{attendancePercentage.toFixed(1)}%</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceCalendar;