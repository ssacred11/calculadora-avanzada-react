// src/pages/SubjectDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AverageCalculator from '../components/AverageCalculator';
import AttendanceCalendar from '../components/AttendanceCalendar';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

function SubjectDetailPage() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const fetchSubject = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('subjects').select('name').eq('id', id).single();
    if (error) {
      toast.error('Error cargando la asignatura');
      navigate('/dashboard'); // Si hay error, volver al dashboard
    } else {
      setSubject(data);
    }
    setLoading(false);
  };

  // --- NUEVA FUNCIÓN PARA BORRAR DESDE LA VISTA DE DETALLE ---
  const handleDeleteSubject = async () => {
      if (!subject || !window.confirm(`¿Seguro que quieres borrar la asignatura "${subject.name}" y todos sus datos?`)) return;

      setLoading(true); // Mostrar spinner mientras borra
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) {
          toast.error('Error al borrar la asignatura.');
          setLoading(false);
      } else {
          toast.success('Asignatura borrada.');
          navigate('/dashboard'); // Volver al dashboard después de borrar
      }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="subject-detail-container">
      {/* --- ENCABEZADO MEJORADO --- */}
      <header className="subject-detail-header">
        <Link to="/dashboard" className="back-link">← Volver</Link>
        <h1>{subject ? subject.name : 'Cargando...'}</h1>
        {subject && (
          <button onClick={handleDeleteSubject} className="subject-delete-button header-delete-button">
            🗑️ Borrar Asignatura
          </button>
        )}
      </header>
      
      {subject && (
        <main>
          <AverageCalculator subjectId={id} />
          <AttendanceCalendar subjectId={id} />
        </main>
      )}
    </div>
  );
}

export default SubjectDetailPage;