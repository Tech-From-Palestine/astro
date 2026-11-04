import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    setToken(token); setUser(user); return user;
  };
  const register = async (data) => {
    const { token, user } = await api.post('/auth/register', data);
    setToken(token); setUser(user); return user;
  };
  const logout = () => { setToken(null); setUser(null); };

  const toggleFavorite = useCallback(async (productId) => {
    const { favorites } = await api.post(`/auth/me/favorites/${productId}`);
    setUser((u) => ({ ...u, favorites }));
  }, []);

  const isStaff = user && ['admin', 'staff'].includes(user.role);
  const can = (perm) => user && (user.role === 'admin' || (user.role === 'staff' && user.permissions?.includes(perm)));

  return (
    <AuthCtx.Provider value={{ user, setUser, ready, login, register, logout, toggleFavorite, isStaff, can }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
