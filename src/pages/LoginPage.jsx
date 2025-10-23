// src/pages/LoginPage.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      navigate('/dashboard');

    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  return (
    // --- CLASE AÑADIDA ---
    <div className="auth-container">
      <h2>Ingreso de Usuario</h2>
      <form onSubmit={handleLogin} className="auth-form">
        {/* --- CLASE AÑADIDA --- */}
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {/* --- CLASE AÑADIDA --- */}
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Ingresar</button>
      </form>
      {/* --- CLASE AÑADIDA y cambio a Link --- */}
      <p className="auth-link">
        ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </div>
  );
}

export default LoginPage;