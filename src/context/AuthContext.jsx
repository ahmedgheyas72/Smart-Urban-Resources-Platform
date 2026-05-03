import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    setLoading(false);
  }, []);

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const isAdmin           = user?.role === 'ADMIN';
  const isServiceProvider = user?.role === 'SERVICE_PROVIDER';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isServiceProvider, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
