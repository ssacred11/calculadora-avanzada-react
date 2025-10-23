// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      alert('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      navigate('/login');

    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  return (
    // --- CLASE AÑADIDA ---
    <div className="auth-container">
      <h2>Crear una Cuenta</h2>
      <form onSubmit={handleRegister} className="auth-form">
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
        {/* --- CLASE AÑADIDA --- */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Registrarse</button>
      </form>
      {/* --- CLASE AÑADIDA y cambio a Link --- */}
      <p className="auth-link">
        ¿Ya tienes una cuenta? <Link to="/login">Ingresa aquí</Link>
      </p>
    </div>
  );
}

export default RegisterPage;