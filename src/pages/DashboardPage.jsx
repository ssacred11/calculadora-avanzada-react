// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';

function DashboardPage() {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('subjects').select('*').eq('user_id', user.id);
      if (error) {
        toast.error('Error al cargar asignaturas');
      } else {
        setSubjects(data);
      }
    }
    setIsLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      toast.warn("El nombre no puede estar vacío.");
      return;
    }
    
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('subjects').insert({ name: newSubjectName, user_id: user.id }).select().single();
    
    if (error) {
      toast.error('Error al crear la asignatura');
    } else {
      setSubjects(prev => [...prev, data]);
      setNewSubjectName('');
      toast.success(`Asignatura "${data.name}" creada.`);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Mis Asignaturas</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </header>
      
      <main>
        <div className="subject-creator">
          <form onSubmit={handleAddSubject}>
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Nombre de la nueva asignatura"
            />
            <button type="submit">Añadir Asignatura</button>
          </form>
        </div>

        {isLoading ? <Spinner /> : (
          <div className="subjects-list">
            {subjects.length > 0 ? (
              subjects.map(subject => (
                <Link to={`/subject/${subject.id}`} key={subject.id} className="subject-card">
                  {subject.name}
                </Link>
              ))
            ) : (
              <p>Aún no tienes asignaturas. ¡Añade una para empezar!</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;