// src/App.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // --- AÑADIDO ---
import 'react-toastify/dist/ReactToastify.css'; // --- AÑADIDO ---

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      {/* --- CONTENEDOR DE NOTIFICACIONES AÑADIDO --- */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <Routes>
        <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <DashboardPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;