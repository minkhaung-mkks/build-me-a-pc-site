import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token
  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('bb_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log("logging")
      const { data } = await api.post('/auth/login', { email, password });
      console.log(data)
      localStorage.setItem('bb_token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bb_token');
    setUser(null);
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    try {
      const { data } = await api.post('/auth/register', { email, password, display_name: displayName });
      localStorage.setItem('bb_token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // token invalid
      localStorage.removeItem('bb_token');
      setUser(null);
    }
  }, []);

  const value = {
    user,
    currentUser: user,
    isAuthenticated: !!user,
    isBuilder: user?.role === 'builder' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    loading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
