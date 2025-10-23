// src/pages/SubjectDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AverageCalculator from '../components/AverageCalculator';
import AttendanceCalendar from '../components/AttendanceCalendar';
import Spinner from '../components/Spinner';

function SubjectDetailPage() {
  const { id } = useParams(); // Obtiene el ID de la asignatura desde la URL
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error cargando la asignatura', error);
      } else {
        setSubject(data);
      }
      setLoading(false);
    };

    fetchSubject();
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="subject-detail-container">
      <Link to="/dashboard" className="back-link">← Volver a Mis Asignaturas</Link>
      <h1>{subject ? subject.name : 'Asignatura no encontrada'}</h1>

      {subject && (
        <main>
          {/* Le pasaremos el ID de la asignatura a cada calculadora */}
          <AverageCalculator subjectId={id} />
          <AttendanceCalendar subjectId={id} />
        </main>
      )}
    </div>
  );
}

export default SubjectDetailPage;