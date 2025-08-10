import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { authUser } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div className="bg-[url('./assets/bgImage.svg')] bg-cover bg-fixed min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Routes location={location} key={location.key}>
        <Route 
          path="/" 
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/profile" 
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  );
};

export default App;