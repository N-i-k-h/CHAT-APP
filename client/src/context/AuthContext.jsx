import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  // Attach token globally
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (route, credentials) => {
    try {
      const { data } = await axios.post(`/api/users/${route}`, credentials);
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setAuthUser(data.userData);
        localStorage.setItem('authUser', JSON.stringify(data.userData));
        connectSocket(data.userData);
        toast.success(data.message || 'Login successful');
        navigate('/');
        return true;
      }
      toast.error(data.message || 'Login failed');
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    if (socket) socket.disconnect();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/users/check-auth');
      if (data.success) {
        setAuthUser(data.userData);
        localStorage.setItem('authUser', JSON.stringify(data.userData));
        connectSocket(data.userData);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });
  };

  const updateProfile = async (updates) => {
    try {
      const { data } = await axios.put('/api/users/update-profile', updates);
      if (data.success) {
        const updatedUser = { ...authUser, ...updates };
        setAuthUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        toast.success(data.message || 'Profile updated successfully');
        return true;
      }
      toast.error(data.message || 'Profile update failed');
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ authUser, login, logout, socket, onlineUsers, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};